from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import get_current_user
from app.modules.ai_assistant.service import ai_service

router = APIRouter(prefix="/ai", tags=["Asistente IA"])


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""


class DiagnosisRequest(BaseModel):
    symptoms: str
    patient_context: Optional[str] = ""


class TreatmentRequest(BaseModel):
    diagnosis: str
    patient_context: Optional[str] = ""


class SummarizeRequest(BaseModel):
    records: list


class AIResponse(BaseModel):
    response: str


@router.post("/chat", response_model=AIResponse)
def chat(data: ChatRequest, _=Depends(get_current_user)):
    response = ai_service.chat(data.message, data.context)
    return {"response": response}


@router.post("/suggest-diagnosis", response_model=AIResponse)
def suggest_diagnosis(data: DiagnosisRequest, _=Depends(get_current_user)):
    response = ai_service.suggest_diagnosis(data.symptoms, data.patient_context)
    return {"response": response}


@router.post("/suggest-treatment", response_model=AIResponse)
def suggest_treatment(data: TreatmentRequest, _=Depends(get_current_user)):
    response = ai_service.suggest_treatment(data.diagnosis, data.patient_context)
    return {"response": response}


@router.post("/summarize-history", response_model=AIResponse)
def summarize_history(data: SummarizeRequest, _=Depends(get_current_user)):
    response = ai_service.summarize_history(data.records)
    return {"response": response}
