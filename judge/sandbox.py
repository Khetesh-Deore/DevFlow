import os
import shutil
import uuid


def create_sandbox() -> str:
    path = os.path.join("/tmp", f"judge_{uuid.uuid4().hex}")
    os.makedirs(path, exist_ok=True)
    return path


def write_code(sandbox_path: str, filename: str, code: str) -> str:
    filepath = os.path.join(sandbox_path, filename)
    with open(filepath, "w") as f:
        f.write(code)
    return filepath


def cleanup_sandbox(sandbox_path: str):
    shutil.rmtree(sandbox_path, ignore_errors=True)
