from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import uuid
from defaults.db_engine import engine
# Import from your existing schema
from database.create_schema import Project
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv(override=True)

DB_HOST=os.environ.get("DB_HOST")
DB_PORT=os.environ.get("DB_PORT")
DB_NAME=os.environ.get("DB_NAME")
DB_USER=os.environ.get("DB_USER")
DB_PASSWORD=os.environ.get("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/rag_platform_pgvector"

app = APIRouter()

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

# given a project id, return the vector_index_name for the project
@app.get("/collection_name/{project_id}", response_model=dict)
async def get_vector_index_name(project_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get the vector index name for a project"""
    try:
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        response = {
            "project_name": project.project_name,
            "vector_index_name": project.vector_index_name,
            "connection": str(DATABASE_URL)
        }
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project stats: {str(e)}"
        )

class CallExample(BaseModel):
    curl: str
    python_requests: str
    langchain_code: str

@app.get("/usage/{project_id}/code", response_model=CallExample)
def get_code_to_call_collection(project_id: uuid.UUID):
    """
    Return example curl and Python requests code to call /publish/collection_name/{project_id}
    """
    base_url = "http://localhost:7410"
    token_placeholder = "<YOUR_BEARER_TOKEN>"

    curl_cmd = (
        f"curl -X GET '{base_url}/publish/collection_name/{project_id}' \\\n"
        f"  -H 'Authorization: Bearer {token_placeholder}'"
    )

    python_code = (
        "import requests\n\n"
        f"url = '{base_url}/publish/collection_name/{project_id}'\n"
        f"headers = {{'Authorization': 'Bearer {token_placeholder}'}}\n"
        "response = requests.get(url, headers=headers)\n"
        "print(response.json())"
    )

    langchain_code = (
        f"""
        import requests
        from langchain_postgres import PGVector
        
        embeddings = BedrockEmbeddings(
            credentials_profile_name=<CREDENTIALS_PROFILE_NAME>, 
            region_name=<REGION_NAME>,
            model_id=<MODEL_NAME>
        )

        url = '{base_url}/publish/collection_name/{project_id}'
        headers = {{"Authorization": "Bearer {token_placeholder}"}}
        response = requests.get(url, headers=headers).json()
        print(response)

        # See docker command above to launch a postgres instance with pgvector enabled.
        connection = response['connection']  # Uses psycopg3!
        collection_name = response['vector_index_name']

        vector_store = PGVector(
            embeddings=embeddings,
            collection_name=collection_name,
            connection=connection,
            use_jsonb=True,
        )
        """
    )

    return CallExample(curl=curl_cmd, python_requests=python_code, langchain_code=langchain_code)