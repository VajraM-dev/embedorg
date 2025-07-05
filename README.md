# EmbedOrg Platform

A full-stack, containerized platform enabling document management, vector embeddings generation, and semantic search for organizations.

---

## Key Features

* **User Authentication:** AWS Cognito-based.
* **Document Management:** Manage documents by teams and projects.
* **Vector Embeddings:** AWS Bedrock (Titan Embeddings) powered.
* **Vector Storage:** PostgreSQL with pgvector for semantic search.
* **RESTful API:** FastAPI backend.
* **Web Frontend:** Containerized frontend interface.
* **Cloud Storage:** AWS S3 integration.

---

## Tech Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Backend          | FastAPI, PostgreSQL (pgvector), Langchain |
| Authentication   | AWS Cognito                               |
| Embeddings       | AWS Bedrock (Titan Embeddings)            |
| Storage          | AWS S3                                    |
| Frontend         | \[Specify your frontend stack here]       |
| Containerization | Docker, Docker Compose                    |
| Package Manager  | uv (for Python dependencies)              |

---

## Prerequisites

* Python 3.10+
* Docker & Docker Compose
* AWS Account with:

  * S3 Bucket
  * Cognito User Pool
  * Bedrock Access
* PostgreSQL with pgvector extension

---

## Environment Variables

A sample `.env.example` is provided with all required environment variables.

### Steps:

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update values as per your environment.

---

## Installation & Setup

### 1. Clone Repository:

```bash
git clone <repository-url>
cd embed_org_project
```

### 2. Install Dependencies via `uv`:

```bash
uv pip sync

OR 

uv pip install -r requirements.txt
```

### 3. Configure AWS Credentials:

Ensure valid credentials in `~/.aws/credentials` or via environment variables.

---

## Docker Deployment

### Development:

```bash
docker-compose up -d
```

### Production (Example):

```bash
docker-compose -f prod-docker-compose.yaml up -d
```

---

## Manual Run Instructions

### Backend (FastAPI):

```bash
uv run app.py
```

### Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Development Endpoints

* **API Docs:** [http://localhost:7410/docs](http://localhost:7410/docs)
* **ReDoc:** [http://localhost:7410/redoc](http://localhost:7410/redoc)
* **Frontend**: [http://localhost:3000](http://localhost:3000)

---

## License

Refer to the [LICENSE](./LICENSE) file for license details.

---