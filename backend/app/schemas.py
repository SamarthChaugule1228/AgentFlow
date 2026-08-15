from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class ProfileUpdate(BaseModel):
    full_name: str = ""
    email: EmailStr | None = None
    phone: str = ""
    address: str = ""
    location: str = ""
    headline: str = ""
    skills: list[str] = []
    experience: str = ""
    education: str = ""
    projects: list[str] = []
    certifications: list[str] = []
    achievements: list[str] = []
    links: list[str] = []


class FormQuestion(BaseModel):
    id: str
    label: str
    type: Literal["short_text", "email", "phone", "long_text", "multiple_choice", "checkbox"]
    required: bool = False
    options: list[str] = []
    answer: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source: str = ""
    sources: list[str] = []
    classification: Literal["personal", "contact", "education", "experience", "skills", "project", "achievement", "document_based", "open_ended", "ambiguous", "unknown"] = "unknown"
    needs_user_input: bool = False
    validation_status: Literal["pending", "passed", "failed", "needs_user_input"] = "pending"
    validation: str = "pending"


class AnalyzeFormRequest(BaseModel):
    url: str = Field(min_length=12, max_length=2048)
    questions: list[FormQuestion] = []


class GenerateAnswersRequest(BaseModel):
    form_id: str
    questions: list[FormQuestion]


class ValidateAnswersRequest(BaseModel):
    form_id: str
    questions: list[FormQuestion]


class FormExecutionRequest(BaseModel):
    status: Literal["filled", "submitted", "submission_failed"]


class DocumentRecord(BaseModel):
    id: str
    filename: str
    content_type: str
    extracted_characters: int
    created_at: datetime
