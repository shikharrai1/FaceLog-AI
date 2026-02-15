
import os
import cv2
import numpy as np
from typing import List, Dict, Optional
from uuid import uuid4 
import time

from app.core.model_loader import model_loader, model_lock

from app.models.person import create_person_document
from app.repositories.persons_repo import insert_person


class EnrollmentService:
    """
    Handles supervised face enrollment with full error reporting.
    Supports file-based, webcam-based, and remote IP Camera (URL) enrollment.
    """

    def __init__(self):
        # Using the standard model 
        self.app = model_loader.get_model()
        # Prepare permanent storage directory
        self.faces_storage_dir = "data/enrolled_faces"
        os.makedirs(self.faces_storage_dir, exist_ok=True)

    def enroll_folder(self, folder_path: str) -> List[Dict]:
        """Walks through a folder and enrolls all valid images."""
        if not os.path.isdir(folder_path):
            raise ValueError(f"Folder does not exist: {folder_path}")

        results = []
        processed_images = 0
        for root, _, files in os.walk(folder_path):
            rel_path = os.path.relpath(root, folder_path)
            depth = 0 if rel_path == "." else rel_path.count(os.sep) + 1
            if depth > 1: continue

            for filename in files:
                if filename.lower().endswith(".zip"): continue
                if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    results.append({"filename": filename, "status": "failed", "reason": "Unsupported format"})
                    continue

                image_path = os.path.join(root, filename)
                processed_images += 1
                results.extend(self.enroll_single_image(image_path=image_path, folder_name=os.path.basename(root)))

        return results

    def enroll_single_image(self, image_path: str,original_name: str = None, folder_name: str = None) -> List[Dict]:
        """Reads image from disk and passes to the core processor."""
        if original_name:
            filename = original_name
        else:
            filename = os.path.basename(image_path)

        image = cv2.imread(image_path)
        if image is None or image.size == 0:
            return [{"filename": filename, "status": "failed", "reason": "Unreadable image"}]
        return self.process_frame_to_embedding(image, filename, folder_name)

    def enroll_from_url(self, camera_url: str, person_name: str) -> List[Dict]:
        """
        NEW: Connects to a remote CCTV/IP Camera URL and captures a frame.
        """
        cap = cv2.VideoCapture(camera_url)
        if not cap.isOpened():
            return [{"filename": camera_url, "status": "failed", "reason": "Could not connect to Camera URL"}]

        try:
            # Skip first few frames to allow camera to adjust exposure
            for _ in range(5): cap.grab()
            
            ret, frame = cap.read()
            if not ret or frame is None:
                return [{"filename": camera_url, "status": "failed", "reason": "Failed to grab frame from stream"}]

            source_name = f"url_capture_{person_name}.jpg"
            return self.process_frame_to_embedding(frame, source_name)
        
        finally:
            cap.release()

    def process_frame_to_embedding(self, frame: np.ndarray, source_name: str, folder_name: Optional[str] = None) -> List[Dict]:
        """
        CORE PROCESSOR: The "Universal Brain" of enrollment.
        """
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        with model_lock:
            faces = self.app.get(image_rgb)
        
        length = len(faces)
        if length == 0:
            print("no face in this frame...")
        if not faces:
            return [{"filename": source_name, "status": "failed", "reason": "No face detected"}]
        # print("control will not go further bcoz it was returned above...")
        results = []
        for face_index, face in enumerate(faces):
            box = face.bbox.astype(int)
            x1, y1, x2, y2 = box
            w, h = x2 - x1, y2 - y1

            # Quality checks
            if w < 40 or h < 40:
                results.append({"filename": source_name, "status": "failed", "reason": "Face too small"})
                continue
            if face.det_score < 0.60:
                results.append({"filename": source_name, "status": "failed", "reason": "Low confidence", "confidence": float(face.det_score)})
                continue

            embedding = face.embedding
            norm = np.linalg.norm(embedding)
            if norm == 0: continue
            embedding_list = (embedding / norm).tolist()

            # Prepare Face Crop
            img_h, img_w, _ = frame.shape
            pad_x, pad_y = int(w * 0.1), int(h * 0.1)
            crop_x1, crop_y1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
            crop_x2, crop_y2 = min(img_w, x2 + pad_x), min(img_h, y2 + pad_y)
            face_crop = frame[crop_y1:crop_y2, crop_x1:crop_x2]
            
            crop_filename = f"{uuid4()}.jpg"
            crop_path = os.path.join(self.faces_storage_dir, crop_filename)
            cv2.imwrite(crop_path, face_crop)

            static_url = f"/static/enrolled_faces/{crop_filename}"

            # Create & Insert DB Document
            person_doc = create_person_document(
                embedding=embedding_list,
                filename=source_name,
                bbox=[int(x1), int(y1), int(w), int(h)],
                confidence=float(face.det_score),
                folder_name=folder_name
            )
            person_doc["face_image_path"] = static_url
            db_result = insert_person(person_doc)

            results.append({
                "filename": source_name,
                "face_index": face_index,
                "status": "enrolled",
                "person_id": db_result["person_id"],
                "confidence": float(face.det_score),
                "face_image": static_url  
            })
        return results

