from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List, Optional
import uuid

# Import from your existing schema
from database.create_schema import EmbeddingModel as EmbeddingModelDB
from defaults.db_engine import engine

app = APIRouter()

# Pydantic models for request/response
class EmbeddingModelBase(BaseModel):
    field_name: str
    value: Optional[str] = None

class EmbeddingModelCreate(EmbeddingModelBase):
    pass

class EmbeddingModelUpdate(BaseModel):
    field_name: Optional[str] = None
    value: Optional[str] = None

class EmbeddingModelResponse(EmbeddingModelBase):
    field_id: uuid.UUID

    class Config:
        from_attributes = True

# Database connection dependency
def get_db():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CRUD Endpoints for EmbeddingModel

@app.post("/", response_model=EmbeddingModelResponse, status_code=status.HTTP_201_CREATED)
async def create_embedding_model(model: EmbeddingModelCreate, db: Session = Depends(get_db)):
    """Create a new embedding model entry"""
    try:
        db_model = EmbeddingModelDB(
            field_name=model.field_name,
            value=model.value
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/", response_model=List[EmbeddingModelResponse])
async def get_all_embedding_models(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all embedding models with pagination"""
    try:
        models = db.query(EmbeddingModelDB).offset(skip).limit(limit).all()
        return models
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/{field_id}", response_model=EmbeddingModelResponse)
async def get_embedding_model(field_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific embedding model by ID"""
    model = db.query(EmbeddingModelDB).filter(EmbeddingModelDB.field_id == field_id).first()
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Embedding model with ID {field_id} not found"
        )
    return model

@app.put("/{field_id}", response_model=EmbeddingModelResponse)
async def update_embedding_model(
    field_id: uuid.UUID,
    model_update: EmbeddingModelUpdate,
    db: Session = Depends(get_db)
):
    """Update an embedding model entry"""
    try:
        db_model = db.query(EmbeddingModelDB).filter(EmbeddingModelDB.field_id == field_id).first()
        if db_model is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Embedding model with ID {field_id} not found"
            )

        update_data = model_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_model, key, value)

        db.commit()
        db.refresh(db_model)
        return db_model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_embedding_model(field_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete an embedding model entry"""
    try:
        db_model = db.query(EmbeddingModelDB).filter(EmbeddingModelDB.field_id == field_id).first()
        if db_model is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Embedding model with ID {field_id} not found"
            )
        
        db.delete(db_model)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

