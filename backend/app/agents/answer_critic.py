"""Reject ungrounded, garbled, or raw-chunk-like answers before validation."""
import re
from difflib import SequenceMatcher


def _normalise(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower()).strip()


def critic(answer: str, evidence: dict, needs_user_input: bool) -> tuple[bool, str]:
    if needs_user_input:
        return True, "needs_user_input"
    if not answer.strip():
        return False, "empty answer without needs_user_input"
    if "\ufffd" in answer or len(re.findall(r"[^\w\s.,;:()'&/@+\-]", answer)) > max(3, len(answer) // 12):
        return False, "contains PDF/OCR garbage"
    normalised = _normalise(answer)
    for chunk in evidence.get("vector", []):
        candidate = _normalise(chunk["text"])
        if len(normalised) > 40 and (normalised in candidate or SequenceMatcher(None, normalised, candidate).ratio() > 0.72):
            return False, "answer is substantially copied from a retrieved chunk"
    if evidence["classification"] not in {"ambiguous", "unknown"} and not evidence.get("structured") and not evidence.get("vector"):
        return False, "unsupported claim without evidence"
    return True, "passed"
