from ..schemas import FormQuestion
import re


def classify(question: FormQuestion) -> str:
    label = re.sub(r"\s+", " ", question.label.lower()).strip()
    compact_label = re.sub(r"[^a-z0-9]", "", label)
    if any(term in label for term in ("email", "phone", "mobile", "address", "location", "city", "linkedin", "github", "website", "contact number", "telephone")):
        return "contact"
    if any(term in label for term in ("education", "degree", "university", "college", "school", "cgpa", "gpa", "diploma", "percentage")):
        return "education"
    if any(term in label for term in ("experience", "employer", "internship", "role", "position", "work history")):
        return "experience"
    if any(term in label for term in ("skill", "technology", "language", "framework", "tool")):
        return "skills"
    if any(term in label for term in ("project", "portfolio", "built", "developed")):
        return "project"
    if any(term in label for term in ("achievement", "award", "certificate", "certification")):
        return "achievement"
    if any(term in label for term in ("resume", "cv", "document", "upload")):
        return "document_based"
    if any(term in compact_label for term in ("tellmeaboutyourself", "introduceyourself", "describeyourbackground", "aboutyourself")) or any(term in label for term in ("background", "why", "describe", "tell us", "cover", "motivation", "contribution")):
        return "open_ended"
    if any(term in label for term in ("comment", "additional", "anything else", "other information")):
        return "ambiguous"
    if any(term in label for term in ("name", "date of birth", "gender")):
        return "personal"
    return "unknown"
