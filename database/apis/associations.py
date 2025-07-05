from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List
import uuid
from datetime import datetime

# Import from your existing schema
from database.create_schema import FileAssociatedId
from defaults.db_engine import engine

app = APIRouter()

# Pydantic models for request/response
class FileAssociatedIdBase(BaseModel):
    file_id: uuid.UUID
    id_value: str
    id_type: str

class FileAssociatedIdCreate(FileAssociatedIdBase):
    pass

class FileAssociatedIdUpdate(BaseModel):
    id_value: str
    id_type: str

class FileAssociatedIdResponse(FileAssociatedIdBase):
    associated_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Database connection dependency
def get_db():
    # engine, _ = setup_database(DATABASE_URL)
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CRUD Endpoints for FileAssociatedId

@app.post("/", response_model=FileAssociatedIdResponse, status_code=status.HTTP_201_CREATED)
async def create_file_associated_id(assoc: FileAssociatedIdCreate, db: Session = Depends(get_db)):
    """Create a new file associated ID"""
    try:
        db_assoc = FileAssociatedId(
            file_id=assoc.file_id,
            id_value=assoc.id_value,
            id_type=assoc.id_type
        )
        db.add(db_assoc)
        db.commit()
        db.refresh(db_assoc)
        return db_assoc
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/", response_model=List[FileAssociatedIdResponse])
async def get_all_file_associated_ids(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all file associated IDs with pagination"""
    try:
        assocs = db.query(FileAssociatedId).offset(skip).limit(limit).all()
        return assocs
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/{associated_id}", response_model=FileAssociatedIdResponse)
async def get_file_associated_id(associated_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific file associated ID"""
    assoc = db.query(FileAssociatedId).filter(FileAssociatedId.associated_id == associated_id).first()
    if assoc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Associated ID {associated_id} not found"
        )
    return assoc

@app.put("/{associated_id}", response_model=FileAssociatedIdResponse)
async def update_file_associated_id(
    associated_id: uuid.UUID, 
    assoc_update: FileAssociatedIdUpdate, 
    db: Session = Depends(get_db)
):
    """Update a file associated ID"""
    try:
        db_assoc = db.query(FileAssociatedId).filter(FileAssociatedId.associated_id == associated_id).first()
        if db_assoc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Associated ID {associated_id} not found"
            )
        
        db_assoc.id_value = assoc_update.id_value
        db_assoc.id_type = assoc_update.id_type
        
        db.commit()
        db.refresh(db_assoc)
        return db_assoc
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.delete("/{associated_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_associated_id(associated_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a file associated ID"""
    try:
        db_assoc = db.query(FileAssociatedId).filter(FileAssociatedId.associated_id == associated_id).first()
        if db_assoc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Associated ID {associated_id} not found"
            )
        
        db.delete(db_assoc)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    
@app.delete("/delete-associated-ids/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_associated_ids_by_file_id(file_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete all associated IDs for a given file_id from FileAssociatedId table.
    """
    try:
        records = db.query(FileAssociatedId).filter(FileAssociatedId.file_id == file_id).all()
        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No associated IDs found for file_id {file_id}"
            )
        
        for record in records:
            db.delete(record)
        
        db.commit()
        return None

    except SQLAlchemyError as db_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(db_err)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deletion failed: {str(e)}"
        )
