import os
from dotenv import load_dotenv

class Settings:
    def __init__(self):
        load_dotenv(override=True)
        self.CLOUDWATCH_LOG_GROUP_NAME=os.environ.get("CLOUDWATCH_LOG_GROUP_NAME")
        self.CLOUDWATCH_LOG_BACKEND_STREAM_NAME=os.environ.get("CLOUDWATCH_LOG_BACKEND_STREAM_NAME")
        self.CLOUDWATCH_LOG_FRONTEND_STREAM_NAME=os.environ.get("CLOUDWATCH_LOG_FRONTEND_STREAM_NAME")
        self.CLOUDWATCH_REGION=os.environ.get("CLOUDWATCH_REGION")