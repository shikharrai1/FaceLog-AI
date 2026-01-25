from datetime import datetime
from uuid import uuid4


def normalize_name_from_filename(filename: str) -> str:
  
    name = filename.rsplit(".", 1)[0]
    name = name.replace("_", " ").replace("-", " ")
    name = " ".join(word.capitalize() for word in name.split())
    return name


def create_person_document(
    embedding,
    filename,
    bbox,
    confidence,
    folder_name=None
):
    """
    Creates a MongoDB document for a single enrolled person.
    """

    now = datetime.utcnow()

    return {
        "person_id": str(uuid4()),

        "name": normalize_name_from_filename(filename),
        "name_raw": filename,

        "embedding": embedding,  

        "face_metadata": {
            "bbox": bbox,             
            "confidence": confidence
        },

        "source": {
            "type": "image",
            "filename": filename,
            "folder": folder_name
        },
        
        "status": "active",
        "created_at": now,
        "updated_at": now
    }
