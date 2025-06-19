import os
from plaid.api import plaid_api 
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from dotenv import load_dotenv

load_dotenv()

configuration = Configuration(
    host="https://sandbox.plaid.com",
    api_key={
        "clientId": os.getenv("PLAID_CLIENT_ID"),
        "secret": os.getenv("PLAID_SECRET")
    }
)

api_client = ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)