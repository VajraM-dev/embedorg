from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from fastapi import Depends
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
TokenDep = Annotated[str, Depends(oauth2_scheme)]

BYPASS_USER = {
  "email": "<YOUR_EMAIL>",
  "email_verified": "true",
  "name": "<NAME>",
  "custom:role": "amazonAdmi",
  "sub": "91932dba-d0a1-7020-2261-db3533545c15"
}