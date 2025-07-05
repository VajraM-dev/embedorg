from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List
import uuid
from embeddings.doc_loader import extract_text_from_s3_file
from database.create_schema import File as FileModel
from defaults.db_engine import engine
from embeddings.vs_connect import vector_stor_connection
from database.create_schema import FileAssociatedId
import asyncio

app = APIRouter()

# Database connection dependency
def get_db():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for request body
class FileIDsRequest(BaseModel):
    file_ids: List[uuid.UUID]

async def process_single_file(db_file: FileModel):
    """
    Process a single file (custom logic here)
    """
    if db_file.project_id is None:
        raise ValueError(f"File {db_file.file_id} has no associated project_id.")
    if db_file.is_embedded:
        # Skip if already embedded
        return db_file.file_id
    if db_file.storage_path is None:   
        raise ValueError(f"File {db_file.file_id} has no storage path.")
    splits = extract_text_from_s3_file(db_file.storage_path, db_file.file_id)
    vs = vector_stor_connection(db_file.project_id)
    vs.push_embeddings_to_vector_store(splits)
    return db_file.file_id

@app.post("/create-embeddings", status_code=status.HTTP_200_OK)
async def create_embeddings(request: FileIDsRequest, db: Session = Depends(get_db)):
    """
    Concurrently process files and update 'is_embedded' flags in batch.
    """
    try:
        # Fetch all files first
        files = db.query(FileModel).filter(FileModel.file_id.in_(request.file_ids)).all()

        if not files:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No files found for given file_ids"
            )

        # Async parallel processing with per-file exception handling
        async def safe_process(file):
            try:
                return await process_single_file(file)
            except Exception as e:
                # Log or collect errors if needed
                print(e)

        tasks = [safe_process(file) for file in files]
        results = await asyncio.gather(*tasks)

        # Filter successful results
        processed_file_ids = [fid for fid in results if fid is not None]

        # Bulk update is_embedded flag
        db.query(FileModel).filter(FileModel.file_id.in_(processed_file_ids)).update(
            {"is_embedded": True},
            synchronize_session=False
        )
        db.commit()

        return {"message": f"{len(processed_file_ids)} files processed and embeddings created successfully."}

    except SQLAlchemyError as db_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(db_err)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding creation failed: {str(e)}"
        )

@app.delete("/delete-embeddings-ids/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_associated_ids_by_file_id(file_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete all associated IDs for a given file_id from FileAssociatedId table.
    """
    try:
        records = db.query(FileAssociatedId).filter(FileAssociatedId.file_id == file_id).all()
        project_id = db.query(FileModel).filter(FileModel.file_id == file_id).first().project_id
        if not project_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project ID not found for file_id {file_id}"
            )
        
        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No associated IDs found for file_id {file_id}"
            )

        vs = vector_stor_connection(project_id)
        vs.vector_store.delete(ids=[str(record.id_value) for record in records])
        
        for record in records:
            db.delete(record)
        
        db.query(FileModel).filter(FileModel.file_id == file_id).update({"is_embedded": False})
        
        db.commit()
        return None

    except Exception as e:
        db.rollback()
        raise e