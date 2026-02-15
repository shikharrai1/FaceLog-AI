import cv2
import threading
import time

class CameraStream:
    def __init__(self, source=0):
        self.source = source
        self.cap = cv2.VideoCapture(self.source)
        self.lock = threading.Lock()
        self.running = False
        self.current_frame = None
        self.thread = None

    def start(self):
        if self.running:
            return 
        
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(self.source)

        self.running = True
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()
        print(f" Camera started on source: {self.source}")

    def _update(self):
       
        
        target_fps = 8
        sleep_time = 1.0 / target_fps

        while self.running:
            ret, frame = self.cap.read()
            
            if ret:
                with self.lock:
                    self.current_frame = frame
            else:
                print("📷 Camera disconnected or stream ended.")
                self.running = False
                break
           
            time.sleep(sleep_time)

    def read(self):
        with self.lock:
    
            return self.current_frame.copy() if self.current_frame is not None else None

   
    def stop(self):
        """Stops the camera thread and releases resources."""
        self.running = False
        if self.thread.is_alive():
            self.thread.join() 
        
   
        if self.cap and self.cap.isOpened():
            self.cap.release() 
            print("📷 Camera Released Successfully.")
        
        self.cap = None