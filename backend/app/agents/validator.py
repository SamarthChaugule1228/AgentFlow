from ..schemas import FormQuestion


def validate(question: FormQuestion) -> str:
    answer = question.answer.strip()
    if question.required and not answer:
        return "Required field is empty"
    if question.type == "email" and answer and "@" not in answer:
        return "Enter a valid email address"
    label = question.label.lower()
    short_field_keywords = ("college", "diploma", "degree", "percentage", "cgpa", "gpa", "institute", "address", "location", "phone", "email", "name")
    is_short_field = any(keyword in label for keyword in short_field_keywords)
    is_open_ended = not any(word in label for word in ("address", "location", "comment", "additional information"))
    if question.type == "long_text" and is_open_ended and not is_short_field and answer and len(answer) < 40:
        return "Answer is very short; consider adding detail"
    return "Ready"
