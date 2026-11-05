import sys
import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(redirect_slashes=False)

init_error = None
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, ".."))
    backend_dir = os.path.join(root_dir, "backend")

    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    from main import app as backend_app
    app.mount("/", backend_app)
except Exception as e:
    init_error = traceback.format_exc()
    print("API INITIALIZATION ERROR:", init_error, file=sys.stderr)


@app.get("/api/health")
def api_health_check():
    if init_error:
        return JSONResponse(status_code=500, content={"error": "Initialization Failed", "traceback": init_error})
    return {"status": "healthy"}


@app.middleware("http")
async def check_init_middleware(request: Request, call_next):
    if init_error:
        return JSONResponse(status_code=500, content={"error": "Initialization Failed", "traceback": init_error})
    return await call_next(request)
