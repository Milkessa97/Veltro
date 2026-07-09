from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class PrLabelBase(BaseModel):
    name: Optional[str] = None
    color: str

class PrLabelCreate(PrLabelBase):
    pull_request_id: UUID

class PrLabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class PrLabelResponse(PrLabelBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    pull_request_id: UUID
