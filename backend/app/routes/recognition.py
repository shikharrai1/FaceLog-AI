
import os
import shutil
import tempfile
import time 
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.recognition_service import RecognitionService
from fastapi.responses import FileResponse

router = APIRouter(prefix="/recognize", tags=["Recognition"])

recognition_service = RecognitionService()

@router.post("/video")
def recognize_video(file: UploadFile = File(...)):
    # print("Inside recognition.py in models folder in backend 1")
    # Validation
    if not file.filename.lower().endswith((".mp4", ".avi", ".mov")):
        raise HTTPException(400, "Invalid video format. Please upload MP4, AVI, or MOV.")
    # print("Inside recognition.py in models folder in backend 2")

    # Save Uploaded File to Temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_input:
        shutil.copyfileobj(file.file, temp_input)
        input_path = temp_input.name

    # print("Inside recognition.py in models folder in backend 3")
    # Output Path
    output_dir = "data/processed"
    os.makedirs(output_dir, exist_ok=True)

    # print("Inside recognition.py in models folder in backend 4")
    # --- Generate Unique Filename ---
  
    timestamp = int(time.time())
    sanitized_filename = file.filename.replace(" ", "_")
    output_filename = f"processed_{timestamp}_{sanitized_filename}"
    
    # print("finally video will be saved with name:", output_filename)

    output_path = os.path.join(output_dir, output_filename)

    # print("finally video will be saved at this path:", output_path)

    try:
        print(f" Starting video processing: {output_filename}")
        
        # print("Inside recognition.py in models folder in backend before sending the video to backend for actual processing...")

        result_path = recognition_service.process_video(input_path, output_path)

        # print("Inside recognition.py in models folder in backend after receiving the response that was processed in backend ...")

        if result_path is None:
            #  print("there is nothing in result_path so we did not get proper result")
             return JSONResponse({
                "status": "aborted",
                "message": "Processing was stopped by the user."
            })

        base_url = os.getenv("BACKEND_URL")
        # print("this is the backend url i took from .env file before creating video_url variable...")
        # video_url = f"{base_url}/static/processed/{output_filename}"
        video_url = f"{base_url}/recognize/video/{output_filename}"
        # print("Inside recognition.py in models folder after creating video_url variable ")



        # print("Inside recognition.py in models folder Before sending response to frontend")
        return JSONResponse({
            "status": "completed",
            "message": "Video processed successfully",
            "video_url": video_url
        })

    except Exception as e:
        print(f" Error processing video: {e}")
        raise HTTPException(500, f"Video processing failed: {str(e)}")

    finally:
    
        if os.path.exists(input_path):
            # print("Inside recognition.py in models folder in finally block about to remove temporary files created...")
            os.remove(input_path)
            print(f" Cleaned up temp file: {input_path}")

from fastapi.responses import StreamingResponse

@router.get("/video/{filename}")
def serve_video(filename: str):
    file_path = os.path.join("data", "processed", filename)

    if not os.path.exists(file_path):
        raise HTTPException(404, "Video not found")

    def iterfile():
        with open(file_path, "rb") as f:
            yield from f

    return StreamingResponse(iterfile(), media_type="video/mp4")