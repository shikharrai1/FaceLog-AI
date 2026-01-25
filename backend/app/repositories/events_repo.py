
from app.database import events_collection

def insert_event(event_data: dict):
    """
    Inserts a recognized event into MongoDB.
    """
    try:
        events_collection.insert_one(event_data)
    except Exception as e:
        print(f"Error saving event: {e}")