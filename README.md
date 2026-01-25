# FaceLog-AI — Face Enrollment & Recognition System

A full-stack project using:
- **Python** (Core backend logic)
- **FastAPI** (API bridge between backend & frontend)
- **React** (Frontend UI)
- **MongoDB** (Database)
- **InsightFace** (Face Recognition AI)

---

#  Project Structure

FaceLog-AI/
├── backend/ → Python + FastAPI API
└── frontend/ → React UI


---

#  How to Run This Project (Step-by-Step)

## STEP 1 — Clone the Repository
```bash
git clone <GITHUB_REPO_URL>
cd FaceLog-AI
## STEP 2 — Backend Setup (Python + FastAPI)
Go to backend folder:
cd backend
Create virtual environment:
python -m venv venv
Activate it:
Windows

venv\Scripts\activate
Mac/Linux

source venv/bin/activate
Install dependencies:
pip install -r requirements.txt
## STEP 3 — Backend Environment Setup
Create file:

backend/.env
Add:

MONGODB_URI=PASTE_MONGO_URI_HERE
BACKEND_URL=http://localhost:8000
## STEP 4 — Run Backend Server
from FaceLog-AI\backend copy commnad given below
uvicorn app.main:app --reload
Backend runs at:

http://127.0.0.1:8000
## STEP 5 — Frontend Setup (React)
Open new terminal and go to frontend:

cd frontend
Install packages:

npm install
Create file:

frontend/.env
Add:

VITE_API_BASE_URL=http://127.0.0.1:8000
Run frontend:

npm run dev
Frontend runs at:

http://127.0.0.1:5173
# How to Use
Enroll Faces → Upload image or ZIP

Recognize Faces → Upload video

Gallery → View enrolled people

Logs → Search by Name / Date / Time

Export CSV → Download activity report

