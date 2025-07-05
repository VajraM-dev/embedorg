from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from defaults.db_engine import engine
# Import from your existing schema
from database.create_schema import Team

app = APIRouter()

# Pydantic models for request/response
class TeamBase(BaseModel):
    team_name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    team_name: Optional[str] = None
    description: Optional[str] = None

class TeamResponse(TeamBase):
    team_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

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

# CRUD Endpoints for Teams

@app.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(team: TeamCreate, db: Session = Depends(get_db)):
    """Create a new team"""
    try:
        db_team = Team(
            team_name=team.team_name,
            description=team.description
        )
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
        return db_team
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/", response_model=List[TeamResponse])
async def get_all_teams(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all teams with pagination"""
    try:
        teams = db.query(Team).offset(skip).limit(limit).all()
        return teams
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/{team_id}", response_model=TeamResponse)
async def get_team(team_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific team by ID"""
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found"
        )
    return team

@app.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: uuid.UUID, 
    team_update: TeamUpdate, 
    db: Session = Depends(get_db)
):
    """Update a team's information"""
    try:
        db_team = db.query(Team).filter(Team.team_id == team_id).first()
        if db_team is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team with ID {team_id} not found"
            )
        
        # Update only the fields that were provided
        update_data = team_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_team, key, value)
        
        # Update the updated_at timestamp
        db_team.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_team)
        return db_team
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    
@app.get("/name/{team_name}", response_model=TeamResponse)
async def get_team_by_name(team_name: str, db: Session = Depends(get_db)):
    """Get a specific team by name"""
    team = db.query(Team).filter(Team.team_name == team_name).first()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with name '{team_name}' not found"
        )
    return team

@app.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(team_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a team"""
    try:
        db_team = db.query(Team).filter(Team.team_id == team_id).first()
        if db_team is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team with ID {team_id} not found"
            )
        
        db.delete(db_team)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

class ProjectResponse(BaseModel):
    project_id: uuid.UUID
    project_name: str
    description: Optional[str] = None
    vector_index_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@app.get("/{team_id}/projects", response_model=List[ProjectResponse])
async def get_team_projects(team_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all projects for a specific team"""
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found"
        )
    
    return team.projects