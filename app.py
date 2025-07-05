from fastapi import Depends, FastAPI, Request
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import JSONResponse
from authentication.auth_api import auth_router
from defaults.errors import BaseAppError
from authentication.get_user import get_user
from starlette.responses import Response

# database routers
from database.apis.teams import app as teams_router
from database.apis.projects import app as projects_router
from database.apis.files import app as files_router
from database.apis.associations import app as associations_router
from database.apis.embeddings import app as embeddings_router

# embeddings routers
from embeddings.apis.crud_embeddings import app as create_embeddings_router

# publish routers
from publish.publish_apis import app as publish_router

# logging
from cloud_watch_logs.client_connect import send_backend_log_to_cloudwatch, create_event, send_frontend_log_to_cloudwatch
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
import time
import json

# Load environment variables
load_dotenv(override=True)

ENVIRONMENT = os.environ.get("ENVIRONMENT", "production")
# Setup FastAPI
app = FastAPI(
    debug=ENVIRONMENT != "production",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your production domains when deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


class CloudWatchLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)

        # Read the response body (may only work once)
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk

        # Decode and parse the response (optional)
        try:
            response_text = response_body.decode("utf-8")
            response_data = json.loads(response_text)
        except Exception:
            response_data = "NON-JSON or UNREADABLE response"

        process_time = (time.time() - start_time) * 1000  # in milliseconds

        log_event = {
            'level': 'INFO',
            'message': f"{request.method} {request.url.path} completed in {process_time:.2f}ms",
            'event': {
                'method': request.method,
                'path': request.url.path,
                'status_code': response.status_code,
                'process_time_ms': process_time,
                'response': response_data
            }
        }

        # Schedule the log sending without blocking the response
        asyncio.create_task(send_backend_log_to_cloudwatch(log_event))

        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )
    
app.add_middleware(CloudWatchLoggingMiddleware)

@app.exception_handler(BaseAppError)
async def app_error_handler(request: Request, exc: BaseAppError) -> JSONResponse:
    try:
        log_event = {
            'level': 'ERROR',
            'message': "An error occurred",
            'event': {
                'method': request.method,
                'path': request.url.path,
                'error': str(exc)
            }
        }
        asyncio.create_task(send_backend_log_to_cloudwatch(log_event))
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    except:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )

current_user = Depends(get_user)

app.include_router(auth_router, prefix="/auth")
app.include_router(teams_router, prefix="/db/teams", tags=['Teams'], dependencies=[current_user])
app.include_router(projects_router, prefix="/db/projects", tags=['Projects'], dependencies=[current_user])
app.include_router(files_router, prefix="/db/files", tags=['Files'], dependencies=[current_user])
app.include_router(associations_router, prefix="/db/associations", tags=['Associations'], dependencies=[current_user])
app.include_router(embeddings_router, prefix="/db/embeddings", tags=['Embeddings'], dependencies=[current_user])

app.include_router(create_embeddings_router, prefix="/embeddings", tags=['Vector Store'], dependencies=[current_user])

app.include_router(publish_router, prefix="/publish", tags=['Publish'], dependencies=[current_user])

@app.get("/me")
async def read_users_me(user = current_user):
    await send_backend_log_to_cloudwatch(create_event('INFO', 'User Profile Accessed', {'user': user}))
    return user

@app.post("/log_forntend_events")
async def log_event(level: str, message: str, event: dict):
    log_event = {
        'level': level,
        'message': message,
        'event': event
    }
    await send_frontend_log_to_cloudwatch(log_event)
    return {"status": "success"}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7410)