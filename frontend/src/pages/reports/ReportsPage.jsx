import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRevenueReport, getPatientStats } from '../../api/reports'

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)
  const [enabled, setEnabled] = useState(false)
  const [queryDates, setQueryDates] = useState({ start: firstDay, end: today })

  const { data: patientStats } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: () => getPatientStats().then(r => r.data),
  })

  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ['revenue', queryDates.start, queryDates.end],
    queryFn: () => getRevenueReport({ start_date: queryDates.start, end_date: queryDates.end }).then(r => r.data),
    enabled,
  })

  function handleGenerate() {
    setQueryDates({ start: startDate, end: endDate })
    setEnabled(true)
  }

  const INPUT = { padding: '0.6rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Reportes</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Estadísticas y resumen del sistema</p>
      </div>

      <h2 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estadísticas de pacientes</h2>
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

      <h2 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reporte de ingresos</h2>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Desde:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INPUT} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151' }}>Hasta:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={INPUT} />
          </div>
          <button onClick={handleGenerate}
            style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            Generar reporte
          </button>
        </div>

        {loadingRevenue ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>
        ) : revenue ? (
          <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total facturado', value: `$${parseFloat(revenue.total_invoiced || 0).toFixed(2)}`, color: '#0a3d6b' },
              { label: 'Total cobrado', value: `$${parseFloat(revenue.total_collected || 0).toFixed(2)}`, color: '#16a34a' },
              { label: 'Pendiente de cobro', value: `$${parseFloat(revenue.total_pending || 0).toFixed(2)}`, color: '#dc2626' },
              { label: 'Número de facturas', value: revenue.invoice_count ?? 0, color: '#6b7c93' },
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
    </div>
  )
}
