from pydantic import BaseModel

class DeleteAccountRequest(BaseModel):
    github_login: str
