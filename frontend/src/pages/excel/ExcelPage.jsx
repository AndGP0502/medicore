import { useState, useRef } from 'react'
import { exportPatients, exportAppointments, exportInvoices, downloadTemplate, importPatients } from '../../api/excel'
import toast from 'react-hot-toast'

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

async function handleExport(fn, filename) {
  try {
    toast.loading('Generando Excel...')
    const res = await fn()
    downloadBlob(res.data, filename)
    toast.dismiss()
    toast.success('Archivo descargado')
  } catch {
    toast.dismiss()
    toast.error('Error al exportar')
  }
}

function ImportCard() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const res = await importPatients(file)
      setResult(res.data)
      toast.success(res.data.created + ' pacientes importados')
    } catch {
      toast.error('Error al importar')
    } finally {
      setImporting(false)
      fileRef.current.value = ''
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', borderLeft: '4px solid #0a3d6b' }}>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: '800', color: '#0a3d6b' }}>Importar pacientes</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>Carga masiva de pacientes desde un archivo Excel</p>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <div style={{ background: '#f0f7ff', borderRadius: '10px', padding: '1rem', border: '1px solid #bfdbfe', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#0a3d6b' }}>Instrucciones:</p>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.8' }}>
            <li>Descarga la plantilla con el formato correcto</li>
            <li>Llena los datos siguiendo el ejemplo incluido</li>
            <li>Sube el archivo completado</li>
          </ol>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleExport(downloadTemplate, 'plantilla_pacientes.xlsx')}
            style={{ padding: '0.65rem 1.25rem', background: '#f0f7ff', color: '#0d5fa3', border: '1.5px solid #bfdbfe', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            Descargar plantilla
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current.click()} disabled={importing}
            style={{ padding: '0.65rem 1.5rem', background: importing ? '#e2e8f0' : 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: importing ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {importing ? 'Importando...' : 'Subir archivo Excel'}
          </button>
        </div>
        {result && (
          <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e8edf2' }}>
            <p style={{ margin: '0 0 0.4rem', fontWeight: '700', fontSize: '0.875rem', color: '#16a34a' }}>
              {result.created} pacientes importados correctamente
            </p>
            {result.errors?.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.3rem', fontWeight: '700', fontSize: '0.8rem', color: '#dc2626' }}>{result.errors.length} errores:</p>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {result.errors.map((err, i) => <p key={i} style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: '#dc2626' }}>{err}</p>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExcelPage() {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Importar / Exportar</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Respaldo y carga masiva de datos en formato Excel</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', borderLeft: '4px solid #16a34a' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: '800', color: '#0a3d6b' }}>Exportar datos</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>Descarga todos los datos del sistema en formato Excel para respaldo</p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Pacientes', fn: exportPatients, filename: `pacientes_${today}.xlsx`, color: '#0a3d6b' },
              { label: 'Citas', fn: exportAppointments, filename: `citas_${today}.xlsx`, color: '#0d5fa3' },
              { label: 'Facturas', fn: exportInvoices, filename: `facturas_${today}.xlsx`, color: '#16a34a' },
            ].map(item => (
              <button key={item.label} onClick={() => handleExport(item.fn, item.filename)}
                style={{ padding: '0.65rem 1.5rem', background: 'white', color: item.color, border: `2px solid ${item.color}`, borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = item.color; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = item.color }}>
                Exportar {item.label}
              </button>
            ))}
          </div>
        </div>

        <ImportCard />
      </div>
    </div>
  )
}
