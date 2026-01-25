from typing import Dict
from pymongo.collection import Collection
from app.database import db

persons_collection: Collection = db["persons"]

def insert_person(person_doc: Dict) -> Dict:
    result = persons_collection.insert_one(person_doc)

    return {
        "inserted_id": str(result.inserted_id),
        "person_id": person_doc["person_id"],
        "name": person_doc["name"]
    }


def get_all_persons() -> list:
    """
    Fetches all active person documents from the database.
    Used to load embeddings into memory for recognition.
    """
    # We only need the Name and the Embedding for recognition
    cursor = persons_collection.find(
        {"status": "active"}, 
        {"name": 1, "embedding": 1, "person_id": 1, "_id": 0}
    )
    return list(cursor)
