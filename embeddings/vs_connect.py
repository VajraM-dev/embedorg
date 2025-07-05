from langchain_postgres import PGVector

from embeddings.helper_functions import get_vector_index_name_by_project_id, get_db
from embeddings.embedding_settings import Settings

settings = Settings()

# inside any FastAPI route or other internal function
def get_collection_name(project_id: str) -> str:
    db = next(get_db())  # assuming get_db() is your session generator
    try:
        return get_vector_index_name_by_project_id(project_id, db)
    except ValueError as e:
        raise "Project ID not found or vector index name not set." \
              f"Error: {str(e)}"

class vector_stor_connection:
    def __init__(self, project_id: str):
        if not settings.embeddings:
            raise ValueError("No embedding model found.")
        if not settings.DATABASE_URL:
            raise ValueError("No database URL found.")

        self.vector_store = PGVector(
            embeddings=settings.embeddings,
            collection_name=get_collection_name(project_id),
            connection=settings.DATABASE_URL,
            use_jsonb=True,
        )

    def push_embeddings_to_vector_store(self, splits):
        self.vector_store.add_documents(splits, ids=[doc.metadata["id"] for doc in splits])