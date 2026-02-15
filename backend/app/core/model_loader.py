import numpy as np
import threading
from insightface.app import FaceAnalysis

class ModelLoader:
    _instance = None
    _app = None

    @staticmethod
    def get_model():
        if ModelLoader._app is None:
            print(" Loading InsightFace Model (buffalo_l)... This might take a moment.")
            ModelLoader._app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            ModelLoader._app.prepare(ctx_id=0, det_size=(640, 640))
            print(" Model Loaded Successfully!")
        return ModelLoader._app

# Global access point
model_loader = ModelLoader()
model_lock = threading.Lock()