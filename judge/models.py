from pydantic import BaseModel
from typing import List, Optional


class TestCaseInput(BaseModel):
    id: str
    input: str
    expected_output: str = ""


class ExecuteRequest(BaseModel):
    code: str
    language: str
    testcases: List[TestCaseInput]
    time_limit: int = 2000
    memory_limit: int = 256
    mode: str = "submit"


class TestCaseResult(BaseModel):
    testcase_id: str
    status: str
    time_taken_ms: int
    memory_used_kb: int = 0
    stdout: str
    stderr: str
    expected: str
    got: str


class ExecuteResponse(BaseModel):
    overall_status: str
    results: List[TestCaseResult]
    passed: int
    total: int
    compile_error: Optional[str] = None
