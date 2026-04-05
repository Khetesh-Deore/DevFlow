def normalize_output(output: str) -> str:
    lines = output.splitlines()
    lines = [line.rstrip() for line in lines]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def compare_outputs(expected: str, actual: str) -> bool:
    return normalize_output(expected) == normalize_output(actual)


def get_verdict(expected: str, actual: str, returncode: int, stderr: str, timed_out: bool) -> str:
    if timed_out:
        return "time_limit_exceeded"
    if returncode != 0:
        return "runtime_error"
    if compare_outputs(expected, actual):
        return "accepted"
    return "wrong_answer"
