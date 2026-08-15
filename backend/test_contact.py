from app.agents.graph import run_answer_flow
from app.schemas import FormQuestion
from app.services import store

questions = [
    FormQuestion(id='1', label='Contact Number', type='short_text', required=True),
    FormQuestion(id='2', label='Student Email', type='short_text', required=True),
]

results = run_answer_flow(questions)
for result in results:
    print(f"Q: {result.label}")
    print(f"  Answer: {result.answer}")
    print(f"  Classification: {result.classification}")
    print(f"  Confidence: {result.confidence}")
    print(f"  Validation: {result.validation_status}")
    print()
