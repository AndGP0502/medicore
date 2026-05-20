import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatient, updatePatient } from '../../api/patients'
import toast from 'react-hot-toast'

export default function PatientModal({ patient, onClose }) {
  const queryClient = useQueryClient()
  const isEdit = !!patient
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    document_type: 'cedula', document_number: '', first_name: '', last_name: '',
    date_of_birth: '', gender: '', blood_type: '', email: '', phone: '', address: '', city: '', allergies: '', notes: '',
  })

  useEffect(() => {
    if (patient) {
      setForm({
        document_type: patient.document_type || 'cedula',
        document_number: patient.document_number || '',
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        blood_type: patient.blood_type || '',
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        city: patient.city || '',
        allergies: patient.allergies || '',
        notes: patient.notes || '',
      })
    }
  }, [patient])

  const mutation = useMutation({
    mutationFn: isEdit ? (data) => updatePatient(patient.id, data) : createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success(isEdit ? 'Paciente actualizado' : 'Paciente registrado')
      onClose()
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Error al guardar'),
  })

  function set(field, value) { setForm((prev) => ({ ...prev, [field]: value })) }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    mutation.mutate(payload)
  }

  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const totalSteps = isEdit ? 3 : 3

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Paso {step} de {totalSteps}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px', fontSize: '1rem' }}>x</button>
        </div>
        <div style={{ height: '3px', background: '#e8edf2' }}>
          <div style={{ height: '100%', background: '#0d5fa3', width: `${(step / totalSteps) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '1.5rem' }}>
            {step === 1 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Tipo doc.</label>
                    <select value={form.document_type} onChange={e => set('document_type', e.target.value)} style={INPUT}>
                      <option value="cedula">Cédula</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="ruc">RUC</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Número de documento *</label>
                    <input value={form.document_number} onChange={e => set('document_number', e.target.value)} placeholder="0102030405" style={INPUT} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Nombres *</label>
                    <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Juan" style={INPUT} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Apellidos *</label>
                    <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Pérez" style={INPUT} required />
                  </div>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Fecha de nacimiento</label>
                    <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} style={INPUT} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Género</label>
                    <select value={form.gender} onChange={e => set('gender', e.target.value)} style={INPUT}>
                      <option value="">Seleccionar...</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Tipo de sangre</label>
                  <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)} style={INPUT}>
                    <option value="">No especificado</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Alergias</label>
                  <textarea value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Penicilina, ibuprofeno..." rows={2} style={{ ...INPUT, resize: 'vertical' }} />
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Teléfono</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0991234567" style={INPUT} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Email</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="paciente@email.com" style={INPUT} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Dirección</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Av. Principal 123" style={INPUT} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Ciudad</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Quito" style={INPUT} />
                </div>
              </>
            )}
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>
              {step > 1 ? 'Anterior' : 'Cancelar'}
            </button>
            {step < totalSteps ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                Siguiente
              </button>
            ) : (
              <button type="submit" disabled={mutation.isPending}
                style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                {mutation.isPending ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Registrar paciente')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
