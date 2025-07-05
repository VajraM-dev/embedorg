import boto3
import os

# S3 Client Setup
s3_client = boto3.client(
    "s3",
)
S3_BUCKET_NAME = os.environ.get("AWS_BUCKET_NAME")
