import sys
import shutil

def get_python_cmd():
    # Use the same python that's running this judge service
    return sys.executable

PYTHON_CMD = get_python_cmd()

LANGUAGE_CONFIG = {
    "python": {
        "extension": ".py",
        "filename": "solution.py",
        "compile_cmd": None,
        "run_cmd": [PYTHON_CMD, "{filepath}"],
        "compiled_output": None
    },
    "cpp": {
        "extension": ".cpp",
        "filename": "solution.cpp",
        "compile_cmd": ["g++", "-O2", "-o", "{outpath}", "{filepath}"],
        "run_cmd": ["{outpath}"],
        "compiled_output": "solution"
    },
    "c": {
        "extension": ".c",
        "filename": "solution.c",
        "compile_cmd": ["gcc", "-O2", "-o", "{outpath}", "{filepath}"],
        "run_cmd": ["{outpath}"],
        "compiled_output": "solution"
    },
    "java": {
        "extension": ".java",
        "filename": "Main.java",
        "compile_cmd": ["javac", "{filepath}"],
        "run_cmd": ["java", "-cp", "{dirpath}", "Main"],
        "compiled_output": None
    },
    "javascript": {
        "extension": ".js",
        "filename": "solution.js",
        "compile_cmd": None,
        "run_cmd": ["node", "{filepath}"],
        "compiled_output": None
    }
}


def get_language_config(language: str) -> dict:
    config = LANGUAGE_CONFIG.get(language)
    if not config:
        raise ValueError(f"Unsupported language: {language}")
    return config
