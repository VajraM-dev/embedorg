from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
from sqlalchemy import func
from defaults.db_engine import engine
# Import from your existing schema
from database.create_schema import Project

from database.create_schema import FileAssociatedId
from database.create_schema import File as FileModel
from embeddings.vs_connect import vector_stor_connection
from defaults.s3_client import s3_client, S3_BUCKET_NAME

app = APIRouter()

# Pydantic models for request/response
class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None
    vector_index_name: Optional[str] = None
    team_id: uuid.UUID

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    vector_index_name: Optional[str] = None

class ProjectResponse(ProjectBase):
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

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

# CRUD Endpoints for Projects

@app.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    try:
        db_project = Project(
            project_name=project.project_name,
            description=project.description,
            vector_index_name=project.vector_index_name,
            team_id=project.team_id
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/", response_model=List[ProjectResponse])
async def get_all_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all projects with pagination"""
    try:
        projects = db.query(Project).offset(skip).limit(limit).all()
        return projects
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    
# get project stats number of projects, number of files, number of embeddings, embedded and non embedded files
@app.get("/stats", response_model=dict)
async def get_project_stats(db: Session = Depends(get_db)):
    """Get project statistics"""
    try:
        total_projects = db.query(func.count(Project.project_id)).scalar()
        total_files = db.query(func.count(FileModel.file_id)).scalar()
        embedded_files = db.query(func.count(FileModel.file_id)).filter(FileModel.is_embedded.is_(True)).scalar()
        non_embedded_files = db.query(func.count(FileModel.file_id)).filter(FileModel.is_embedded.is_(False)).scalar()
        total_embeddings = db.query(func.count(FileAssociatedId.associated_id)).scalar()

        return {
            "total_projects": total_projects,
            "total_files": total_files,
            "embedded_files": embedded_files,
            "non_embedded_files": non_embedded_files,
            "total_embeddings": total_embeddings
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project stats: {str(e)}"
        )
    
@app.get("/{project_id}/stats")
def get_specific_project_stats(project_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Returns stats for a specific project:
    - total_files
    - embedded_files
    - non_embedded_files
    - total_embeddings (split IDs)
    """
    try:
        # Fetch the project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID {project_id} not found"
            )

        # Fetch stats
        total_files = db.query(func.count(FileModel.file_id)).filter(FileModel.project_id == project_id).scalar()
        embedded_files = db.query(func.count(FileModel.file_id)).filter(FileModel.project_id == project_id, FileModel.is_embedded.is_(True)).scalar()
        non_embedded_files = db.query(func.count(FileModel.file_id)).filter(FileModel.project_id == project_id, FileModel.is_embedded.is_(False)).scalar()
        total_embeddings = (
            db.query(func.count(FileAssociatedId.associated_id))
            .join(FileModel, FileAssociatedId.file_id == FileModel.file_id)
            .filter(FileModel.project_id == project_id)
            .scalar()
        )

        return {
            "total_files": total_files,
            "embedded_files": embedded_files,
            "non_embedded_files": non_embedded_files,
            "total_embeddings": total_embeddings
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project stats: {str(e)}"
        )

@app.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific project by ID"""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    return project



@app.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID, 
    project_update: ProjectUpdate, 
    db: Session = Depends(get_db)
):
    """Update a project's information"""
    try:
        db_project = db.query(Project).filter(Project.project_id == project_id).first()
        if db_project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID {project_id} not found"
            )
        
        update_data = project_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_project, key, value)
        
        db_project.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_project)
        return db_project
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a project:
    - Delete embeddings via vector store (from all associated files)
    - Delete associated IDs from DB
    - Delete files from S3 and DB
    - Delete project from DB
    """
    try:
        # Step 1: Fetch the project
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID {project_id} not found"
            )

        # Step 2: Collect all associated files
        files = db.query(FileModel).filter(FileModel.project_id == project_id).all()

        # Step 3: Process each file
        for file in files:
            # 3.1 Delete embeddings via vector store
            associated_records = db.query(FileAssociatedId).filter(FileAssociatedId.file_id == file.file_id).all()
            if associated_records:
                vs = vector_stor_connection(project_id)
                vs.vector_store.delete(ids=[str(record.id_value) for record in associated_records])

                for record in associated_records:
                    db.delete(record)

            # 3.2 Delete file from S3
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=file.storage_path)

            # 3.3 Delete file from DB
            db.delete(file)

        # Step 4: Delete project record
        db.delete(project)

        # Step 5: Commit all
        db.commit()
        return None

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Project deletion failed: {str(e)}"
        )
    
