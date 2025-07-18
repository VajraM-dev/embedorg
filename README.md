# EmbedOrg Platform

A full-stack, containerized platform enabling document management, vector embeddings generation, and semantic search for organizations.

---

![EmbedOrg Image](./readmeassets/Platform.png)

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
| Frontend         | Next Js                                   |
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

## Contributing

Contributions are welcome and appreciated.

To contribute:

1. Fork the repository and create a new branch.
2. Make your changes with clear, focused commits.
3. Submit a pull request with a detailed description.

> **Note:**
> Use `uv` for managing backend dependencies.
> Avoid committing sensitive files such as `.env`.

For major changes, please open an issue first to discuss the proposal.

---

## Project Status

This project is our first attempt at building a full-fledged open-source platform. We are actively working to improve its stability and add new features.

This is an initial **MVP (Minimum Viable Product)** release, and we expect there may be bugs or issues.
If you encounter any significant problems, unexpected behavior, or have suggestions, please open an issue or contribute directly.

We appreciate your support and feedback as we work towards making this a robust and production-ready platform.

---

## Team

  * Prathamesh Kulkarni
  * Piyush Sonawane

---

## License

Refer to the [LICENSE](./LICENSE) file for license details.

---
