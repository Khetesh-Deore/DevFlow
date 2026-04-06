import subprocess
import time
import os
import sys

from models import ExecuteRequest, ExecuteResponse, TestCaseResult
from languages import get_language_config
from sandbox import create_sandbox, write_code, cleanup_sandbox
from comparator import get_verdict

IS_WINDOWS = sys.platform == 'win32'


def _resolve_cmd(cmd: list, filepath: str, outpath: str, dirpath: str) -> list:
    return [
        token
        .replace("{filepath}", filepath)
        .replace("{outpath}", outpath)
        .replace("{dirpath}", dirpath)
        for token in cmd
    ]


async def execute_code(request: ExecuteRequest) -> ExecuteResponse:
    config = get_language_config(request.language)
    sandbox = create_sandbox()

    try:
        filepath = write_code(sandbox, config["filename"], request.code)
        dirpath = sandbox
        # On Windows, compiled binaries need .exe extension
        binary_name = "solution.exe" if IS_WINDOWS and config["compiled_output"] else (config["compiled_output"] or "")
        outpath = os.path.join(sandbox, binary_name) if binary_name else ""

        # Compilation step
        if config["compile_cmd"]:
            compile_cmd = _resolve_cmd(config["compile_cmd"], filepath, outpath, dirpath)
            try:
                result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    timeout=30,
                    cwd=sandbox
                )
            except subprocess.TimeoutExpired:
                return ExecuteResponse(
                    overall_status="compilation_error",
                    results=[],
                    passed=0,
                    total=len(request.testcases),
                    compile_error="Compilation timed out"
                )

            if result.returncode != 0:
                return ExecuteResponse(
                    overall_status="compilation_error",
                    results=[],
                    passed=0,
                    total=len(request.testcases),
                    compile_error=result.stderr.decode(errors="replace")[:2000]
                )

        # Execution loop
        results = []
        timeout_sec = (request.time_limit / 1000) + 0.5
        run_cmd = _resolve_cmd(config["run_cmd"], filepath, outpath, dirpath)

        for tc in request.testcases:
            timed_out = False
            stdout = ""
            stderr = ""
            returncode = 0
            start = time.time()

            try:
                # Ensure input ends with newline for readline-based code
                tc_input = tc.input if tc.input.endswith('\n') else tc.input + '\n'
                proc = subprocess.run(
                    run_cmd,
                    input=tc_input.encode(),
                    capture_output=True,
                    timeout=timeout_sec,
                    cwd=sandbox
                )
                stdout = proc.stdout.decode(errors="replace")
                stderr = proc.stderr.decode(errors="replace")
                returncode = proc.returncode

            except subprocess.TimeoutExpired:
                timed_out = True
                stderr = "Time limit exceeded"

            time_taken = int((time.time() - start) * 1000)

            verdict = get_verdict(
                expected=tc.expected_output,
                actual=stdout,
                returncode=returncode,
                stderr=stderr,
                timed_out=timed_out
            )

            results.append(TestCaseResult(
                testcase_id=tc.id,
                status=verdict,
                time_taken_ms=time_taken,
                memory_used_kb=0,
                stdout=stdout[:2000],
                stderr=stderr[:500],
                expected=tc.expected_output[:500],
                got=stdout[:500]
            ))

        # Overall status
        passed = sum(1 for r in results if r.status == "accepted")
        overall = "accepted"
        for r in results:
            if r.status != "accepted":
                overall = r.status
                break

        return ExecuteResponse(
            overall_status=overall,
            results=results,
            passed=passed,
            total=len(results)
        )

    finally:
        cleanup_sandbox(sandbox)
