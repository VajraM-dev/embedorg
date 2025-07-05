from authentication.auth_settings import Settings
from defaults.errors import AuthenticationError
from defaults.bearer_setting import TokenDep
settings = Settings()

client = settings.client
auth_enabled = settings.auth_enabled
default_user = settings.bypass_user

def get_user(access_token: TokenDep) -> dict:
    """
    Get user information from Cognito using the access token.
    """
    if not auth_enabled:
        return default_user
    
    try:
        response = client.get_user(
            AccessToken=access_token
        )

        user_attributes = {attr['Name']: attr['Value'] for attr in response['UserAttributes']}
        return user_attributes
    except client.exceptions.NotAuthorizedException:
        raise AuthenticationError(message="Invalid access token")
    except client.exceptions.UserNotFoundException:
        raise AuthenticationError(message="User not found")
    except client.exceptions.InvalidParameterException:
        raise AuthenticationError(message="Invalid parameters provided")
    except client.exceptions.InternalErrorException:
        raise AuthenticationError(message="Internal server error")
    except Exception as e:
        print(f"Error signing out: {e}")
        return {
                "error_code": "AUTHENTICATION_ERROR",
                "message": "An error occurred while retrieving user information",
                "status": False
                }
