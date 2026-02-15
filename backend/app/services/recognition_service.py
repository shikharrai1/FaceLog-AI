# import cv2
# import numpy as np
# import os
# import tempfile
# from insightface.app import FaceAnalysis
# from app.repositories.persons_repo import get_all_persons
# from app.services.event_tracker import EventTracker

# from moviepy import VideoFileClip, AudioFileClip

# class RecognitionService:
#     def __init__(self):
#         # print("Initializing Recognition Service...")
#         self.app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
#         self.app.prepare(ctx_id=0, det_size=(384, 384))
        
#         self.known_faces = []
#         self.load_known_faces()
#         self.tracker = EventTracker(time_threshold=5.0) 

#     def load_known_faces(self):
#         # print("Backend service Inside Load_known_faces function 1")
#         persons = get_all_persons()
#         # print("Backend service Inside Load_known_faces function 2")
#         print("total enrolled person : ", len(persons))
#         self.known_faces = []
#         for p in persons:
#             self.known_faces.append({
#                 "name": p["name"],
#                 "person_id": p["person_id"],
#                 "embedding": np.array(p["embedding"], dtype=np.float32)
#             })
#         print(f"Loaded {len(self.known_faces)} identities into memory.")
#         # print("Backend service Inside Load_known_faces function 3")

#     def process_video(self, input_path: str, output_path: str):
#         # print("Backend service Inside process_video function 1")
#         cap = cv2.VideoCapture(input_path)
#         if not cap.isOpened():
#             # print("Backend service Inside process_video function 2")
#             raise ValueError("Could not open video file.")

#         width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#         height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#         fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
#         # print("Backend service Inside process_video function 3")
#         # Temp File for the Silent Video (OpenCV output)
#         temp_silent_path = output_path.replace(".mp4", "_silent.mp4")
#         # print("Backend service Inside process_video function 4")
        
#         #  used 'mp4v' here because it is robust in OpenCV. 
#         fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
#         out = cv2.VideoWriter(temp_silent_path, fourcc, fps, (width, height))
#         # print("Backend service Inside process_video function 5")
#         frame_count = 0
#         current_faces_data = [] 

#         try:
#             # print("Backend service Inside process_video function 6")
#             while True:
#                 # print("Backend service Inside process_video function 7")
#                 ret, frame = cap.read()
#                 if not ret:
#                     break 

#                 frame_count += 1
#                 current_timestamp = frame_count / fps

#                 # Process every  frame
#                 if frame_count % 1 == 0:
#                     # print("Backend service Inside process_video function 8")
#                     print(f"Processing frame {frame_count} ({current_timestamp:.2f}s)...")
#                     current_faces_data = self._analyze_frame(frame)
#                     # print("Backend service Inside process_video function 9")
                    
#                     for face_data in current_faces_data:
#                         # print("Backend service Inside process_video function 10")
#                         if face_data['is_known']:
#                             # print("fun in event_tracker.py file is being called...")
#                             self.tracker.update(face_data['name'], current_timestamp)

#                 annotated_frame = self._draw_boxes(frame, current_faces_data)
#                 out.write(annotated_frame)

#         finally:
#             print("Video ended. Flushing events...")
#             # print("Backend service Inside process_video function 11")
#             self.tracker.save_all_remaining()
#             cap.release()
#             out.release() 

#         #  ADD AUDIO 
#         try:
#             print(" Merging Audio and Optimizing Codec for Browser...")
#             video_clip = VideoFileClip(temp_silent_path)
            
#             try:
#                 original_audio = AudioFileClip(input_path)
#                 final_clip = video_clip.with_audio(original_audio)
#             except Exception:
#                 print("No audio found in source or error loading audio. Proceeding silent.")
#                 final_clip = video_clip

#             # Write final file 
#             final_clip.write_videofile(
#                 output_path, 
#                 codec="libx264", 
#                 audio_codec="aac", 
#                 temp_audiofile="temp-audio.m4a",
#                 remove_temp=True,
#                 logger="bar" 
#             )
            
#             video_clip.close()
#             if 'original_audio' in locals(): original_audio.close()
#             final_clip.close()
            
#             # Remove the silent temp file
#             if os.path.exists(temp_silent_path):
#                 os.remove(temp_silent_path)
                
#             print(f" Final video with audio saved to {output_path}")

#         except Exception as e:
#             print(f" Error during audio merge: {e}")
         
#             if os.path.exists(temp_silent_path):
#                 if os.path.exists(output_path): os.remove(output_path)
#                 os.rename(temp_silent_path, output_path)

#         return output_path

#     def _analyze_frame(self, frame):
#         # print("Backend service Inside _analyze_frame function 1")
#         img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         faces = self.app.get(img_rgb)
#         results = []
#         # print("Backend service Inside _analyze_frame function 2")

#         for face in faces:
#             # print("Backend service Inside _analyze_frame function 3")
#             embedding = face.embedding
#             norm = np.linalg.norm(embedding)
#             if norm == 0: continue
#             embedding = embedding / norm

#             max_score = 0
#             best_match_name = "Unknown"

#             for known in self.known_faces:
#                 # print("Backend service Inside _analyze_frame function 4")
#                 score = np.dot(embedding, known["embedding"])
#                 if score > max_score:
#                     max_score = score
#                     best_match_name = known["name"]

#             # Threshold
#             is_match = max_score > 0.60
#             # print("Backend service Inside _analyze_frame function 5 value of is_match is ", is_match, "and value of best_match_name is : ", best_match_name)
#             results.append({
#                 "box": face.bbox.astype(int),
#                 "name": best_match_name if is_match else "Unknown",
#                 "score": max_score,
#                 "is_known": is_match
#             })
#         # print("Backend service Inside _analyze_frame function 6")
#         return results

#     def _draw_boxes(self, frame, faces_data):
#         # print("Backend service Inside _draw_boxes function 1")
#         for data in faces_data:
#             # print("Backend service Inside _draw_boxes function 2")
#             box = data["box"]
#             color = (0, 255, 0) if data["is_known"] else (0, 0, 255)
#             label = f"{data['name']} ({int(data['score'] * 100)}%)"
#             # print("Backend service Inside _draw_boxes function 3")
#             cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), color, 2)
#             cv2.putText(frame, label, (box[0], box[1] - 10), 
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
#             # print("Backend service Inside _draw_boxes function 4")
#         return frame
    
# recognition_service = RecognitionService()
import cv2
import numpy as np
import os
import tempfile

from app.repositories.persons_repo import get_all_persons
from app.services.event_tracker import EventTracker
from app.core.model_loader import model_loader # <--- ADD THIS IMPORT

from moviepy import VideoFileClip, AudioFileClip

class RecognitionService:
    def __init__(self):
        # print("Initializing Recognition Service...")
        
        # --- OLD CODE (DELETE) ---
        # self.app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        # self.app.prepare(ctx_id=0, det_size=(384, 384))
        
        # --- NEW CODE (USE SHARED MODEL) ---
        self.app = model_loader.get_model() 
        
        self.known_faces = []
        self.load_known_faces()
        self.tracker = EventTracker(time_threshold=5.0) 

    def load_known_faces(self):
        # ... (Rest of the code remains exactly the same) ...
        persons = get_all_persons()
        print("total enrolled person : ", len(persons))
        self.known_faces = []
        for p in persons:
            self.known_faces.append({
                "name": p["name"],
                "person_id": p["person_id"],
                "embedding": np.array(p["embedding"], dtype=np.float32)
            })
        print(f"Loaded {len(self.known_faces)} identities into memory.")

    def process_video(self, input_path: str, output_path: str):
        # ... (Rest of the code remains exactly the same) ...
        # Just ensure indentation is correct
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file.")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
        
        temp_silent_path = output_path.replace(".mp4", "_silent.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
        out = cv2.VideoWriter(temp_silent_path, fourcc, fps, (width, height))

        frame_count = 0
        current_faces_data = [] 

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break 

                frame_count += 1
                current_timestamp = frame_count / fps

                # Process every frame
                if frame_count % 1 == 0:
                    print(f"Processing frame {frame_count} ({current_timestamp:.2f}s)...")
                    current_faces_data = self._analyze_frame(frame)
                    
                    for face_data in current_faces_data:
                        if face_data['is_known']:
                            self.tracker.update(face_data['name'], current_timestamp)

                annotated_frame = self._draw_boxes(frame, current_faces_data)
                out.write(annotated_frame)

        finally:
            print("Video ended. Flushing events...")
            self.tracker.save_all_remaining()
            cap.release()
            out.release() 

        # --- AUDIO MERGING LOGIC REMAINS SAME ---
        try:
            print(" Merging Audio and Optimizing Codec for Browser...")
            video_clip = VideoFileClip(temp_silent_path)
            
            try:
                original_audio = AudioFileClip(input_path)
                final_clip = video_clip.with_audio(original_audio)
            except Exception:
                print("No audio found in source or error loading audio. Proceeding silent.")
                final_clip = video_clip

            final_clip.write_videofile(
                output_path, 
                codec="libx264", 
                audio_codec="aac", 
                temp_audiofile="temp-audio.m4a",
                remove_temp=True,
                logger="bar" 
            )
            
            video_clip.close()
            if 'original_audio' in locals(): original_audio.close()
            final_clip.close()
            
            if os.path.exists(temp_silent_path):
                os.remove(temp_silent_path)
                
            print(f" Final video with audio saved to {output_path}")

        except Exception as e:
            print(f" Error during audio merge: {e}")
            if os.path.exists(temp_silent_path):
                if os.path.exists(output_path): os.remove(output_path)
                os.rename(temp_silent_path, output_path)

        return output_path

    def _analyze_frame(self, frame):
        # ... (No changes needed here) ...
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        faces = self.app.get(img_rgb) # Now uses the shared app instance
        results = []

        for face in faces:
            embedding = face.embedding
            norm = np.linalg.norm(embedding)
            if norm == 0: continue
            embedding = embedding / norm

            max_score = 0
            best_match_name = "Unknown"

            for known in self.known_faces:
                score = np.dot(embedding, known["embedding"])
                if score > max_score:
                    max_score = score
                    best_match_name = known["name"]

            is_match = max_score > 0.60
            results.append({
                "box": face.bbox.astype(int),
                "name": best_match_name if is_match else "Unknown",
                "score": max_score,
                "is_known": is_match
            })
        return results

    def _draw_boxes(self, frame, faces_data):
        # ... (No changes needed here) ...
        for data in faces_data:
            box = data["box"]
            color = (0, 255, 0) if data["is_known"] else (0, 0, 255)
            label = f"{data['name']} ({int(data['score'] * 100)}%)"
            cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), color, 2)
            cv2.putText(frame, label, (box[0], box[1] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        return frame
    
recognition_service = RecognitionService()