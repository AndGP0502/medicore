import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPatients, deletePatient } from '../../api/patients'
import { getMedicalRecords } from '../../api/medicalRecords'
import { getLabOrders } from '../../api/laboratory'
import { exportPatientPDF } from '../../utils/patientPDF'
import PatientModal from './PatientModal'
import toast from 'react-hot-toast'

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); toast.success('Paciente eliminado') },
    onError: () => toast.error('Error al eliminar'),
  })

  function handleDelete(id) {
    if (window.confirm('¿Eliminar este paciente?')) deleteMutation.mutate(id)
  }

  async function handleExportPDF(patient) {
    try {
      const [recordsRes, labRes] = await Promise.all([
        getMedicalRecords(patient.id, { page: 1, size: 100 }),
        getLabOrders({ patient_id: patient.id, page: 1, size: 100 }),
      ])
      const records = recordsRes.data?.items || []
      const labOrders = labRes.data?.items || []
      await exportPatientPDF(patient, records, labOrders)
      toast.success('PDF generado')
    } catch {
      toast.error('Error al generar PDF')
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => getPatients({ search, page: 1, size: 20 }).then((r) => r.data),
  })

  const total = data?.total || 0
  const items = data?.items || []

  return (
    <div style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      {showModal && <PatientModal onClose={() => setShowModal(false)} />}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Pacientes</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Gestion y registro de pacientes</p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[{ label: 'Total', value: total }, { label: 'Activos', value: items.length }].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0a3d6b' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', gap: '1rem' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            style={{ flex: 1, padding: '0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => setShowModal(true)}
            style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo paciente
          </button>
        </div>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Paciente', 'Documento', 'Telefono', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', textTransform: 'uppercase', borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f0f4f8' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${p.gender === 'female' ? '#e91e8c, #c2185b' : '#0a3d6b, #0d5fa3'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.8rem' }}>
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: '#1a202c' }}>{p.first_name} {p.last_name}</p>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{p.document_number}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{p.phone || '-'}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: '#dcfce7', color: '#16a34a' }}>Activo</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => navigate(`/medical-records?patient_id=${p.id}&patient_name=${p.first_name} ${p.last_name}`)}
                      style={{ padding: '0.35rem 0.75rem', background: '#eff6ff', color: '#0d5fa3', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Historia clinica
                    </button>
                    <button onClick={() => navigate(`/appointments?patient_id=${p.id}`)}
                      style={{ padding: '0.35rem 0.75rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Citas
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Eliminar
                    </button>
                    <button onClick={() => handleExportPDF(p)}
                      style={{ padding: '0.35rem 0.75rem', background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  {search ? 'Sin resultados' : 'No hay pacientes registrados'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
