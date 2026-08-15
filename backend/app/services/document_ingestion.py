"""Clean document text and extract conservative resume-like structured fields."""
import re
import unicodedata


STRUCTURED_FIELDS = ("name", "email", "phone", "address", "education", "experience", "skills", "projects", "certifications", "achievements", "links")


def clean_document_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).replace("\ufffd", " ")
    text = text.replace("â€¢", "•").replace("", " ").replace("ï", " ").replace("§", " ")
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x80-\x9f]", " ", text)
    text = re.sub(r"(?:(?:\s|[|_~]){4,})", "\n", text)
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def chunk_document(text: str, size: int = 550, overlap: int = 90) -> list[str]:
    compact = " ".join(text.split())
    return [compact[start:start + size] for start in range(0, len(compact), size - overlap)] if compact else []


def chunk_sections(chunks: list[str]) -> list[str]:
    labels = ("education", "experience", "skills", "projects", "certifications", "achievements")
    return [next((label for label in labels if label in chunk.lower()), "document") for chunk in chunks]


def _section(lines: list[str], names: tuple[str, ...]) -> list[str]:
    start = next((index for index, line in enumerate(lines) if line.lower().strip(":") in names), None)
    if start is None:
        return []
    values = []
    for line in lines[start + 1:]:
        if line.isupper() and len(line) < 50 or line.lower().strip(":") in {"education", "experience", "skills", "projects", "certifications", "achievements"}:
            break
        values.append(line)
    return values[:12]


def extract_structured_resume(text: str) -> dict:
    lines = clean_document_text(text).splitlines()
    emails = re.findall(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", text)
    phones = re.findall(r"(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)", text)
    links = re.findall(r'https?://[^\s)>]+|(?:www\.)[^\s)>]+', text)
    skills = _section(lines, ("skills", "technical skills", "core skills"))

    experience = _section(lines, ("experience", "work experience", "professional experience"))
    internship_lines = []
    gathered_internship = []
    for index, line in enumerate(lines):
        lower = line.lower()
        if "intern" in lower or "trainee" in lower or "apprentice" in lower:
            entry = line.strip("• -")
            gathered_internship.append(entry)
            next_line = lines[index + 1].strip("• -") if index + 1 < len(lines) else ""
            if next_line and not any(token in next_line.lower() for token in ("education", "skills", "project", "certificate", "achievement")):
                gathered_internship.append(next_line)
            internship_lines.append(line)
    if internship_lines:
        experience = experience + gathered_internship if gathered_internship else internship_lines

    education = _section(lines, ("education", "academic background"))
    education_hits = []
    for line in lines:
        lower = line.lower()
        if any(token in lower for token in ("b.tech", "b.e", "m.tech", "be ", "bachelor", "bachelor's", "cgpa", "gpa", "grade")):
            education_hits.append(line)
    if education_hits:
        education = education + education_hits

    cgpa_pattern = re.search(r"(?i)(?:cgpa|gpa)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:/\s*\d+(?:\.\d+)?)?", text)
    education_value = [item.strip("• -") for item in education if item.strip("• -")]
    if cgpa_pattern:
        education_value.append(f"CGPA: {cgpa_pattern.group(1)}")

    diploma_percentage = ""
    diploma_name = ""
    degree_name = ""
    college_name = ""
    for line in lines:
        lower = line.lower()
        if "diploma" in lower and "percentage" in lower:
            pct_match = re.search(r"(\d+(?:\.\d+)?%?)", line)
            if pct_match:
                diploma_percentage = pct_match.group(1)
            diploma_name = line.split("-")[0].strip() if "-" in line else line
        if "diploma" in lower and not "percentage" in lower and not diploma_name:
            diploma_name = line.strip("• -")
        if any(token in lower for token in ("b.tech", "b.e", "bachelor", "engineering", "technology")) and "in " in lower:
            degree_name = line.strip("• -")
        if any(token in lower for token in ("pune institute", "polytechnic", "college", "university")) and "of" in lower:
            college_name = line.strip("• -")
    if not college_name:
        for line in lines:
            if line and len(line) < 100 and any(token in line.lower() for token in ("institute", "polytechnic college", "college")):
                college_name = line.strip("• -")
                break

    return {
        "name": lines[0] if lines and len(lines[0]) < 80 else "",
        "email": emails[0] if emails else "",
        "phone": phones[0].strip() if phones else "",
        "address": "",
        "education": education_value,
        "diploma_percentage": diploma_percentage,
        "diploma_name": diploma_name,
        "degree_name": degree_name,
        "college_name": college_name,
        "experience": experience,
        "skills": [skill.strip("• -") for line in skills for skill in re.split(r"[,|]", line) if skill.strip("• -")][:30],
        "projects": _section(lines, ("projects", "project experience", "selected projects")),
        "certifications": _section(lines, ("certifications", "certificates")),
        "achievements": _section(lines, ("achievements", "awards")),
        "links": links[:10],
    }
