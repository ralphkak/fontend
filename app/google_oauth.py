import os, secrets, requests
from urllib.parse import urlencode
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse

router = APIRouter()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
OAUTH_REDIRECT = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/google/callback")
SCOPES = ["https://www.googleapis.com/auth/drive.file", "email", "profile"]

def get_drive_status(state):
    return {"connected": state["google"]["connected"], "email": state["google"]["email"]}

@router.get("/connect")
def connect(request: Request):
    nonce = secrets.token_urlsafe(16)
    request.app.state.oauth_state = nonce
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": OAUTH_REDIRECT,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "state": nonce,
        "prompt": "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)

@router.get("/callback")
def callback(request: Request, code: str = "", state: str = ""):
    if not code or state != getattr(request.app.state, "oauth_state", ""):
        return JSONResponse({"ok": False, "error": "invalid_state_or_code"}, status_code=400)
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": OAUTH_REDIRECT,
        "grant_type": "authorization_code"
    }
    token = requests.post("https://oauth2.googleapis.com/token", data=data).json()
    if "access_token" not in token:
        return JSONResponse({"ok": False, "error": token}, status_code=400)
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {token['access_token']}"}
    ).json()
    request.app.STATE["google"] = {"connected": True, "email": userinfo.get("email"), "token": token}
    return RedirectResponse("/")

@router.get("/status")
def status(request: Request):
    return get_drive_status(request.app.STATE)

@router.post("/disconnect")
def disconnect(request: Request):
    request.app.STATE["google"] = {"connected": False, "email": None, "token": None}
    return {"ok": True}
