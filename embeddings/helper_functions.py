from sqlalchemy.orm import Session
from defaults.db_engine import engine
from database.create_schema import EmbeddingModel
from database.create_schema import Project
import uuid
from database.create_schema import FileAssociatedId
from datetime import datetime

# Database connection dependency
def get_db():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_embedding_value_by_field_name(field_name: str, db: Session) -> str:
    """
    Fetch the 'value' for a given field_name from EmbeddingModel.

    Args:
        field_name (str): The name of the field to search for.
        db (Session): SQLAlchemy session.

    Returns:
        str: The value associated with the given field_name.

    Raises:
        ValueError: If no matching field_name is found.
    """
    record = db.query(EmbeddingModel).filter(EmbeddingModel.field_name == field_name).first()
    if record is None:
        raise ValueError(f"EmbeddingModel with field_name '{field_name}' not found.")
    return record.value

def get_vector_index_name_by_project_id(project_id: uuid.UUID, db: Session) -> str:
    """
    Fetch the 'vector_index_name' for a given project_id from Project table.

    Args:
        project_id (uuid.UUID): The project ID to search for.
        db (Session): SQLAlchemy session.

    Returns:
        str: The vector_index_name associated with the given project_id.

    Raises:
        ValueError: If no matching project_id is found or vector_index_name is None.
    """
    record = db.query(Project).filter(Project.project_id == project_id).first()
    if record is None:
        raise ValueError(f"Project with project_id '{project_id}' not found.")
    if not record.vector_index_name:
        raise ValueError(f"Project '{project_id}' does not have a vector_index_name set.")
    return record.vector_index_name

def add_file_associated_ids(source_id: uuid.UUID, ids: list[uuid.UUID], db: Session) -> None:
    """
    Insert multiple associated IDs for a given file_id into the FileAssociatedId table.

    Args:
        source_id (uuid.UUID): The file_id from the files table.
        ids (list[uuid.UUID]): List of UUIDs representing the splits.
        db (Session): SQLAlchemy session.

    Raises:
        SQLAlchemyError: If insertion fails.
    """
    try:
        existing_ids = db.query(FileAssociatedId.id_value).filter(
            FileAssociatedId.file_id == source_id,
        ).all()

        existing_id_set = set(row[0] for row in existing_ids)

        for split_id in ids:
            str_id = str(split_id)
            if str_id in existing_id_set:
                continue
            db_entry = FileAssociatedId(
                file_id=source_id,
                id_value=str(split_id),
                id_type="split_id",  # Static type, you can modify if needed
                created_at=datetime.utcnow()
            )
            db.add(db_entry)
        
        db.commit()

    except Exception as e:
        db.rollback()
        raise e

