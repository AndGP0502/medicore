from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.core.dependencies import get_db, get_current_user
from app.modules.reports.service import reports_service
from app.modules.reports.dashboard_service import dashboard_service
from app.modules.reports.schemas import RevenueReportOut, PatientStatsOut

router = APIRouter(prefix="/reports", tags=["Reportes"])

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return dashboard_service.get_stats(db)

@router.get("/revenue", response_model=RevenueReportOut)
def revenue_report(start_date: date = Query(...), end_date: date = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return reports_service.revenue_report(db, start_date, end_date)

@router.get("/patients", response_model=PatientStatsOut)
def patient_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return reports_service.patient_stats(db)
