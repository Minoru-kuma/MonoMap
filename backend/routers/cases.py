import uuid
import io
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/cases", tags=["cases"])


def _generate_qr_value(case_id: int) -> str:
    return f"monomap:case:{case_id}:{uuid.uuid4().hex[:8]}"


@router.get("/", response_model=List[schemas.CaseRead])
def list_cases(rack_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Case)
    if rack_id is not None:
        query = query.filter(models.Case.rack_id == rack_id)
    return query.all()


@router.post("/", response_model=schemas.CaseRead, status_code=201)
def create_case(case: schemas.CaseCreate, db: Session = Depends(get_db)):
    rack = db.get(models.Rack, case.rack_id)
    if rack is None:
        raise HTTPException(status_code=404, detail="Rack not found")
    db_case = models.Case(rack_id=case.rack_id, qr_code="tmp")
    db.add(db_case)
    db.flush()
    db_case.qr_code = _generate_qr_value(db_case.id)
    db.commit()
    db.refresh(db_case)
    return db_case


@router.get("/{case_id}", response_model=schemas.CaseRead)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/{case_id}/qr-image")
def get_qr_image(case_id: int, db: Session = Depends(get_db)):
    """Return a PNG QR-code image for the given case."""
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    img = qrcode.make(case.qr_code)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@router.delete("/{case_id}", status_code=204)
def delete_case(case_id: int, db: Session = Depends(get_db)):
    db_case = db.get(models.Case, case_id)
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(db_case)
    db.commit()
