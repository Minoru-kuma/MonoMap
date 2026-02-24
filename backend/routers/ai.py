import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from ai.detector import detect, UPLOADS_DIR

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/detect")
async def detect_item(image: UploadFile = File(...)):
    """Upload an image, run YOLO inference, and return the top detection."""
    suffix = Path(image.filename).suffix if image.filename else ".jpg"
    tmp_name = f"tmp_{uuid.uuid4().hex}{suffix}"
    tmp_path = UPLOADS_DIR / tmp_name
    try:
        with tmp_path.open("wb") as f:
            shutil.copyfileobj(image.file, f)
        result = detect(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)

    if result is None:
        raise HTTPException(status_code=422, detail="No objects detected or model unavailable")
    return JSONResponse(content=result)
