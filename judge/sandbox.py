import os
import shutil
import uuid
import tempfile


def create_sandbox() -> str:
    # Use system temp dir (works on both Windows and Linux)
    path = os.path.join(tempfile.gettempdir(), f"judge_{uuid.uuid4().hex}")
    os.makedirs(path, exist_ok=True)
    return path


def write_code(sandbox_path: str, filename: str, code: str) -> str:
    filepath = os.path.join(sandbox_path, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    return filepath


def cleanup_sandbox(sandbox_path: str):
    shutil.rmtree(sandbox_path, ignore_errors=True)
