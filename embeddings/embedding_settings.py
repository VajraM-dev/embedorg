from dotenv import load_dotenv
import os
from defaults.s3_client import S3_BUCKET_NAME
from embeddings.helper_functions import get_embedding_value_by_field_name, get_db
from langchain_aws import BedrockEmbeddings

load_dotenv(override=True)

# inside any FastAPI route or other internal function
db = next(get_db())  # assuming get_db() is your session generator
try:
    model_name = get_embedding_value_by_field_name("model_name", db) or os.environ.get("EMBEDDING_MODEL")
    region_name = get_embedding_value_by_field_name("region", db) or os.environ.get("EMBEDDING_MODEL_REGION")
except ValueError as e:
    print("Error: ", str(e))
    raise ValueError("Model name or region not found in the database or environment variables.")

DB_HOST=os.environ.get("DB_HOST")
DB_PORT=os.environ.get("DB_PORT")
DB_NAME=os.environ.get("PG_VECTOR_DB_NAME")
DB_USER=os.environ.get("DB_USER")
DB_PASSWORD=os.environ.get("DB_PASSWORD")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

credentials_profile_name=os.environ.get("CREDENTIAL_PROFILE_NAME")

embeddings = BedrockEmbeddings(
    credentials_profile_name=credentials_profile_name, 
    region_name=region_name,
    model_id=model_name
)

class Settings:
    def __init__(self):
        self.S3_BUCKET_NAME = S3_BUCKET_NAME
        self.DATABASE_URL = DATABASE_URL
        self.embeddings = embeddings
        
