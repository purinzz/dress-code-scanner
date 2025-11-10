from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Depends, Form, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import Request
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from jose import JWTError, jwt
import os, shutil
from typing import Optional, Union, List, Dict

# ------------------------------
# Load environment variables
# ------------------------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/qr_scanner_db")
DB_NAME = os.getenv("DB_NAME", "qr_scanner_db")
SECRET_KEY = os.getenv("SECRET_KEY", "my_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# ------------------------------
# MongoDB connection
# ------------------------------
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
reports_collection = db["reports"]
users_collection = db["users"]

# ------------------------------
# FastAPI app
# ------------------------------
app = FastAPI(title="QR Scanner Backend", version="1.0")

# ------------------------------
# Static file mount (uploads)
# ------------------------------
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ------------------------------
# Password Hashing & JWT
# ------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    try:
        # bcrypt limit workaround: always truncate to 72 bytes max
        return pwd_context.hash(password[:72])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password hashing failed: {str(e)}")






def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Extract current user's email from token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return email

# ------------------------------
# Auth Routes


@app.post("/auth/signup")
async def signup(
    request: Request,
    email: str = Form(None),
    password: str = Form(None)
):
    """
    Register a new user with email and password.
    Accepts both form-data and JSON.
    """
    # Try to extract JSON if no Form data is present
    if not email or not password:
        try:
            data = await request.json()
            email = data.get("email")
            password = data.get("password")
        except Exception:
            raise HTTPException(status_code=422, detail="Missing email or password in form or JSON body")

    # Basic validation
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if len(password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Password cannot be empty")

    # Check if email exists
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    try:
        # Ensure password fits bcrypt’s 72-byte limit safely
        safe_pw = password.encode("utf-8")[:72].decode("utf-8", "ignore")
        hashed_pw = get_password_hash(safe_pw)

        users_collection.insert_one({
            "email": email,
            "password": hashed_pw,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

    return {"message": "User created successfully"}




@app.post("/auth/login")
async def login(request: Request, email: str = Form(None), password: str = Form(None)):
    """
    Authenticate user by email and password.
    Handles both form-data and JSON body automatically.
    """
    # Try to load JSON if form fields are empty
    if not email or not password:
        try:
            data = await request.json()
            email = data.get("email")
            password = data.get("password")
        except Exception:
            # Log whatever data FastAPI receives for debugging
            raw_body = await request.body()
            print("⚠️ RAW BODY (could not parse as JSON):", raw_body)
            raise HTTPException(status_code=422, detail="Missing email or password")

    # Debug print — this shows what Flutter is actually sending
    print("🧩 DEBUG LOGIN DATA:", {"email": email, "password": password})

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    # Check if user exists
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate JWT token
    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer"}




# ------------------------------
# Report Model and Routes
# ------------------------------
class ReportIn(BaseModel):
    student_info: Union[str, Dict[str, object]]
    violations: Union[str, List[Union[str, object]]]
    scanned_at: Optional[datetime] = None
    image_path: Optional[str] = None
    


@app.get("/test_env/")
def test_env():
    return {"MONGO_URI": MONGO_URI, "DB_NAME": DB_NAME}


@app.post("/submit_report/")
def submit_report(report: ReportIn):
    # Combine violations into a readable string
    violation_text = ", ".join(report.violations) if isinstance(report.violations, list) else report.violations

    # Student name or identifier (since it's a string now)
    student_name = report.student_info

    # Count existing offenses for the same student
    previous_reports = reports_collection.count_documents({"student_info": student_name})
    offense_number = previous_reports + 1

    report_data = {
        "student_info": student_name,
        "violation": violation_text,
        "no_of_offense": offense_number,
        "scanned_at": datetime.utcnow(),
        "image_path": None,
        "submitted_by": "Anonymous",
        "isDeleted": False,
    }

    result = reports_collection.insert_one(report_data)
    inserted_id = str(result.inserted_id)

    curl_command = (
        f'curl -X POST "http://127.0.0.1:8000/upload_image/?report_id={inserted_id}" '
        f'-F "file=@your_image.png"'
    )

    return {"status": "success", "id": inserted_id, "curl_upload": curl_command}









@app.post("/upload_image/")
def upload_image(
    report_id: str = Query(...),
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    try:
        oid = ObjectId(report_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid report_id format")

    report = reports_collection.find_one({"_id": oid})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{file.filename}"
    reports_collection.update_one({"_id": oid}, {"$set": {"image_path": file_url}})

    return {"status": "success", "report_id": report_id, "file_url": file_url}


@app.get("/reports/")
def get_reports(current_user: str = Depends(get_current_user)):
    reports = []
    for r in reports_collection.find().sort("scanned_at", -1):
        r["_id"] = str(r["_id"])
        # Ensure no_of_offense always exists
        r["no_of_offense"] = r.get("no_of_offense", 1)
        reports.append(r)
    return {"reports": reports}


