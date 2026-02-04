
import os
import cv2
import numpy as np
from typing import List, Dict
from uuid import uuid4 

from insightface.app import FaceAnalysis

from app.models.person import create_person_document
from app.repositories.persons_repo import insert_person


class EnrollmentService:
    """
    Handles supervised face enrollment with full error reporting.
    """

    def __init__(self):
        # Using the standard model 
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )
        self.app.prepare(ctx_id=0, det_size=(384, 384))

  

    def enroll_folder(self, folder_path: str) -> List[Dict]:
        if not os.path.isdir(folder_path):
            raise ValueError(f"Folder does not exist: {folder_path}")

        results = []
        processed_images = 0

        for root, _, files in os.walk(folder_path):

            # ---- Depth check ----
            rel_path = os.path.relpath(root, folder_path)
            depth = 0 if rel_path == "." else rel_path.count(os.sep) + 1

            if depth > 1:
          
                print(f"Skipping deep folder: {rel_path}")
                continue

            for filename in files:

               
                if filename.lower().endswith(".zip"):
                    continue

                if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    results.append({
                        "filename": filename,
                        "status": "failed",
                        "reason": "Unsupported file format"
                    })
                    continue

                image_path = os.path.join(root, filename)
                processed_images += 1

                results.extend(
                    self.enroll_single_image(
                        image_path=image_path,
                        folder_name=os.path.basename(root)
                    )
                )

        if processed_images == 0:
            return [{
                "status": "failed",
                "reason": "No valid images found in ZIP"
            }]

        return results

    def enroll_single_image(self, image_path: str, folder_name: str = None) -> List[Dict]:
        """
        Enrolls faces from a single image.
        Saves a cropped face image to disk for the Gallery.
        """

        filename = os.path.basename(image_path)

        image = cv2.imread(image_path)

        if image is None or image.size == 0:
            return [{
                "filename": filename,
                "status": "failed",
                "reason": "Unreadable or corrupted image"
            }]

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run detection
        faces = self.app.get(image_rgb)

        if not faces:
            return [{
                "filename": filename,
                "status": "failed",
                "reason": "No face detected"
            }]

        results = []

        # --- PREPARE PERMANENT STORAGE ---
        # We will save face crops here so they persist after temp dir is deleted
        faces_storage_dir = "data/enrolled_faces"
        os.makedirs(faces_storage_dir, exist_ok=True)

        for face_index, face in enumerate(faces):
            box = face.bbox.astype(int)
            x1, y1, x2, y2 = box
            w, h = x2 - x1, y2 - y1

            # ---- Quality checks ----

            if w < 40 or h < 40:
                results.append({
                    "filename": filename,
                    "face_index": face_index,
                    "status": "failed",
                    "reason": "Face too small",
                    "bbox": [int(x1), int(y1), int(w), int(h)]
                })
                continue

            if face.det_score < 0.60:
                results.append({
                    "filename": filename,
                    "face_index": face_index,
                    "status": "failed",
                    "reason": "Low detection confidence",
                    "confidence": float(face.det_score)
                })
                continue

            embedding = face.embedding
            norm = np.linalg.norm(embedding)

            if norm == 0:
                results.append({
                    "filename": filename,
                    "face_index": face_index,
                    "status": "failed",
                    "reason": "Invalid embedding (zero norm)"
                })
                continue

            embedding = (embedding / norm).tolist()

       
            img_h, img_w, _ = image.shape
            pad_x = int(w * 0.1)
            pad_y = int(h * 0.1)
            
            crop_x1 = max(0, x1 - pad_x)
            crop_y1 = max(0, y1 - pad_y)
            crop_x2 = min(img_w, x2 + pad_x)
            crop_y2 = min(img_h, y2 + pad_y)

            face_crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
            
            # Generate unique filename for the crop
            crop_filename = f"{uuid4()}.jpg"
            crop_path = os.path.join(faces_storage_dir, crop_filename)
            
            # Save to disk
            cv2.imwrite(crop_path, face_crop)

            #  static URL for the frontend
            static_url = f"/static/enrolled_faces/{crop_filename}"

            # ---- Create & insert ----
            person_doc = create_person_document(
                embedding=embedding,
                filename=filename,
                bbox=[int(x1), int(y1), int(w), int(h)],
                confidence=float(face.det_score),
                folder_name=folder_name
            )

        
            person_doc["face_image_path"] = static_url
            # print(" In Enrollment_serivces1...")
            db_result = insert_person(person_doc)
            # print(" In Enrollment_serivces2...")

            results.append({
                "filename": filename,
                "face_index": face_index,
                "status": "enrolled",
                "person_id": db_result["person_id"],
                "confidence": float(face.det_score),
                "face_image": static_url  
            })
            # print(" In Enrollment_serivces3...")

        return results

