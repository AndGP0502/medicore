from pydantic import BaseModel
from typing import Optional
from datetime import date

class RevenueReportOut(BaseModel):
    total_invoiced: float
    total_collected: float
    total_pending: float
    invoice_count: int

class PatientStatsOut(BaseModel):
    total_patients: int
    new_this_month: int
    active_patients: int
