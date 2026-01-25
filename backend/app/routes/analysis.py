import os
import shutil
from typing import Optional
from fastapi import APIRouter
from app.database import persons_collection, events_collection

router = APIRouter(prefix="/analysis", tags=["Analysis"])

# ---  DASHBOARD STATS ---
@router.get("/stats")
def get_stats():
    """
    Returns high-level counts for the dashboard cards.
    """
    total_users = persons_collection.count_documents({"status": "active"})
    total_events = events_collection.count_documents({})
    
    # Get total active faces (files on disk)
    faces_dir = "data/enrolled_faces"
    total_files = len(os.listdir(faces_dir)) if os.path.exists(faces_dir) else 0

    return {
        "total_users": total_users,
        "total_events": total_events,
        "storage_count": total_files
    }

# --- GALLERY DATA ---
@router.get("/persons")
def get_enrolled_persons():
    """
    Fetches all enrolled people to display in the Gallery Grid.
    """
    # Exclude the raw embedding vector (too big/useless for UI)
    cursor = persons_collection.find(
        {"status": "active"}, 
        {"embedding": 0, "_id": 0} 
    ).sort("created_at", -1)
    
    return list(cursor)


@router.get("/logs")
def get_logs(name: Optional[str] = None, date: Optional[str] = None):
    """
    Fetches logs with optional filtering (Querying).
    Usage: /analysis/logs?name=Abdul&date=22-01-2026
    """
    query = {}
    
    # Filter by Name
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
        
    # Filter by Date 
    if date:
        query["date"] = date

    # Sort by newest first
    cursor = events_collection.find(query, {"_id": 0}).sort("created_at", -1).limit(100)
    
    return list(cursor)

# ---  DANGER ZONE (Cleanup) ---
@router.delete("/reset_logs")
def reset_logs():
    """
    Deletes logs ONLY. Keeps enrolled faces intact.
    """
    result = events_collection.delete_many({})
    return {"status": "success", "deleted_events": result.deleted_count}

@router.delete("/nuke_system")
def nuke_system():
    """
    DANGER: Deletes EVERYTHING (DB + Physical Files).
    Used to clean up duplicates and start fresh.
    """
    #  Clear Database
    persons_collection.delete_many({})
    events_collection.delete_many({})

    #  Clear Physical Files (Enrolled Faces)
    faces_dir = "data/enrolled_faces"
    if os.path.exists(faces_dir):
        for filename in os.listdir(faces_dir):
            file_path = os.path.join(faces_dir, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}: {e}")

    # Clear Processed Videos 
    processed_dir = "data/processed"
    if os.path.exists(processed_dir):
        for filename in os.listdir(processed_dir):
            file_path = os.path.join(processed_dir, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}: {e}")

    return {"status": "success", "message": "System completely reset. Storage cleaned."}