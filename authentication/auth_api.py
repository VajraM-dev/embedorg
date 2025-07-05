from fastapi import APIRouter
from authentication.auth_init import sign_in, refresh_token
from authentication.sign_out import sign_out
# from authentication.get_user import get_user
from defaults.models import User
from defaults.standard_response import success_response

from defaults.bearer_setting import TokenDep
auth_router = APIRouter()


@auth_router.post("/login", 
                  response_model=success_response
                  )
async def login(params: User):
    """
    Authenticate user with username and password.
    """
    # Implement authentication logic here

    sign_in_response = sign_in(params.username, params.password)
    return {
        "data": sign_in_response,
        "message": "User signed in successfully",
    }


@auth_router.get("/logout", 
                 response_model=success_response
                  )
async def logout(token: TokenDep):
    """
    Sign out the user using the access token.
    """

    sign_out_response = sign_out(token)

    return {
        "data": sign_out_response,
        "message": "User signed out successfully",
    }

# api to get new token using refresh token
@auth_router.post("/refresh_token", 
                   response_model=success_response
                  )
async def refresh_token_endpoint(username: str, rtoken: str):
    """
    Refresh the access token using the refresh token.
    """
    refresh_token_response = refresh_token(username, rtoken)
    return {
        "data": refresh_token_response,
        "message": "Token refreshed successfully",
    }