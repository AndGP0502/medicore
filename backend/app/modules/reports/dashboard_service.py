from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.modules.patients.models import Patient
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.billing.models import Invoice, Payment
from app.modules.inventory.models import Product, Lot


class DashboardService:
    def get_stats(self, db: Session) -> dict:
        today = date.today()
        now = datetime.utcnow()
        first_day_month = now.replace(day=1, hour=0, minute=0, second=0)

        # Citas de hoy
        citas_hoy = db.query(Appointment).filter(
            func.date(Appointment.scheduled_at) == today,
            Appointment.is_deleted == False
        ).count()

        # Pacientes atendidos hoy
        atendidos_hoy = db.query(Appointment).filter(
            func.date(Appointment.scheduled_at) == today,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.is_deleted == False
        ).count()

        # Ingresos del dia
        ingresos_hoy = db.query(func.sum(Payment.amount)).filter(
            func.date(Payment.created_at) == today
        ).scalar() or 0

        # Ingresos del mes
        ingresos_mes = db.query(func.sum(Payment.amount)).filter(
            Payment.created_at >= first_day_month
        ).scalar() or 0

        # Total pacientes
        total_pacientes = db.query(Patient).filter(Patient.is_deleted == False).count()

        # Nuevos pacientes este mes
        nuevos_mes = db.query(Patient).filter(
            Patient.is_deleted == False,
            Patient.created_at >= first_day_month
        ).count()

        # Facturas pendientes
        facturas_pendientes = db.query(Invoice).filter(
            Invoice.status == 'pending',
            Invoice.is_deleted == False
        ).count()

        # Productos con stock bajo
        productos_stock_bajo = db.query(Product).filter(
            Product.is_deleted == False,
            Product.is_active == True,
            Product.min_stock > 0
        ).count()

        # Ultimas citas de hoy
        citas_lista = db.query(Appointment).filter(
            func.date(Appointment.scheduled_at) == today,
            Appointment.is_deleted == False
        ).order_by(Appointment.scheduled_at).limit(10).all()

        citas_data = []
        for c in citas_lista:
            citas_data.append({
                "id": str(c.id),
                "patient_id": str(c.patient_id),
                "scheduled_at": c.scheduled_at.isoformat(),
                "status": c.status.value,
                "reason": c.reason or "",
                "duration_minutes": c.duration_minutes,
            })

        # Ultimos pacientes registrados
        ultimos_pacientes = db.query(Patient).filter(
            Patient.is_deleted == False
        ).order_by(Patient.created_at.desc()).limit(5).all()

        pacientes_data = []
        for p in ultimos_pacientes:
            pacientes_data.append({
                "id": str(p.id),
                "first_name": p.first_name,
                "last_name": p.last_name,
                "document_number": p.document_number,
                "gender": p.gender.value,
                "created_at": p.created_at.isoformat(),
            })

        return {
            "citas_hoy": citas_hoy,
            "atendidos_hoy": atendidos_hoy,
            "ingresos_hoy": float(ingresos_hoy),
            "ingresos_mes": float(ingresos_mes),
            "total_pacientes": total_pacientes,
            "nuevos_mes": nuevos_mes,
            "facturas_pendientes": facturas_pendientes,
            "productos_stock_bajo": productos_stock_bajo,
            "citas_hoy_lista": citas_data,
            "ultimos_pacientes": pacientes_data,
        }


dashboard_service = DashboardService()
