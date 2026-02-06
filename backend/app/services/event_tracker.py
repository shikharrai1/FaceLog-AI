
from datetime import datetime
from app.repositories.events_repo import insert_event

class EventTracker:
    def __init__(self, time_threshold=5.0):
        self.time_threshold = time_threshold
        # Buffer format: { "Person_Name": { "entry_time": float, "last_seen": float, "count": int } }
        self.active_sessions = {}

    def _format_timestamp(self, seconds: float) -> str:
     
        if seconds is None:
            return "00:00:00.000"
            
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        
        return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

    def update(self, name: str, video_time_sec: float):
        # print("In event_tracker.py file Inside update function1...")
        #  NEW PERSON (Not in buffer)
        if name not in self.active_sessions:
            # print("In event_tracker.py file Inside update function2...")
            self.active_sessions[name] = {
                "entry_time": video_time_sec,
                "last_seen": video_time_sec,
                "detection_count": 1
            }
            return

        #  EXISTING PERSON (In buffer)
        session = self.active_sessions[name]
        time_gap = video_time_sec - session["last_seen"]

        if time_gap <= self.time_threshold:
            # print("In event_tracker.py file Inside update function3...")
            # Still the same interaction. Just update last_seen.
            session["last_seen"] = video_time_sec
            session["detection_count"] += 1
        else:
            # print("In event_tracker.py file Inside update function4...")
            # TIME GAP EXCEEDED New Session
            self._save_event(name, session)
            
            # Start a fresh session
            self.active_sessions[name] = {
                "entry_time": video_time_sec,
                "last_seen": video_time_sec,
                "detection_count": 1
            }

    def save_all_remaining(self):
        # print("In event_tracker.py file Inside update function5...")
        """
        Called at end of video to flush data still in RAM.
        """
        for name, session in self.active_sessions.items():
            # print("In event_tracker.py file Inside update function6...")
            self._save_event(name, session)
        
        # Clear buffer
        self.active_sessions = {}

    def _save_event(self, name: str, session: dict):
        # print("In event_tracker.py file Inside __save__event function1...")
        """
        Helper to format data and send to DB Repo.
        """
        if session["detection_count"] > 0:
            # print("In event_tracker.py file Inside __save__event function2...")
            duration = session["last_seen"] - session["entry_time"]
            now = datetime.utcnow()
            # print("In event_tracker.py file Inside __save__event function3...")
            event_doc = {
                "name": name,
           
                "date": now.strftime("%d-%m-%Y"), 
           
                "start_time": self._format_timestamp(session["entry_time"]),
                "end_time": self._format_timestamp(session["last_seen"]),
                "duration": self._format_timestamp(duration),
                
                # Raw data for sorting/math
                "start_seconds_raw": session["entry_time"],
                "end_seconds_raw": session["last_seen"],
                
                "detection_count": session["detection_count"],
                "created_at": now
            }
            # print("In event_tracker.py file Inside __save__event function4...")
            print(f" Saving Event: {name} | Date: {event_doc['date']} | Duration: {event_doc['duration']}")
            insert_event(event_doc)