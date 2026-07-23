from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class RepositoryBase(BaseModel):
    github_id: Optional[int] = None
    owner: str
    name: str
    full_name: str
    is_private: bool

class RepositoryCreate(RepositoryBase):
    user_id: UUID

class RepositoryUpdate(BaseModel):
    github_id: Optional[int] = None
    owner: Optional[str] = None
    name: Optional[str] = None
    full_name: Optional[str] = None
    is_private: Optional[bool] = None
    is_synced: Optional[bool] = None

class RepositoryResponse(RepositoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    is_synced: bool
    synced_at: datetime
    created_at: datetime
