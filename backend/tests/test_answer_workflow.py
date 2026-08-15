import unittest
from copy import deepcopy
from unittest.mock import patch

from app.agents.answer_critic import critic
from app.agents.graph import run_answer_flow
from app.schemas import FormQuestion
from app.services import store


class AnswerWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.profiles = deepcopy(store.profiles)
        self.documents = deepcopy(store.documents)
        self.forms = deepcopy(store.forms)
        store.profiles["demo-user"] = {
            "full_name": "Samarth Chaugule", "email": "samarth@example.com", "phone": "+91 9000000000",
            "address": "Pune, Maharashtra", "location": "Pune", "headline": "Software engineer",
            "skills": ["Python", "FastAPI"], "experience": "Built reliable backend automation services.",
            "education": "B.Tech in Computer Science", "projects": ["PeerPrep, a peer mentoring platform"],
            "certifications": [], "achievements": [], "links": [],
        }
        store.documents["demo-user"] = [{"id": "resume", "filename": "resume.pdf", "content": "Samarth Chaugule Education B.Tech in Computer Science PeerPrep project mentoring platform", "structured_data": {"projects": ["PeerPrep, a peer mentoring platform"], "education": ["B.Tech in Computer Science"]}}]

    def tearDown(self):
        store.profiles.clear(); store.profiles.update(self.profiles)
        store.documents.clear(); store.documents.update(self.documents)
        store.forms.clear(); store.forms.update(self.forms)

    def generated(self, label, question_type="long_text"):
        question = FormQuestion(id="q", label=label, type=question_type, required=True)
        return run_answer_flow([question])[0]

    def test_direct_profile_question(self):
        result = self.generated("Full name", "short_text")
        self.assertEqual(result.answer, "Samarth Chaugule")
        self.assertEqual(result.classification, "personal")
        self.assertEqual(result.validation_status, "passed")

    def test_education_question(self):
        result = self.generated("Education")
        self.assertEqual(result.answer, "B.Tech in Computer Science")
        self.assertEqual(result.classification, "education")

    def test_project_question(self):
        result = self.generated("Describe your most significant project")
        self.assertIn("PeerPrep", result.answer)
        self.assertEqual(result.classification, "project")

    def test_ambiguous_comments_never_returns_raw_chunk(self):
        result = self.generated("Comments")
        self.assertEqual(result.answer, "No additional information at this time.")
        self.assertNotIn("Education", result.answer)
        self.assertEqual(result.classification, "ambiguous")

    def test_self_introduction_uses_resume_and_profile_evidence(self):
        result = self.generated("Tell me about your Self ?")
        self.assertEqual(result.classification, "open_ended")
        self.assertTrue(result.answer)
        self.assertFalse(result.needs_user_input)
        self.assertGreater(result.confidence, 0)
        self.assertIn("profile", result.sources)
        self.assertIn("resume.pdf", result.sources)

    def test_specific_resume_details_override_generic_profile_fallback(self):
        store.documents["demo-user"] = [{
            "id": "resume2",
            "filename": "resume.pdf",
            "content": "Samarth Chaugule Full Stack Developer Intern (Remote) Akiyam Solutions Private Limited | Jan 2026 – May 2026 CGPA: 8.9/10 B.Tech in Computer Science",
            "structured_data": {
                "experience": ["Full Stack Developer Intern (Remote)", "Akiyam Solutions Private Limited | Jan 2026 – May 2026"],
                "education": ["CGPA: 8.9/10", "B.Tech in Computer Science"],
            },
        }]
        internship_result = self.generated("Tell me about your internships ?")
        cgpa_result = self.generated("Enter Your Current CGPA ?")

        self.assertIn("Akiyam", internship_result.answer)
        self.assertIn("Full Stack Developer Intern", internship_result.answer)
        self.assertGreater(len(internship_result.answer), 80)
        self.assertNotIn("Built web applications", internship_result.answer)
        self.assertIn("8.9", cgpa_result.answer)
        self.assertNotEqual(cgpa_result.answer, "B.Tech in Computer Science")

    def test_self_introduction_retrieves_pinecone_resume_context(self):
        pinecone_match = [{"source": "resume.pdf", "text": "PeerPrep is a peer mentoring platform built with Python.", "score": 0.91, "index": 0, "section": "projects"}]
        with patch("app.agents.retriever.search_document_chunks", return_value=pinecone_match) as search:
            result = self.generated("Tell me about yourself")
        search.assert_called_once()
        self.assertIn("resume.pdf", result.sources)
        self.assertFalse(result.needs_user_input)
        self.assertTrue(result.answer)

    def test_insufficient_evidence_requests_user_input(self):
        store.profiles["demo-user"]["achievements"] = []
        store.documents["demo-user"] = []
        result = self.generated("List an achievement")
        self.assertTrue(result.needs_user_input)
        self.assertEqual(result.validation_status, "needs_user_input")

    def test_raw_chunk_rejection(self):
        accepted, reason = critic("Built a full platform with mentoring workflows and dashboards for users.", {"classification": "project", "vector": [{"text": "Built a full platform with mentoring workflows and dashboards for users."}], "structured": []}, False)
        self.assertFalse(accepted)
        self.assertIn("copied", reason)

    def test_pdf_garbage_rejection(self):
        accepted, reason = critic("Samarth \ufffd \u25a0\u25a0 Education", {"classification": "education", "vector": [], "structured": [{"source": "profile"}]}, False)
        self.assertFalse(accepted)
        self.assertIn("garbage", reason)

    def test_diploma_percentage_and_college_extraction(self):
        store.documents["demo-user"] = [{
            "id": "resume3",
            "filename": "S24IT001_SamarthChaugule_Resume.pdf",
            "content": "Samarth Chaugule Pune Institute of Computer Technology Bachelor of Engineering in Electronics Technology CGPA: 7.11 Shivaij Polytechnic College Sangola Diploma in Computer Engineering Percentage: 84.63%",
            "structured_data": {
                "education": ["Bachelor of Engineering in Electronics Technology", "CGPA: 7.11", "Diploma in Computer Engineering", "Percentage: 84.63%"],
                "college_name": "Pune Institute of Computer Technology",
                "degree_name": "Bachelor of Engineering in Electronics Technology",
                "diploma_name": "Diploma in Computer Engineering",
                "diploma_percentage": "84.63%",
            },
        }]
        diploma_result = self.generated("Enter Your Current Diploma percentage ?")
        college_result = self.generated("Your College Name ?", "short_text")
        degree_result = self.generated("Current Degree ?", "short_text")

        self.assertIn("84.63", diploma_result.answer)
        self.assertIn("Pune Institute", college_result.answer)
        self.assertIn("Engineering", degree_result.answer)
        self.assertEqual(college_result.validation_status, "passed")


if __name__ == "__main__":
    unittest.main()
