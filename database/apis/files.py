from fastapi import APIRouter, HTTPException, Depends, status,  UploadFile, Form
from fastapi import File as FastAPIFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
from defaults.s3_client import s3_client, S3_BUCKET_NAME
# Import from your existing schema
from defaults.db_engine import engine
from database.create_schema import File
from database.create_schema import File as FileModel
app = APIRouter()

# Pydantic models for request/response
class FileBase(BaseModel):
    project_id: uuid.UUID
    file_name: str
    storage_path: str
    mime_type: Optional[str] = None
    is_embedded: Optional[bool] = False
    size_bytes: Optional[int] = None
    uploaded_by_cognito_sub: Optional[str] = None

class FileCreate(FileBase):
    pass

class FileUpdate(BaseModel):
    file_name: Optional[str] = None
    storage_path: Optional[str] = None
    mime_type: Optional[str] = None
    is_embedded: Optional[bool] = None
    size_bytes: Optional[int] = None
    uploaded_by_cognito_sub: Optional[str] = None

class FileResponse(FileBase):
    file_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FileStats(BaseModel):
    total_files: int
    embedded_files: int

class FileListResponse(BaseModel):
    files: List[FileResponse]
    stats: FileStats

# Database connection dependency
def get_db():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CRUD Endpoints for Files

@app.post("/", status_code=status.HTTP_201_CREATED)
async def upload_files_to_project(
    project_id: uuid.UUID = Form(...),
    files: List[UploadFile] = FastAPIFile(...),
    db: Session = Depends(get_db)
):
    """Upload one or more files to a project and store in S3"""
    uploaded_file_responses = []
    try:
        for upload in files:
            file_bytes = await upload.read()  # Read once properly

            if not file_bytes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File content is empty"
                )

            # Generate a unique S3 path
            s3_key = f"projects/{project_id}/{uuid.uuid4()}_{upload.filename}"

            print(f"Uploading file: {upload.filename} with size {len(file_bytes)} bytes")
            print(f"S3 Key: {s3_key}")

            # Ensure the content type is valid
            if not upload.content_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid content type"
                )

            # Upload to S3 using bytes
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType=upload.content_type
            )

            # Create DB entry
            db_file = FileModel(
                project_id=project_id,
                file_name=upload.filename,
                storage_path=s3_key,
                mime_type=upload.content_type,
                is_embedded=False,
                size_bytes=len(file_bytes),
                uploaded_by_cognito_sub=None  # Set if required
            )
            db.add(db_file)
            db.commit()
            db.refresh(db_file)

            uploaded_file_responses.append({
                "file_id": str(db_file.file_id),
                "file_name": db_file.file_name,
                "s3_key": db_file.storage_path
            })
        
        return {"uploaded_files": uploaded_file_responses}

    except SQLAlchemyError as db_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(db_err)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@app.get("/", response_model=List[FileResponse])
async def get_all_files(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all files with pagination"""
    try:
        files = db.query(File).offset(skip).limit(limit).all()
        return files
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/{file_id}", response_model=FileResponse)
async def get_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific file by ID"""
    file = db.query(File).filter(File.file_id == file_id).first()
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )
    return file

@app.put("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: uuid.UUID, 
    file_update: FileUpdate, 
    db: Session = Depends(get_db)
):
    """Update a file's information"""
    try:
        db_file = db.query(File).filter(File.file_id == file_id).first()
        if db_file is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File with ID {file_id} not found"
            )
        
        update_data = file_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_file, key, value)
        
        db_file.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_file)
        return db_file
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

def count_files(files: list[dict]) -> dict:
    """
    Returns the total number of files and number of embedded files.
    
    :param files: List of file metadata dictionaries
    :return: (total_files, embedded_files)
    """
    total_files = len(files)
    embedded_files = sum(1 for f in files if getattr(f, "is_embedded", False))
    stats = {
        "total_files": total_files,
        "embedded_files": embedded_files
    }
    return stats

# get all files associated with a project
@app.get("/projects/{project_id}", response_model=FileListResponse)
async def get_files_by_project(
    project_id: uuid.UUID, 
    db: Session = Depends(get_db)
):
    """Get all files associated with a specific project"""
    try:
        files = db.query(File).filter(File.project_id == project_id).all()
        if not files:
            return []
            # raise HTTPException(
            #     status_code=status.HTTP_404_NOT_FOUND,
            #     detail=f"No files found for project ID {project_id}"
            # )

        response = {
            "files": files,
            "stats": count_files(list(files))
        }
        return response
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# @app.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
#     """Delete a file"""
#     try:
#         db_file = db.query(File).filter(File.file_id == file_id).first()
#         if db_file is None:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail=f"File with ID {file_id} not found"
#             )
        
#         db.delete(db_file)
#         db.commit()
#         return None
#     except SQLAlchemyError as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Database error: {str(e)}"
#         )

@app.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete file from S3 and remove record from database.
    """
    try:
        db_file = db.query(FileModel).filter(FileModel.file_id == file_id).first()
        if not db_file:
            raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found")

        # Delete from S3
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=db_file.storage_path)

        # Delete from DB
        db.delete(db_file)
        db.commit()
        return None

    except SQLAlchemyError as db_err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {db_err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")