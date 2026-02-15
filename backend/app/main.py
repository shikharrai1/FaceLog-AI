import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import db
from app.routes.enrollment import router as enrollment_router
from app.routes.recognition import router as recognition_router
from app.routes.analysis import router as analysis_router 
from app.routes.live import router as live_router

app = FastAPI(title="FaceLog-AI")

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOUNT STATIC FILES ---

os.makedirs("data/processed", exist_ok=True)
os.makedirs("data/enrolled_faces", exist_ok=True)

# Mount 'data' folder to /static changes on 23/01/2026---22:41
# app.mount("/static", StaticFiles(directory="data"), name="static")
app.mount(
    "/static/enrolled_faces",
    StaticFiles(directory="data/enrolled_faces"),
    name="enrolled_faces"
)

# --- ROUTES ---
app.include_router(enrollment_router)
app.include_router(recognition_router)
app.include_router(analysis_router)  
app.include_router(live_router)

@app.get("/health/db")
def health_db():
    return {
        "status": "ok",
        "db_name": db.name,
        "collections": db.list_collection_names()
    }
