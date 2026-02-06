import os
import shutil
import tempfile
import zipfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.recognition_service import recognition_service

from app.services.enrollment_service import EnrollmentService

router = APIRouter(prefix="/enroll", tags=["Enrollment"])

enrollment_service = EnrollmentService()

ALLOWED_IMAGE_EXTS = (".jpg", ".jpeg", ".png")

def _is_allowed_image(filename: str) -> bool:
    return filename.lower().endswith(ALLOWED_IMAGE_EXTS)

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
        results = enrollment_service.enroll_single_image(tmp_path)
                #  refresh recognition cache
        if any(r.get("status") == "enrolled" for r in results):
            # print("we have something with status enrolled...")
            recognition_service.load_known_faces()
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
        #  refresh once after batch enrollment
        if enrolled > 0:
          recognition_service.load_known_faces()
        failed = total - enrolled

        if failed == 0:
            status = "success"
        elif enrolled == 0:
            status = "failed"
        else:
            status = "partial_success"

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