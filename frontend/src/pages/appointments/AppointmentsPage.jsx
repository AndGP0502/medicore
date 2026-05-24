import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getAppointments, deleteAppointment } from '../../api/appointments'
import AppointmentModal from './AppointmentModal'
import toast from 'react-hot-toast'

const STATUS = {
  scheduled:   { label: 'Programada', color: '#dbeafe', text: '#1d4ed8' },
  confirmed:   { label: 'Confirmada', color: '#dcfce7', text: '#16a34a' },
  in_progress: { label: 'En curso',   color: '#fef9c3', text: '#a16207' },
  completed:   { label: 'Completada', color: '#f3f4f6', text: '#374151' },
  cancelled:   { label: 'Cancelada',  color: '#fee2e2', text: '#dc2626' },
  no_show:     { label: 'No asistio', color: '#fee2e2', text: '#dc2626' },
}

export default function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editAppt, setEditAppt] = useState(null)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Cita eliminada') },
    onError: () => toast.error('Error al eliminar'),
  })

  function handleDelete(id) {
    if (window.confirm('¿Eliminar esta cita?')) deleteMutation.mutate(id)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => getAppointments({ page: 1, size: 20 }).then(r => r.data),
  })

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {(showModal || editAppt) && <AppointmentModal appointment={editAppt} onClose={() => { setShowModal(false); setEditAppt(null) }} />}

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Agenda medica</h1>
          <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Gestion de citas y turnos</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nueva cita
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[{ label: 'Total citas', value: total }, { label: 'Hoy', value: items.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length }].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0a3d6b' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Fecha y hora', 'Paciente', 'Documento', 'Duracion', 'Motivo', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', textTransform: 'uppercase', borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => {
                const st = STATUS[a.status] || {}
                return (
                  <tr key={a.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f0f4f8' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>
                      {new Date(a.scheduled_at).toLocaleString('es-EC')}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                          {a.patient?.first_name?.[0]}{a.patient?.last_name?.[0]}
                        </div>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>
                          {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'Paciente'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{a.patient?.document_number || '-'}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{a.duration_minutes} min</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{a.reason || '-'}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: st.color, color: st.text }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditAppt(a)}
                        style={{ padding: '0.35rem 0.75rem', background: '#eff6ff', color: '#0d5fa3', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No hay citas registradas</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
