import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getPatients } from '../../api/patients'
import MedicalRecordModal from './MedicalRecordModal'
import MedicalRecordDetail from './MedicalRecordDetail'

export default function MedicalRecordsPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const { data } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => getPatients({ search, page: 1, size: 20 }).then(r => r.data),
  })

  const patients = data?.items || []

  useEffect(() => {
    const patientId = searchParams.get('patient_id')
    const patientName = searchParams.get('patient_name')
    if (patientId && patientName && !selectedPatient) {
      setSelectedPatient({ id: patientId, first_name: patientName.split(' ')[0], last_name: patientName.split(' ').slice(1).join(' '), document_number: '' })
    }
  }, [searchParams])

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {showModal && selectedPatient && <MedicalRecordModal patient={selectedPatient} onClose={() => setShowModal(false)} />}
      {selectedRecord && <MedicalRecordDetail record={selectedRecord} onClose={() => setSelectedRecord(null)} />}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Historia Clinica</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Selecciona un paciente para ver o crear su historia clinica</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f0f4f8' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              style={{ width: '100%', padding: '0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {patients.map(p => (
              <div key={p.id} onClick={() => setSelectedPatient(p)}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f4f8', background: selectedPatient?.id === p.id ? '#eff6ff' : 'transparent', borderLeft: selectedPatient?.id === p.id ? '3px solid #0d5fa3' : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{p.first_name} {p.last_name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{p.document_number}</p>
                  </div>
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Sin resultados</p>
            )}
          </div>
        </div>

        <div>
          {selectedPatient ? (
            <PatientRecords patient={selectedPatient} onNew={() => setShowModal(true)} onView={setSelectedRecord} />
          ) : (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Selecciona un paciente de la lista</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PatientRecords({ patient, onNew, onView }) {
  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', patient.id],
    queryFn: () => import('../../api/medicalRecords').then(m => m.getMedicalRecords(patient.id, { page: 1, size: 20 })).then(r => r.data),
  })

  const records = data?.items || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0a3d6b' }}>{patient.first_name} {patient.last_name}</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>{patient.document_number} ? {records.length} consultas</p>
        </div>
        <button onClick={onNew}
          style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nueva consulta
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cargando...</p>
      ) : records.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontWeight: '600' }}>Sin consultas registradas</p>
          <p style={{ fontSize: '0.8rem' }}>Crea la primera consulta con el boton de arriba</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {records.map(r => (
            <div key={r.id} onClick={() => onView(r)}
              style={{ background: 'white', borderRadius: '12px', border: '1px solid #e8edf2', padding: '1rem 1.25rem', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0d5fa3'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e8edf2'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: '700', fontSize: '0.9rem', color: '#1a202c' }}>
                    {r.chief_complaint || 'Sin motivo registrado'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>
                    {new Date(r.created_at || Date.now()).toLocaleDateString('es-EC')}
                  </p>
                </div>
                {r.diagnosis?.length > 0 && (
                  <span style={{ padding: '0.2rem 0.6rem', background: '#eff6ff', color: '#0d5fa3', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                    {r.diagnosis[0].description}
                  </span>
                )}
              </div>
              {r.treatment && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#4b5563' }}>Tratamiento: {r.treatment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
