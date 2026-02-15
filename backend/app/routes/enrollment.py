
import os
import shutil
import tempfile
import zipfile
import base64
import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.recognition_service import recognition_service
from app.services.enrollment_service import EnrollmentService
from app.routes.live import refresh_live_cache

router = APIRouter(prefix="/enroll", tags=["Enrollment"])

enrollment_service = EnrollmentService()

ALLOWED_IMAGE_EXTS = (".jpg", ".jpeg", ".png")

# --- Request Models ---
class WebcamEnrollRequest(BaseModel):
    image: str  # Base64 string from the frontend
    name: str   # Optional name for the person

def _is_allowed_image(filename: str) -> bool:
    return filename.lower().endswith(ALLOWED_IMAGE_EXTS)

# --- Existing Endpoints ---

@router.post("/image")
def enroll_single_image(file: UploadFile = File(...)):
    filename = file.filename
    if not _is_allowed_image(filename):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Only JPG, JPEG, PNG are allowed."
        )
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=filename) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        results = enrollment_service.enroll_single_image(image_path=tmp_path,original_name=filename)
        # Refresh recognition cache if successful
        if any(r.get("status") == "enrolled" for r in results):
            print(" New person enrolled via Image. Refreshing system caches...")
            recognition_service.load_known_faces()
            refresh_live_cache()
        return JSONResponse(content=results)

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/folder")
def enroll_folder(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a ZIP file containing images."
        )

    temp_dir = tempfile.mkdtemp()

    try:
        zip_path = os.path.join(temp_dir, file.filename)

        with open(zip_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)
        
        results = enrollment_service.enroll_folder(temp_dir)
        
        total = len(results)
        enrolled = sum(1 for r in results if r.get("status") == "enrolled")
        
        # Refresh recognition cache if any were enrolled
        if enrolled > 0:
            print(" New people enrolled via Folder. Refreshing system caches...")
            recognition_service.load_known_faces()
            refresh_live_cache()
            
        failed = total - enrolled

        status = "success" if failed == 0 else ("failed" if enrolled == 0 else "partial_success")

        response = {
            "status": status,
            "total_images": total,
            "enrolled": enrolled,
            "failed": failed,
            "results": results
        }

        return JSONResponse(content=response)

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# --- NEW: Webcam Enrollment Endpoint ---

@router.post("/webcam")
async def enroll_from_webcam(payload: WebcamEnrollRequest):
    """
    Receives a base64 encoded image from the webcam,
    decodes it, and processes it for enrollment.
    """
    try:
        # 1. Clean the base64 string if it contains the header (data:image/jpeg;base64,...)
        header, encoded = payload.image.split(",", 1) if "," in payload.image else (None, payload.image)
        
        # 2. Decode base64 to bytes
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        
        # 3. Convert bytes to OpenCV image (BGR)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise ValueError("Failed to decode image from webcam")

        # 4. Process using our universal service
        # We use the provided name or a default 'webcam_capture' as filename
        source_name = f"{payload.name}.jpg" if payload.name else "webcam_capture.jpg"
        results = enrollment_service.process_frame_to_embedding(frame, source_name)

        # 5. Refresh recognition cache if successful
        if any(r.get("status") == "enrolled" for r in results):
            print(" New person enrolled via Webcam. Refreshing system caches...")
            recognition_service.load_known_faces()
            refresh_live_cache()

        return JSONResponse(content=results)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webcam enrollment failed: {str(e)}")