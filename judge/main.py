import os
import time
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
        print(f"❌ [AUTH] Unauthorized request to {request.url.path}")
        return JSONResponse(status_code=401, content={"error": "Unauthorized: invalid or missing API key"})

    return await call_next(request)


@app.get("/health")
def health():
    print("💓 [HEALTH] Health check OK")
    return {"status": "ok", "service": "judge"}


@app.get("/languages")
def languages():
    return {"languages": list(LANGUAGE_CONFIG.keys())}


@app.post("/execute", response_model=ExecuteResponse)
async def execute(request: ExecuteRequest):
    start = time.time()
    print(f"\n{'='*60}")
    print(f"📨 [JUDGE] New execution request")
    print(f"   Language : {request.language}")
    print(f"   Mode     : {request.mode}")
    print(f"   TestCases: {len(request.testcases)}")
    print(f"   TimeLimit: {request.time_limit}ms")
    print(f"   Code     : {len(request.code)} chars")
    print(f"   Code preview:\n{request.code[:200]}{'...' if len(request.code) > 200 else ''}")

    try:
        result = await execute_code(request)

        elapsed = round((time.time() - start) * 1000)
        print(f"\n📊 [JUDGE] Execution complete in {elapsed}ms")
        print(f"   Overall  : {result.overall_status.upper()}")
        print(f"   Passed   : {result.passed}/{result.total}")

        if result.compile_error:
            print(f"   ❌ Compile Error:\n{result.compile_error[:300]}")

        for i, r in enumerate(result.results):
            icon = "✅" if r.status == "accepted" else "❌"
            print(f"   {icon} TC{i+1}: {r.status} | {r.time_taken_ms}ms")
            if r.status != "accepted":
                print(f"      Expected : {repr(r.expected[:200])}")
                print(f"      Got      : {repr(r.got[:200])}")
                if r.stderr:
                    print(f"      Stderr   :\n{r.stderr}")  # Full stderr

        print(f"{'='*60}\n")
        return result

    except ValueError as e:
        print(f"❌ [JUDGE] ValueError: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        print(f"❌ [JUDGE] Exception: {e}")
        return JSONResponse(status_code=500, content={"error": f"Judge error: {str(e)}"})
