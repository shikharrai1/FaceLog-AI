import cv2
import time
import numpy as np
from fastapi import APIRouter
from app.services.camera_stream import CameraStream
from app.core.model_loader import model_loader, model_lock
from app.services.live_event_tracker import LiveEventTracker
from app.repositories.persons_repo import get_all_persons
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/live", tags=["Live Stream"])

camera = None
tracker = None
known_faces_cache = []

def refresh_live_cache():
    """
    Public function to reload faces from DB. 
    Called by enrollment.py when a new face is added.
    """
    global known_faces_cache
    persons = get_all_persons()
    
    new_cache = []
    for p in persons:
        new_cache.append({
            "name": p["name"],
            "embedding": np.array(p["embedding"], dtype=np.float32)
        })
    
    known_faces_cache = new_cache
    print(f" Live Stream Cache Refreshed: {len(known_faces_cache)} faces loaded.")

@router.get("/start")
def start_stream(source: str = "0"): 
    global camera, tracker
    
   
    _ = model_loader.get_model()
    
  
    refresh_live_cache()
    
 
    cam_src = 0 if source == "0" else source
    if camera is None or not camera.running:
        camera = CameraStream(source=cam_src)
        camera.start()
    
   
    tracker = LiveEventTracker(time_threshold=5.0)
    
    return {"status": "started", "source": source}

@router.get("/stop")
def stop_stream():
    global camera
    if camera:
        camera.stop()
        camera = None
    return {"status": "stopped"}

def generate_frames():
    global camera, tracker, known_faces_cache
    
    app = model_loader.get_model() 
    
    while camera and camera.running:
        frame = camera.read()
        if frame is None:
            continue

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        with model_lock:
            faces = app.get(img_rgb)
         
        
        for face in faces:
            embedding = face.embedding
            norm = np.linalg.norm(embedding)
            if norm == 0: continue
            embedding = embedding / norm

            max_score = 0
            best_match_name = "Unknown"

            for known in known_faces_cache:
                score = np.dot(embedding, known["embedding"])
                if score > max_score:
                    max_score = score
                    best_match_name = known["name"]

            # Threshold
            if max_score > 0.60:
                # 2. Update Tracker (Real-time DB update)
                tracker.update(best_match_name)
                
                # Draw Green Box
                box = face.bbox.astype(int)
                cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (0, 255, 0), 2)
                label = f"{best_match_name} ({int(max_score * 100)}%)"
                cv2.putText(frame, label, (box[0], box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            else:
                # Draw Red Box (Unknown)
                box = face.bbox.astype(int)
                cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (0, 0, 255), 2)
                label = f"Unknown ({int(max_score * 100)}%)"
                cv2.putText(frame, label, (box[0], box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # 3. Check for people who left (Timeouts)
        tracker.check_for_timeouts()

        # --- ENCODE TO JPEG FOR BROWSER ---
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        # Yield the frame in MJPEG format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@router.get("/video_feed")
def video_feed():
    """
    The frontend <img> tag will point here:
    <img src="http://localhost:8000/live/video_feed" />
    """
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")