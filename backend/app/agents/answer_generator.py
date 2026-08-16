"""Answer synthesis. Retrieved document chunks are evidence only, never fallback output."""
import json
import re

from ..core.config import settings
from ..schemas import FormQuestion


def _compact(value: object, limit: int = 450) -> str:
    if isinstance(value, list):
        value = "; ".join(str(item) for item in value)
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _profile_values(evidence: dict) -> dict:
    merged = {}
    for item in evidence.get("structured", []):
        for key, value in item.get("data", {}).items():
            merged[key] = value
    return merged


def _structured_values(evidence: dict) -> dict:
    return _profile_values(evidence)


def _as_text(value: object) -> str:
    if isinstance(value, list):
        return " ".join(str(item) for item in value if item)
    return str(value or "")


def _format_internship_response(experience_values: object) -> str:
    items = []
    if isinstance(experience_values, list):
        items = [str(item).strip() for item in experience_values if str(item).strip()]
    elif experience_values:
        items = [str(experience_values).strip()]
    if not items:
        return ""

    role = ""
    company = ""
    duration = ""
    for item in items:
        lower = item.lower()
        if "intern" in lower or "trainee" in lower or "apprentice" in lower:
            role = item
            continue
        if "|" in item:
            company_part, duration_part = [part.strip() for part in item.split("|", 1)]
            if company_part and not company:
                company = company_part
            if duration_part and not duration:
                duration = duration_part
        elif " at " in lower and not company:
            company = item
        elif any(token in lower for token in ("jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec")) and not duration:
            duration = item
    if not role:
        role = items[0]
    if company and duration:
        return f"I worked as {role} at {company} from {duration}. This internship strengthened my software engineering and product-building skills."
    if company:
        return f"I worked as {role} at {company}. This internship strengthened my software engineering and product-building skills."
    if duration:
        return f"I worked as {role} from {duration}. This internship strengthened my software engineering and product-building skills."
    return f"I worked as {role}. This internship strengthened my software engineering and product-building skills."


def _question_specific_answer(question: FormQuestion, values: dict) -> str:
    label = question.label.lower()
    
    if any(term in label for term in ("diploma", "percentage", "diploma percentage")):
        diploma_pct = values.get("diploma_percentage", "")
        if diploma_pct:
            return diploma_pct
    
    if any(term in label for term in ("college", "college name", "institute")):
        college = values.get("college_name", "")
        if college:
            return college
    
    if any(term in label for term in ("degree", "current degree", "bachelor")):
        degree = values.get("degree_name", "")
        if degree:
            return degree
    
    if any(term in label for term in ("cgpa", "gpa", "grade point")):
        education_text = _as_text(values.get("education", ""))
        match = re.search(r"(?i)(?:cgpa|gpa)\s*[:=]?\s*(\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?)", education_text)
        if match:
            return match.group(1)
        match = re.search(r"(?i)(?:cgpa|gpa)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:/\s*\d+(?:\.\d+)?)?", education_text)
        if match:
            return match.group(1)
        match = re.search(r"(?i)(\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?)", education_text)
        if match:
            return match.group(1)

    if any(term in label for term in ("internship", "internships", "intern")):
        experience_values = values.get("experience", [])
        if isinstance(experience_values, list):
            internship_story = _format_internship_response(experience_values)
            if internship_story:
                return internship_story
        for item in experience_values if isinstance(experience_values, list) else [experience_values]:
            text = str(item or "").lower()
            if "intern" in text:
                return _format_internship_response([item])

    return ""


def _direct_answer(question: FormQuestion, classification: str, evidence: dict) -> str:
    values = _profile_values(evidence) or _structured_values(evidence)
    label = question.label.lower()

    specific = _question_specific_answer(question, values)
    if specific:
        return specific

    preferred = {
        "personal": "full_name", "education": "education", "experience": "experience",
        "skills": "skills", "project": "projects", "achievement": "achievements",
    }.get(classification)
    if classification == "contact":
        if any(term in label for term in ("number", "contact", "phone", "mobile", "telephone")):
            preferred = "phone"
        elif "email" in label:
            preferred = "email"
        elif any(term in label for term in ("address", "location", "city")):
            preferred = "address"
        elif "linkedin" in label or "github" in label or "website" in label or "link" in label:
            preferred = "links"
        else:
            preferred = next((key for key in ("email", "phone", "address", "location", "links") if values.get(key)), None)
    return _compact(values.get(preferred)) if preferred else ""


def _self_introduction(evidence: dict) -> str:
    values = _profile_values(evidence) or _structured_values(evidence)
    headline = _compact(values.get("headline"))
    experience = _compact(values.get("experience"))
    skills = _compact(values.get("skills"), 180)
    projects = _compact(values.get("projects"), 180)
    parts = []
    if headline:
        parts.append(f"I am a {headline.lower().rstrip('.')}.")
    if experience:
        parts.append(experience.rstrip(".") + ".")
    if skills:
        parts.append(f"My key skills include {skills}.")
    if projects:
        parts.append(f"I have also worked on {projects}.")
    return " ".join(parts)


def generate_with_gemini(question: FormQuestion, evidence: dict, strict: bool = False) -> dict | None:
    if not settings.gemini_api_key:
        return None
    prompt = f"""Generate one concise, natural response for a web form question.
Return valid JSON only: {{"answer":"...","confidence":0.0,"needs_user_input":false}}.
Question: {question.label}
Classification: {evidence['classification']}
Form context: {evidence['form_title']} | {evidence['section_title']} | neighbors: {evidence['neighboring_questions']}
Priority order:
1. Document evidence and user-provided extra info: {evidence['vector']}
2. Structured profile evidence: {evidence['structured']}
3. Approved prior answers if needed
Rules: answer the question directly; prefer concrete document facts over generic profile text; do not copy document text verbatim; do not expose OCR/PDF text; do not invent facts; omit irrelevant fields; use a concise answer; return needs_user_input=true with an empty answer if evidence is insufficient. {'Use only structured evidence.' if strict else ''}"""
    try:
        from google import genai
        response = genai.Client(api_key=settings.gemini_api_key).models.generate_content(model=settings.gemini_model, contents=prompt)
        raw = (response.text or "").strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(raw)
        return {"answer": str(parsed.get("answer", "")).strip(), "confidence": float(parsed.get("confidence", 0.0)), "needs_user_input": bool(parsed.get("needs_user_input", False))}
    except Exception:
        return None


def synthesize_answer(question: FormQuestion, classification: str, evidence: dict, strict: bool = False) -> dict:
    generated = generate_with_gemini(question, evidence, strict)
    if generated:
        return generated
    direct = _direct_answer(question, classification, evidence)
    if direct:
        return {"answer": direct, "confidence": 0.9, "needs_user_input": False}
    if classification == "open_ended":
        introduction = _self_introduction(evidence)
        if introduction:
            return {"answer": introduction, "confidence": 0.82, "needs_user_input": False}
    if classification == "ambiguous":
        return {"answer": "No additional information at this time.", "confidence": 0.55, "needs_user_input": False}
    return {"answer": "", "confidence": 0.0, "needs_user_input": True}
