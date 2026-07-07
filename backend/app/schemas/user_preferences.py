from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class UserPreferencesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    default_repository_id: Optional[UUID]
    default_date_range_days: int
    digest_panel_expanded: bool
    is_onboarded: bool

class UpdatePreferencesRequest(BaseModel):
    default_repository_id: Optional[UUID] = None
    default_date_range_days: Optional[int] = None
    digest_panel_expanded: Optional[bool] = None
    is_onboarded: Optional[bool] = None