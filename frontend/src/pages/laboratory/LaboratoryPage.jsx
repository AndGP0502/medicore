import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLabOrders, createLabOrder, updateLabOrder, deleteLabOrder } from '../../api/laboratory'
import { getPatients } from '../../api/patients'
import { getUsers } from '../../api/users'
import toast from 'react-hot-toast'

const STATUS = {
  pending: { label: 'Pendiente', color: '#fef9c3', text: '#a16207' },
  processing: { label: 'En proceso', color: '#dbeafe', text: '#1d4ed8' },
  completed: { label: 'Completado', color: '#dcfce7', text: '#16a34a' },
  cancelled: { label: 'Cancelado', color: '#fee2e2', text: '#dc2626' },
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'En proceso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
]

function LabOrderModal({ order, onClose }) {
  const queryClient = useQueryClient()
  const isEdit = !!order
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', tests: '', notes: '', status: 'pending' })

  useEffect(() => {
    if (order) {
      setForm({
        patient_id: order.patient_id || '',
        doctor_id: order.doctor_id || '',
        tests: order.tests || '',
        notes: order.notes || '',
        status: order.status || 'pending',
      })
    }
  }, [order])

  const { data: patientsData } = useQuery({
    queryKey: ['patients', ''],
    queryFn: () => getPatients({ search: '', page: 1, size: 100 }).then(r => r.data),
  })
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: isEdit ? (data) => updateLabOrder(order.id, data) : createLabOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      toast.success(isEdit ? 'Orden actualizada' : 'Orden creada')
      onClose()
    },
    onError: (err) => { const d = err?.response?.data?.detail; toast.error(Array.isArray(d) ? d[0]?.msg : (typeof d === 'string' ? d : 'Error al guardar')) },
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }
  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const patients = patientsData?.items || []
  const users = usersData || []

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { patient_id: form.patient_id, doctor_id: form.doctor_id }
    if (form.tests) payload.tests = form.tests
    if (form.notes) payload.notes = form.notes
    if (isEdit) payload.status = form.status
    mutation.mutate(payload)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>{isEdit ? 'Editar orden' : 'Nueva orden de laboratorio'}</h2>
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
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Doctor *</label>
              <select value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)} style={INPUT} required>
                <option value="">Seleccionar doctor...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            {isEdit && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Estado</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={INPUT}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Exámenes solicitados</label>
              <textarea value={form.tests} onChange={e => set('tests', e.target.value)} rows={3} placeholder="Hemograma, glucosa, colesterol..." style={{ ...INPUT, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Notas</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear orden')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LaboratoryPage() {
  const [showModal, setShowModal] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['lab-orders'],
    queryFn: () => getLabOrders({ page: 1, size: 20 }).then(r => r.data),
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients', ''],
    queryFn: () => getPatients({ search: '', page: 1, size: 100 }).then(r => r.data),
  })

  const patientMap = {}
  patientsData?.items?.forEach(p => { patientMap[p.id] = `${p.first_name} ${p.last_name}` })

  const deleteMutation = useMutation({
    mutationFn: deleteLabOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lab-orders'] }); toast.success('Orden eliminada') },
    onError: () => toast.error('Error al eliminar'),
  })

  function handleDelete(id) {
    if (window.confirm('¿Eliminar esta orden?')) deleteMutation.mutate(id)
  }

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {(showModal || editOrder) && (
        <LabOrderModal order={editOrder} onClose={() => { setShowModal(false); setEditOrder(null) }} />
      )}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Laboratorio</h1>
          <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Órdenes y resultados de laboratorio</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nueva orden
        </button>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total órdenes', value: total },
          { label: 'Pendientes', value: items.filter(o => o.status === 'pending').length },
          { label: 'Completadas', value: items.filter(o => o.status === 'completed').length },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0a3d6b' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
        {isLoading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Fecha', 'Paciente', 'Exámenes', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', textTransform: 'uppercase', borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((o, i) => {
                const st = STATUS[o.status] || {}
                return (
                  <tr key={o.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f0f4f8' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#1a202c', fontWeight: '700' }}>
                      {new Date(o.created_at || Date.now()).toLocaleDateString('es-EC')}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
                      {patientMap[o.patient_id] || o.patient_id}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{o.tests || '-'}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: st.color, color: st.text }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditOrder(o)}
                        style={{ padding: '0.35rem 0.75rem', background: '#eff6ff', color: '#0d5fa3', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(o.id)}
                        style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No hay órdenes registradas</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
