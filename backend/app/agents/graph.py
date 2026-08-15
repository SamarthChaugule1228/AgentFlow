"""Grounded answer graph: evidence is synthesized, never returned verbatim."""
import logging
from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from ..schemas import FormQuestion
from .answer_critic import critic
from .answer_generator import synthesize_answer
from .question_classifier import classify
from .retriever import evidence_combiner, structured_retriever, vector_retriever
from .validator import validate

logger = logging.getLogger("uvicorn.error")


class AnswerState(TypedDict, total=False):
    question: FormQuestion
    questions: list[FormQuestion]
    question_index: int
    supplied_form_context: dict
    form_context: dict
    classification: str
    structured_evidence: list[dict]
    vector_evidence: list[dict]
    evidence: dict
    answer: str
    confidence: float
    needs_user_input: bool
    critic_passed: bool
    critic_reason: str
    regeneration_attempts: int
    completed: FormQuestion


def form_context_analyzer(state: AnswerState) -> AnswerState:
    index = state["question_index"]
    questions = state["questions"]
    neighbors = [question.label for position, question in enumerate(questions) if position != index and abs(position - index) <= 1]
    supplied = state.get("supplied_form_context", {})
    return {"form_context": {"title": supplied.get("title", ""), "section_title": supplied.get("section_title", ""), "neighbors": neighbors}}


def question_classifier(state: AnswerState) -> AnswerState:
    return {"classification": classify(state["question"])}


def structured_retrieval(state: AnswerState) -> AnswerState:
    return {"structured_evidence": structured_retriever(state["question"], state["classification"])}


def vector_retrieval(state: AnswerState) -> AnswerState:
    return {"vector_evidence": vector_retriever(state["question"], state["classification"])}


def combine_evidence(state: AnswerState) -> AnswerState:
    return {"evidence": evidence_combiner(state["question"], state["classification"], state["form_context"], state["structured_evidence"], state["vector_evidence"])}


def answer_generator(state: AnswerState) -> AnswerState:
    draft = synthesize_answer(state["question"], state["classification"], state["evidence"], strict=state.get("regeneration_attempts", 0) > 0)
    return {"answer": draft["answer"], "confidence": max(0.0, min(1.0, draft["confidence"])), "needs_user_input": draft["needs_user_input"]}


def answer_critic(state: AnswerState) -> AnswerState:
    accepted, reason = critic(state["answer"], state["evidence"], state["needs_user_input"])
    return {"critic_passed": accepted, "critic_reason": reason}


def retry_or_validate(state: AnswerState) -> Literal["regenerate", "answer_validator"]:
    return "regenerate" if not state["critic_passed"] and state.get("regeneration_attempts", 0) == 0 else "answer_validator"


def regenerate(state: AnswerState) -> AnswerState:
    return {"regeneration_attempts": 1}


def answer_validator(state: AnswerState) -> AnswerState:
    needs_input = state["needs_user_input"] or not state["critic_passed"]
    answer = "" if needs_input else state["answer"]
    sources = state["evidence"].get("sources", [])
    drafted = state["question"].model_copy(update={
        "answer": answer,
        "classification": state["classification"],
        "confidence": state["confidence"] if not needs_input else 0.0,
        "source": ", ".join(sources),
        "sources": sources,
        "needs_user_input": needs_input,
    })
    validation = "Needs user input" if needs_input else validate(drafted)
    validation_status = "needs_user_input" if needs_input else ("passed" if validation == "Ready" else "failed")
    completed = drafted.model_copy(update={"validation": validation, "validation_status": validation_status})
    logger.info("QUESTION: %s | CLASSIFICATION: %s | RETRIEVED SOURCES: %s | GENERATED: %s | VALIDATION: %s", completed.label, completed.classification, completed.sources, completed.answer, completed.validation_status)
    return {"completed": completed}


workflow_builder = StateGraph(AnswerState)
workflow_builder.add_node("form_context_analyzer", form_context_analyzer)
workflow_builder.add_node("question_classifier", question_classifier)
workflow_builder.add_node("structured_retriever", structured_retrieval)
workflow_builder.add_node("vector_retriever", vector_retrieval)
workflow_builder.add_node("evidence_combiner", combine_evidence)
workflow_builder.add_node("answer_generator", answer_generator)
workflow_builder.add_node("answer_critic", answer_critic)
workflow_builder.add_node("regenerate", regenerate)
workflow_builder.add_node("answer_validator", answer_validator)
workflow_builder.add_edge(START, "form_context_analyzer")
workflow_builder.add_edge("form_context_analyzer", "question_classifier")
workflow_builder.add_edge("question_classifier", "structured_retriever")
workflow_builder.add_edge("structured_retriever", "vector_retriever")
workflow_builder.add_edge("vector_retriever", "evidence_combiner")
workflow_builder.add_edge("evidence_combiner", "answer_generator")
workflow_builder.add_edge("answer_generator", "answer_critic")
workflow_builder.add_conditional_edges("answer_critic", retry_or_validate)
workflow_builder.add_edge("regenerate", "answer_generator")
workflow_builder.add_edge("answer_validator", END)
answer_workflow = workflow_builder.compile()


def run_answer_flow(questions: list[FormQuestion], form_context: dict | None = None) -> list[FormQuestion]:
    context = form_context or {}
    return [answer_workflow.invoke({"question": question, "questions": questions, "question_index": index, "supplied_form_context": context, "regeneration_attempts": 0})["completed"] for index, question in enumerate(questions)]
