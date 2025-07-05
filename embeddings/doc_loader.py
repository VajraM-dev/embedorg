from langchain_community.document_loaders import S3FileLoader
from embeddings.embedding_settings import Settings
from langchain_text_splitters import RecursiveCharacterTextSplitter
import uuid
from embeddings.helper_functions import get_db, add_file_associated_ids
import re

settings = Settings()
S3_BUCKET_NAME = settings.S3_BUCKET_NAME

separators=[
        "\n\n",
        "\n",
        " ",
        ".",
        ",",
        "\u200b",  # Zero-width space
        "\uff0c",  # Fullwidth comma
        "\u3001",  # Ideographic comma
        "\uff0e",  # Fullwidth full stop
        "\u3002",  # Ideographic full stop
        "",
    ]

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000,
                                chunk_overlap=100,
                                separators=separators)

def generate_unique_ids(n: int):
        """
        Generate n unique UUIDs.
        
        :param n: Number of unique IDs to generate
        :return: List of unique UUIDs as strings
        """
        return [str(uuid.uuid4()) for _ in range(n)]

def clean_string(s: str) -> str:
    # Remove NUL and control characters (except newline, tab, carriage return)
    s = s.replace('\x00', '')
    s = re.sub(r'[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', s)
    # Optionally, normalize whitespace
    s = s.replace('\u00A0', ' ')  # non-breaking space to regular space
    return s

def extract_text_from_s3_file(key: str, source_id: str):
    loader = S3FileLoader(S3_BUCKET_NAME, key)

    splits = loader.load_and_split(text_splitter=text_splitter)
    if not splits:
        raise ValueError("No text found in the file.")
    
    for i, item in enumerate(splits):
        item.page_content = clean_string(item.page_content)
    
    ids = generate_unique_ids(len(splits))

    source_id_map = {
        "source_id": source_id,
        "associated_ids": ids
    }

    for i, item in enumerate(splits):
        item.metadata.update({"id": ids[i]})

    db = next(get_db())
    source_id = source_id_map["source_id"]
    split_ids = source_id_map["associated_ids"]  # Example splits

    add_file_associated_ids(source_id, split_ids, db)

    return splits