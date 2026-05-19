export default function MedicalRecordDetail({ record, onClose }) {
  const vs = record.vital_signs || {}
  const diagnosis = record.diagnosis || []
  const prescriptions = record.prescriptions || []

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Detalle de consulta</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{record.chief_complaint || 'Sin motivo registrado'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px', fontSize: '1rem' }}>x</button>
        </div>

        <div style={{ overflow: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {record.anamnesis && (
            <Section title="Anamnesis">
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{record.anamnesis}</p>
            </Section>
          )}

          {Object.keys(vs).length > 0 && (
            <Section title="Signos vitales">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {vs.bp && <Vital label="Presion arterial" value={vs.bp} />}
                {vs.temp && <Vital label="Temperatura" value={`${vs.temp} C`} />}
                {vs.weight && <Vital label="Peso" value={`${vs.weight} kg`} />}
                {vs.height && <Vital label="Talla" value={`${vs.height} cm`} />}
                {vs.spo2 && <Vital label="Saturacion O2" value={`${vs.spo2}%`} />}
                {vs.heart_rate && <Vital label="Freq. cardiaca" value={`${vs.heart_rate} bpm`} />}
              </div>
            </Section>
          )}

          {record.physical_exam && (
            <Section title="Examen fisico">
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{record.physical_exam}</p>
            </Section>
          )}

          {diagnosis.length > 0 && (
            <Section title="Diagnosticos">
              {diagnosis.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < diagnosis.length-1 ? '1px solid #f0f4f8' : 'none' }}>
                  {d.code && <span style={{ padding: '0.2rem 0.5rem', background: '#eff6ff', color: '#0d5fa3', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{d.code}</span>}
                  <span style={{ fontSize: '0.875rem', color: '#1a202c', fontWeight: '600' }}>{d.description}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>{d.type}</span>
                </div>
              ))}
            </Section>
          )}

          {record.treatment && (
            <Section title="Tratamiento">
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{record.treatment}</p>
            </Section>
          )}

          {prescriptions.length > 0 && (
            <Section title="Recetas">
              {prescriptions.map((p, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div><p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{p.drug}</p></div>
                  <div><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>{p.dose}</p></div>
                  <div><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>{p.frequency}</p></div>
                  <div><p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>{p.days} dias</p></div>
                </div>
              ))}
            </Section>
          )}

          {record.notes && (
            <Section title="Notas">
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{record.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      {children}
    </div>
  )
}

function Vital({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', border: '1px solid #e8edf2' }}>
      <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0a3d6b' }}>{value}</p>
    </div>
  )
}
