from sqlalchemy import Column, String, Text, DateTime, Boolean, BigInteger, ForeignKey, create_engine, inspect
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os
from sqlalchemy.orm import sessionmaker
# Load environment variables
load_dotenv(override=True)

DB_HOST=os.environ.get("DB_HOST")
DB_PORT=os.environ.get("DB_PORT")
DB_NAME=os.environ.get("DB_NAME")
DB_USER=os.environ.get("DB_USER")
DB_PASSWORD=os.environ.get("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

Base = declarative_base()

class Team(Base):
    __tablename__ = 'teams'
    
    team_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="team")
    
    def __repr__(self):
        return f"<Team(team_name='{self.team_name}')>"

class Postgres(Base):
    __tablename__ = 'postgres'
    
    field_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_name = Column(String, nullable=False)
    value = Column(String)
    
    def __repr__(self):
        return f"<Postgres(field_name='{self.field_name}')>"

class EmbeddingModel(Base):
    __tablename__ = 'embedding_model'
    
    field_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_name = Column(String, nullable=False)
    value = Column(String)
    
    def __repr__(self):
        return f"<EmbeddingModel(field_name='{self.field_name}')>"

class Project(Base):
    __tablename__ = 'projects'
    
    project_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.team_id'), nullable=False)
    project_name = Column(String, nullable=False)
    description = Column(Text)
    vector_index_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    team = relationship("Team", back_populates="projects")
    files = relationship("File", back_populates="project")
    
    def __repr__(self):
        return f"<Project(project_name='{self.project_name}')>"

class File(Base):
    __tablename__ = 'files'
    
    file_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.project_id'), nullable=False)
    file_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    mime_type = Column(String)
    is_embedded = Column(Boolean, default=False)
    size_bytes = Column(BigInteger)
    uploaded_by_cognito_sub = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="files")
    associated_ids = relationship("FileAssociatedId", back_populates="file")
    
    def __repr__(self):
        return f"<File(file_name='{self.file_name}')>"

class FileAssociatedId(Base):
    __tablename__ = 'file_associated_ids'
    
    associated_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey('files.file_id'), nullable=False)
    id_value = Column(String, nullable=False)
    id_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("File", back_populates="associated_ids")
    
    def __repr__(self):
        return f"<FileAssociatedId(id_type='{self.id_type}', id_value='{self.id_value}')>"


# Function to check if schema exists and create it if it doesn't
def setup_database(database_url):
    """
    Checks if the schema already exists in the database.
    If not, creates all tables defined in the schema.
    
    Args:
        database_url: PostgreSQL connection URL in the format
                     postgresql://username:password@host:port/database_name
    
    Returns:
        engine: SQLAlchemy engine object
        created: Boolean indicating whether tables were created (True) or already existed (False)
    """
    engine = create_engine(database_url)
    inspector = inspect(engine)
    
    # Get list of existing tables in the database
    existing_tables = inspector.get_table_names()
    required_tables = ['teams', 'postgres', 'embedding_model', 'projects', 'files', 'file_associated_ids']
    
    # Check if all required tables already exist
    all_tables_exist = all(table in existing_tables for table in required_tables)
    
    if all_tables_exist:
        print("Schema already exists. Skipping table creation.")
        return engine, False
    else:
        print("Creating schema tables...")
        Base.metadata.create_all(engine)
        print("Schema created successfully.")

        # Seed default values into embedding_model
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        try:
            defaults = [
                EmbeddingModel(field_name="region", value=os.environ.get("EMBEDDING_MODEL_REGION")),
                EmbeddingModel(field_name="model_name", value=os.environ.get("EMBEDDING_MODEL"))
            ]
            session.add_all(defaults)
            session.commit()
            print("Default embedding_model entries inserted.")
        except Exception as e:
            session.rollback()
            print(f"Failed to insert default embedding_model values: {e}")
        finally:
            session.close()

        return engine, True



def execute_schema():
    _, created = setup_database(DATABASE_URL)

    return created