from pathlib import Path
from typing import Optional

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

_model = None


def _load_model():
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            _model = YOLO("yolov8n.pt")
        except Exception:
            _model = None
    return _model


def detect(image_path: str) -> Optional[dict]:
    """Run YOLO inference on an image and return the top detection."""
    model = _load_model()
    if model is None:
        return None
    results = model(image_path, verbose=False)
    best_label = None
    best_conf = 0.0
    for result in results:
        for box in result.boxes:
            conf = float(box.conf[0])
            if conf > best_conf:
                best_conf = conf
                cls_id = int(box.cls[0])
                best_label = result.names[cls_id]
    if best_label is None:
        return None
    return {"label": best_label, "confidence": round(best_conf, 3)}
