from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from app.modules.billing.models import Invoice, Payment
from app.modules.patients.models import Patient

class ReportsService:
    def revenue_report(self, db: Session, start: date, end: date) -> dict:
        invoices = db.query(
            func.sum(Invoice.total).label("total_invoiced"),
            func.count(Invoice.id).label("invoice_count"),
        ).filter(
            Invoice.is_deleted == False,
            func.date(Invoice.created_at) >= start,
            func.date(Invoice.created_at) <= end,
        ).first()
        collected = db.query(func.sum(Payment.amount)).filter(
            func.date(Payment.created_at) >= start,
            func.date(Payment.created_at) <= end,
        ).scalar() or 0
        total = float(invoices.total_invoiced or 0)
        return {
            "total_invoiced": total,
            "total_collected": float(collected),
            "total_pending": total - float(collected),
            "invoice_count": invoices.invoice_count or 0,
        }

    def patient_stats(self, db: Session) -> dict:
        first_day = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        return {
            "total_patients": db.query(Patient).filter(Patient.is_deleted == False).count(),
            "new_this_month": db.query(Patient).filter(Patient.is_deleted == False, Patient.created_at >= first_day).count(),
            "active_patients": db.query(Patient).filter(Patient.is_deleted == False, Patient.is_active == True).count(),
        }

reports_service = ReportsService()
