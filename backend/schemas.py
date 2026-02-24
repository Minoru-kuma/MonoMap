from pydantic import BaseModel
from typing import Optional


# --- Rack ---
class RackBase(BaseModel):
    name: str
    x: float = 0.0
    y: float = 0.0
    width: float = 100.0
    height: float = 100.0


class RackCreate(RackBase):
    pass


class RackUpdate(BaseModel):
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class RackRead(RackBase):
    id: int

    model_config = {"from_attributes": True}


# --- Case ---
class CaseBase(BaseModel):
    rack_id: int


class CaseCreate(CaseBase):
    pass


class CaseRead(CaseBase):
    id: int
    qr_code: str

    model_config = {"from_attributes": True}


# --- Item ---
class ItemBase(BaseModel):
    name: str
    case_id: int
    ai_label: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    case_id: Optional[int] = None
    ai_label: Optional[str] = None


class ItemRead(ItemBase):
    id: int
    image_path: Optional[str] = None

    model_config = {"from_attributes": True}


# --- AI ---
class AIDetectionResult(BaseModel):
    label: str
    confidence: float
