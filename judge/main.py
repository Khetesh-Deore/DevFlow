import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from models import ExecuteRequest, ExecuteResponse
from executor import execute_code
from languages import LANGUAGE_CONFIG

app = FastAPI(title="Code Judge Service")

API_KEY = os.getenv("API_KEY", "")


@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    if request.url.path in ("/health", "/languages"):
        return await call_next(request)

    key = request.headers.get("X-API-Key")
    if not key or key != API_KEY:
        return JSONResponse(status_code=401, content={"error": "Unauthorized: invalid or missing API key"})

    return await call_next(request)


@app.get("/health")
def health():
    return {"status": "ok", "service": "judge"}


@app.get("/languages")
def languages():
    return {"languages": list(LANGUAGE_CONFIG.keys())}


@app.post("/execute", response_model=ExecuteResponse)
async def execute(request: ExecuteRequest):
    try:
        result = await execute_code(request)
        return result
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Judge error: {str(e)}"})
