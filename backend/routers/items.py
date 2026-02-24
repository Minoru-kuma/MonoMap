import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

import models
import schemas
from database import get_db

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("/", response_model=List[schemas.ItemRead])
def list_items(case_id: Optional[int] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Item)
    if case_id is not None:
        query = query.filter(models.Item.case_id == case_id)
    if q:
        query = query.filter(
            or_(
                models.Item.name.ilike(f"%{q}%"),
                models.Item.ai_label.ilike(f"%{q}%"),
            )
        )
    return query.all()


@router.post("/", response_model=schemas.ItemRead, status_code=201)
async def create_item(
    name: str = Form(...),
    case_id: int = Form(...),
    ai_label: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    image_path = None
    if image and image.filename:
        suffix = Path(image.filename).suffix
        filename = f"{uuid.uuid4().hex}{suffix}"
        dest = UPLOADS_DIR / filename
        with dest.open("wb") as f:
            shutil.copyfileobj(image.file, f)
        image_path = f"/uploads/{filename}"

    db_item = models.Item(
        name=name,
        case_id=case_id,
        ai_label=ai_label,
        image_path=image_path,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/search-racks")
def search_racks_by_item(q: str, db: Session = Depends(get_db)):
    """Return rack IDs that contain items matching the query."""
    rows = (
        db.query(models.Case.rack_id)
        .join(models.Item, models.Item.case_id == models.Case.id)
        .filter(
            or_(
                models.Item.name.ilike(f"%{q}%"),
                models.Item.ai_label.ilike(f"%{q}%"),
            )
        )
        .distinct()
        .all()
    )
    return {"rack_ids": [row.rack_id for row in rows]}


@router.get("/{item_id}", response_model=schemas.ItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=schemas.ItemRead)
def update_item(item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)):
    db_item = db.get(models.Item, item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in item.model_dump(exclude_none=True).items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.get(models.Item, item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
