from datetime import datetime
from app.database import events_collection

class LiveEventTracker:
    def __init__(self, time_threshold=5.0):
        self.time_threshold = time_threshold
    
        self.active_sessions = {}

    def _format_timestamp(self, dt_obj) -> str:
        return dt_obj.strftime("%H:%M:%S.%f")[:-3]

    def update(self, name: str):
        now = datetime.now()
        current_time_ts = now.timestamp()

    
        if name not in self.active_sessions:
            print(f"🔹 New Live Session: {name}")
            
          
            event_doc = {
                "name": name,
                "date": now.strftime("%d-%m-%Y"),
                "start_time": self._format_timestamp(now),
                "end_time": self._format_timestamp(now), 
                "duration": "00:00:00.000",
                "start_seconds_raw": current_time_ts,
                "end_seconds_raw": current_time_ts,
                "created_at": now,
                "status": "active" 
            }
            
            result = events_collection.insert_one(event_doc)
            
         
            self.active_sessions[name] = {
                "entry_time": current_time_ts,
                "last_seen": current_time_ts,
                "db_id": result.inserted_id
            }
            return

       
        session = self.active_sessions[name]
        time_gap = current_time_ts - session["last_seen"]

        if time_gap <= self.time_threshold:
         
            session["last_seen"] = current_time_ts
            
          
            if (current_time_ts - session["entry_time"]) % 5 < 0.5:
                 self._update_db_record(name, session, "active")
        else:
           
            self._close_session(name)
          
            self.update(name)

    def check_for_timeouts(self):
        """
        Call this periodically (e.g., every frame or every second)
        to close sessions for people who left the camera view.
        """
        now = datetime.now().timestamp()
        
        # Identify who left
        to_remove = []
        for name, session in self.active_sessions.items():
            if (now - session["last_seen"]) > self.time_threshold:
                to_remove.append(name)
        
        # Close their sessions
        for name in to_remove:
            self._close_session(name)

    def _close_session(self, name):
        if name in self.active_sessions:
            print(f"🔸 Closing Session: {name}")
            session = self.active_sessions[name]
            self._update_db_record(name, session, "completed")
            del self.active_sessions[name]

    def _update_db_record(self, name, session, status):
        """
        Updates the existing MongoDB document with new end_time and duration.
        """
        duration_sec = session["last_seen"] - session["entry_time"]
        
        # Format duration string
        hours = int(duration_sec // 3600)
        minutes = int((duration_sec % 3600) // 60)
        secs = int(duration_sec % 60)
        millis = int((duration_sec - int(duration_sec)) * 1000)
        duration_str = f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

        end_time_obj = datetime.fromtimestamp(session["last_seen"])

        events_collection.update_one(
            {"_id": session["db_id"]},
            {
                "$set": {
                    "end_time": self._format_timestamp(end_time_obj),
                    "end_seconds_raw": session["last_seen"],
                    "duration": duration_str,
                    "status": status
                }
            }
        )