import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createMedicalRecord } from '../../api/medicalRecords'
import { getUsers } from '../../api/users'
import toast from 'react-hot-toast'

export default function MedicalRecordModal({ patient, onClose }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    doctor_id: '',
    chief_complaint: '',
    anamnesis: '',
    vital_signs: { bp: '', temp: '', weight: '', height: '', spo2: '', heart_rate: '' },
    physical_exam: '',
    diagnosis: [{ code: '', description: '', type: 'principal' }],
    treatment: '',
    prescriptions: [{ drug: '', dose: '', frequency: '', days: 7, notes: '' }],
    notes: '',
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', patient.id] })
      toast.success('Consulta registrada')
      onClose()
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0]?.msg : (typeof detail === 'string' ? detail : 'Error al guardar'))
    },
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }
  function setVital(field, value) { setForm(prev => ({ ...prev, vital_signs: { ...prev.vital_signs, [field]: value } })) }

  function handleSubmit(e) {
    e.preventDefault()
    const vs = {}
    Object.entries(form.vital_signs).forEach(([k, v]) => { if (v) vs[k] = v })
    const diag = form.diagnosis.filter(d => d.description)
    const presc = form.prescriptions.filter(p => p.drug)
    mutation.mutate({
      patient_id: patient.id,
      doctor_id: form.doctor_id,
      chief_complaint: form.chief_complaint || undefined,
      anamnesis: form.anamnesis || undefined,
      vital_signs: Object.keys(vs).length ? vs : undefined,
      physical_exam: form.physical_exam || undefined,
      diagnosis: diag.length ? diag : undefined,
      treatment: form.treatment || undefined,
      prescriptions: presc.length ? presc : undefined,
      notes: form.notes || undefined,
    })
  }

  const INPUT = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const users = usersData || []
  const STEPS = ['Consulta', 'Signos vitales', 'Diagnostico', 'Tratamiento']

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '620px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Nueva consulta</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{patient.first_name} {patient.last_name} ? Paso {step} de {STEPS.length} ? {STEPS[step-1]}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px', fontSize: '1rem' }}>x</button>
        </div>
        <div style={{ height: '3px', background: '#e8edf2' }}>
          <div style={{ height: '100%', background: '#0d5fa3', width: `${(step/STEPS.length)*100}%`, transition: 'width 0.3s' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '1.5rem' }}>

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Doctor *</label>
                  <select value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)} style={INPUT} required>
                    <option value="">Seleccionar doctor...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Motivo de consulta</label>
                  <input value={form.chief_complaint} onChange={e => set('chief_complaint', e.target.value)} placeholder="Dolor de cabeza, fiebre, control..." style={INPUT} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Anamnesis</label>
                  <textarea value={form.anamnesis} onChange={e => set('anamnesis', e.target.value)} rows={4} placeholder="Historia de la enfermedad actual..." style={{ ...INPUT, resize: 'vertical' }} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7c93' }}>Registra los signos vitales del paciente</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { field: 'bp', label: 'Presion arterial', placeholder: '120/80 mmHg' },
                    { field: 'temp', label: 'Temperatura', placeholder: '36.5 C' },
                    { field: 'weight', label: 'Peso', placeholder: '70 kg' },
                    { field: 'height', label: 'Talla', placeholder: '170 cm' },
                    { field: 'spo2', label: 'Saturacion O2', placeholder: '98%' },
                    { field: 'heart_rate', label: 'Frecuencia cardiaca', placeholder: '72 bpm' },
                  ].map(v => (
                    <div key={v.field}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>{v.label}</label>
                      <input value={form.vital_signs[v.field]} onChange={e => setVital(v.field, e.target.value)} placeholder={v.placeholder} style={INPUT} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Examen fisico</label>
                  <textarea value={form.physical_exam} onChange={e => set('physical_exam', e.target.value)} rows={3} placeholder="Hallazgos del examen fisico..." style={{ ...INPUT, resize: 'vertical' }} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7c93' }}>Ingresa los diagnosticos de la consulta</p>
                {form.diagnosis.map((d, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e8edf2' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>CIE-10</label>
                        <input value={d.code} onChange={e => { const arr = [...form.diagnosis]; arr[i].code = e.target.value; set('diagnosis', arr) }} placeholder="J00" style={INPUT} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Descripcion *</label>
                        <input value={d.description} onChange={e => { const arr = [...form.diagnosis]; arr[i].description = e.target.value; set('diagnosis', arr) }} placeholder="Resfriado comun" style={INPUT} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Tipo</label>
                        <select value={d.type} onChange={e => { const arr = [...form.diagnosis]; arr[i].type = e.target.value; set('diagnosis', arr) }} style={INPUT}>
                          <option value="principal">Principal</option>
                          <option value="secundario">Secundario</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('diagnosis', [...form.diagnosis, { code: '', description: '', type: 'secundario' }])}
                  style={{ padding: '0.5rem', border: '1.5px dashed #e2e8f0', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7c93', fontFamily: 'inherit' }}>
                  + Agregar diagnostico
                </button>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Plan de tratamiento</label>
                  <textarea value={form.treatment} onChange={e => set('treatment', e.target.value)} rows={3} placeholder="Reposo, hidratacion, dieta..." style={{ ...INPUT, resize: 'vertical' }} />
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Recetas</p>
                {form.prescriptions.map((p, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e8edf2' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                      {[
                        { field: 'drug', label: 'Medicamento', placeholder: 'Paracetamol' },
                        { field: 'dose', label: 'Dosis', placeholder: '500mg' },
                        { field: 'frequency', label: 'Frecuencia', placeholder: 'Cada 8h' },
                        { field: 'days', label: 'Dias', placeholder: '5' },
                      ].map(f => (
                        <div key={f.field}>
                          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.72rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>{f.label}</label>
                          <input value={p[f.field]} onChange={e => { const arr = [...form.prescriptions]; arr[i][f.field] = e.target.value; set('prescriptions', arr) }} placeholder={f.placeholder} style={INPUT} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => set('prescriptions', [...form.prescriptions, { drug: '', dose: '', frequency: '', days: 7, notes: '' }])}
                  style={{ padding: '0.5rem', border: '1.5px dashed #e2e8f0', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7c93', fontFamily: 'inherit' }}>
                  + Agregar medicamento
                </button>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Notas adicionales</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={() => step > 1 ? setStep(s => s-1) : onClose()}
              style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>
              {step > 1 ? 'Anterior' : 'Cancelar'}
            </button>
            {step < STEPS.length ? (
              <button type="button" onClick={() => setStep(s => s+1)}
                style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                Siguiente
              </button>
            ) : (
              <button type="submit" disabled={mutation.isPending}
                style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                {mutation.isPending ? 'Guardando...' : 'Guardar consulta'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
