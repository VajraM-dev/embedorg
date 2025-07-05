# RAG Platform Backend

A FastAPI-based backend service for a Retrieval Augmented Generation (RAG) platform that provides document management, generating embeddings, and vector storage capabilities, and endpoint usage for documents within your organization.

## Features

- User Authentication with AWS Cognito
- Document Management System
- Team and Project Organization
- File Upload and S3 Integration
- Vector Embeddings Generation using AWS Bedrock
- Vector Storage with pgvector
- RESTful API Interface

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with pgvector extension
- **Authentication**: AWS Cognito
- **Storage**: AWS S3
- **Embeddings**: AWS Bedrock (Titan Embeddings)
- **Containerization**: Docker
- **Vector Store**: Langchain PGVector

## Prerequisites

- Python 3.10+
- Docker and Docker Compose
- AWS Account with necessary services configured:
  - S3 Bucket
  - Cognito User Pool
  - AWS Bedrock access
- PostgreSQL with pgvector extension

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Auth Setup
COGNITO_DOMAIN=your-cognito-domain
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
COGNITO_REGION=your-region
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_REDIRECT_URI=http://localhost:7410/home
ENVIRONMENT=development

# Database Setup
DB_HOST=pgvectorForRAG
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
PG_VECTOR_DB_NAME=rag_platform_pgvector

# AWS Setup
AWS_BUCKET_NAME=your-s3-bucket-name
CREDENTIAL_PROFILE_NAME=default
EMBEDDING_MODEL_REGION=us-east-1
EMBEDDING_MODEL=amazon.titan-embed-text-v2:0

# Auth Bypass (for development)
AUTH_ENABLED=true
```

## Installation & Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd rag_platform_backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure AWS credentials:
   - Ensure AWS credentials are properly configured in `~/.aws/credentials`
   - Or mount credentials when using Docker

4. Start the services using Docker Compose:
```bash
docker-compose up -d
```

## Docker Deployment

For development:
```bash
docker-compose up -d
```

For production:
```bash
docker-compose -f prod-docker-compose.yaml up -d
```

## Development

The application will be available at `http://localhost:7410`

- API Documentation (Development): `http://localhost:7410/docs`
- ReDoc Documentation (Development): `http://localhost:7410/redoc`

## Security Notes

- Ensure proper AWS IAM roles and permissions are configured
- Keep your `.env` file secure and never commit it to version control
- Use strong passwords for database access
- Enable proper CORS settings in production
- Configure proper network security groups and firewalls