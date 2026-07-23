from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class ContributorBase(BaseModel):
    github_id: Optional[int] = None
    github_login: str
    display_name: str
    avatar_url: str

class ContributorCreate(ContributorBase):
    repository_id: UUID

class ContributorUpdate(BaseModel):
    github_id: Optional[int] = None
    github_login: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ContributorResponse(ContributorBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    repository_id: UUID
