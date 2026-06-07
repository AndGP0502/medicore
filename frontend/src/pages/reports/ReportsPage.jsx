import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRevenueReport, getPatientStats } from '../../api/reports'
import { exportPatients, exportAppointments, exportInvoices, downloadTemplate, importPatients } from '../../api/excel'
import toast from 'react-hot-toast'

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)
  const [fetch, setFetch] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  const { data: patientStats } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: () => getPatientStats().then(r => r.data),
  })

  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ['revenue', startDate, endDate, fetch],
    queryFn: () => getRevenueReport({ start_date: startDate, end_date: endDate }).then(r => r.data),
    enabled: fetch,
  })

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

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await importPatients(file)
      setImportResult(res.data)
      toast.success(`${res.data.created} pacientes importados`)
    } catch (err) {
      toast.error('Error al importar')
    } finally {
      setImporting(false)
      fileRef.current.value = ''
    }
  }

  const INPUT = { padding: '0.6rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Reportes</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Estadisticas, respaldos y exportaciones</p>
      </div>

      {/* Estadisticas pacientes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estadisticas de pacientes</p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total pacientes', value: patientStats?.total_patients ?? '-', color: '#0a3d6b' },
          { label: 'Nuevos este mes', value: patientStats?.new_this_month ?? '-', color: '#0d5fa3' },
          { label: 'Pacientes activos', value: patientStats?.active_patients ?? '-', color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1, minWidth: '160px' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Reporte ingresos */}
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reporte de ingresos</p>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Desde:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INPUT} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Hasta:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={INPUT} />
          </div>
          <button onClick={() => setFetch(f => !f)}
            style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            Generar reporte
          </button>
        </div>
        {loadingRevenue ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>
        ) : revenue ? (
          <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total facturado', value: `$${revenue.total_invoiced.toFixed(2)}`, color: '#0a3d6b' },
              { label: 'Total cobrado', value: `$${revenue.total_collected.toFixed(2)}`, color: '#16a34a' },
              { label: 'Pendiente de cobro', value: `$${revenue.total_pending.toFixed(2)}`, color: '#dc2626' },
              { label: 'Numero de facturas', value: revenue.invoice_count, color: '#6b7c93' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1, minWidth: '160px' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            Selecciona un rango de fechas y genera el reporte
          </div>
        )}
      </div>

      {/* Exportar Excel */}
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exportar datos a Excel</p>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7c93' }}>Descarga todos los datos del sistema en formato Excel para respaldo o analisis.</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Exportar pacientes', fn: () => handleExport(exportPatients, `pacientes_${today}.xlsx`), color: '#0a3d6b' },
            { label: 'Exportar citas', fn: () => handleExport(exportAppointments, `citas_${today}.xlsx`), color: '#0d5fa3' },
            { label: 'Exportar facturas', fn: () => handleExport(exportInvoices, `facturas_${today}.xlsx`), color: '#16a34a' },
          ].map(item => (
            <button key={item.label} onClick={item.fn}
              style={{ padding: '0.75rem 1.5rem', background: 'white', color: item.color, border: `2px solid ${item.color}`, borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = item.color; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = item.color }}>
              Exportar {item.label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Importar Excel */}
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Importar pacientes desde Excel</p>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', padding: '1.25rem' }}>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7c93' }}>
          Sube un archivo Excel con pacientes para importarlos masivamente. Descarga la plantilla para ver el formato correcto.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button onClick={() => handleExport(downloadTemplate, 'plantilla_pacientes.xlsx')}
            style={{ padding: '0.75rem 1.25rem', background: '#f0f7ff', color: '#0d5fa3', border: '1.5px solid #bfdbfe', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            Descargar plantilla
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current.click()} disabled={importing}
              style={{ padding: '0.75rem 1.5rem', background: importing ? '#e2e8f0' : 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: importing ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {importing ? 'Importando...' : 'Seleccionar archivo Excel'}
            </button>
          </div>
        </div>

        {importResult && (
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e8edf2' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: '700', fontSize: '0.875rem', color: '#16a34a' }}>
              {importResult.created} pacientes importados correctamente
            </p>
            {importResult.errors?.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.4rem', fontWeight: '700', fontSize: '0.8rem', color: '#dc2626' }}>
                  {importResult.errors.length} errores:
                </p>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {importResult.errors.map((err, i) => (
                    <p key={i} style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', color: '#dc2626' }}>{err}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
