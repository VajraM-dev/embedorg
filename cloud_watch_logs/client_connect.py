import boto3
import time
import json
from cloud_watch_logs.settings import Settings

settings = Settings()

client = boto3.client('logs', region_name=settings.CLOUDWATCH_REGION)

class LogLevels:
    INFO = "INFO"
    ERROR = "ERROR"
    WARNING = "WARNING"
    DEBUG = "DEBUG"

def create_event(level: str, message: str, event: dict) -> dict:
    return {
        'level': level,
        'message': message,
        'event': event
    }

async def send_backend_log_to_cloudwatch(log_event: dict) -> None:
    try:
        log_event = {
            'timestamp': int(time.time() * 1000),
            'message': json.dumps({
                'level': log_event['level'],
                'message': log_event['message'],
                'event': log_event['event'],
            })
        }
        _ = client.put_log_events(
            logGroupName=settings.CLOUDWATCH_LOG_GROUP_NAME,
            logStreamName=settings.CLOUDWATCH_LOG_BACKEND_STREAM_NAME,
            logEvents=[log_event],
        )
    except Exception as e:
        print("Error sending log to CloudWatch:", e)

async def send_frontend_log_to_cloudwatch(log_event: dict) -> None:
    try:
        log_event = {
            'timestamp': int(time.time() * 1000),
            'message': json.dumps({
                'level': log_event['level'],
                'message': log_event['message'],
                'event': log_event['event'],
            })
        }
        _ = client.put_log_events(
            logGroupName=settings.CLOUDWATCH_LOG_GROUP_NAME,
            logStreamName=settings.CLOUDWATCH_LOG_FRONTEND_STREAM_NAME,
            logEvents=[log_event],
        )
    except Exception as e:
        print("Error sending log to CloudWatch:", e)