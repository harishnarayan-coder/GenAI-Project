import sys
import os

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, ".."))
    backend_dir = os.path.join(root_dir, "backend")

    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    # Import the FastAPI app
    from main import app
except Exception as exc:
    import traceback
    trace = traceback.format_exc()
    found_files = []
    try:
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        for r, d, f in os.walk(base):
            for name in f:
                found_files.append(os.path.relpath(os.path.join(r, name), base))
    except Exception:
        pass

    debug_msg = f"API Initialization Error:\n{trace}\n\nFiles present in Lambda root:\n" + "\n".join(found_files[:60])
    print(debug_msg, file=sys.stderr)

    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    def fallback_route(path: str = ""):
        return PlainTextResponse(debug_msg, status_code=500)
