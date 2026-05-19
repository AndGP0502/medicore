import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createAppointment } from '../../api/appointments'
import { getPatients } from '../../api/patients'
import toast from 'react-hot-toast'

export default function AppointmentModal({ onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    patient_id: '', doctor_id: '', scheduled_at: '', duration_minutes: '30', reason: '', notes: ''
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients', ''],
    queryFn: () => getPatients({ search: '', page: 1, size: 100 }).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Cita registrada'); onClose() },
    onError: (err) => {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail[0]?.msg || 'Error de validacion')
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Error al guardar')
      }
    },
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
    }
    if (form.reason) payload.reason = form.reason
    if (form.notes) payload.notes = form.notes
    mutation.mutate(payload)
  }

  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const patients = patientsData?.items || []

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Nueva cita</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px', fontSize: '1rem' }}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Paciente *</label>
              <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)} style={INPUT} required>
                <option value="">Seleccionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.document_number}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>ID del doctor *</label>
              <input value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)} placeholder="UUID del doctor" style={INPUT} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Fecha y hora *</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} style={INPUT} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Duracion</label>
                <select value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} style={INPUT}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Motivo</label>
              <input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Consulta general, control..." style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Notas</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Guardando...' : 'Registrar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
