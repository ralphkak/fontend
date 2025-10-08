import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .lifelogger import lifelog_db, create_log_item
from .google_oauth import router as google_oauth_router, get_drive_status

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/life-logger", StaticFiles(directory="app/lifelogger_app", html=True), name="life-logger")
templates = Jinja2Templates(directory="app/templates")
STATE = {"google": {"connected": False, "email": None, "token": None}}
app.STATE = STATE

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    drive_status = get_drive_status(STATE)
    return templates.TemplateResponse("index.html", {
        "request": request,
        "apps": [
            {"id": "lifelogger", "label": "Life Logger"},
            {"id": "aiimg", "label": "AI Image"},
            {"id": "prints", "label": "3D Printing"},
            {"id": "trading", "label": "Trading"},
        ],
        "drive_status": drive_status,
    })

@app.post("/api/lifelogger/create")
async def api_lifelogger_create(item: dict):
    try:
        created = create_log_item(item)
        return {"ok": True, "item": created}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/lifelogger/list")
async def api_lifelogger_list():
    return {"ok": True, "items": list(reversed(lifelog_db))}

app.include_router(google_oauth_router, prefix="/google")
