from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/racks", tags=["racks"])


@router.get("/", response_model=List[schemas.RackRead])
def list_racks(db: Session = Depends(get_db)):
    return db.query(models.Rack).all()


@router.post("/", response_model=schemas.RackRead, status_code=201)
def create_rack(rack: schemas.RackCreate, db: Session = Depends(get_db)):
    db_rack = models.Rack(**rack.model_dump())
    db.add(db_rack)
    db.commit()
    db.refresh(db_rack)
    return db_rack


@router.get("/{rack_id}", response_model=schemas.RackRead)
def get_rack(rack_id: int, db: Session = Depends(get_db)):
    rack = db.get(models.Rack, rack_id)
    if rack is None:
        raise HTTPException(status_code=404, detail="Rack not found")
    return rack


@router.patch("/{rack_id}", response_model=schemas.RackRead)
def update_rack(rack_id: int, rack: schemas.RackUpdate, db: Session = Depends(get_db)):
    db_rack = db.get(models.Rack, rack_id)
    if db_rack is None:
        raise HTTPException(status_code=404, detail="Rack not found")
    for field, value in rack.model_dump(exclude_none=True).items():
        setattr(db_rack, field, value)
    db.commit()
    db.refresh(db_rack)
    return db_rack


@router.delete("/{rack_id}", status_code=204)
def delete_rack(rack_id: int, db: Session = Depends(get_db)):
    db_rack = db.get(models.Rack, rack_id)
    if db_rack is None:
        raise HTTPException(status_code=404, detail="Rack not found")
    db.delete(db_rack)
    db.commit()
