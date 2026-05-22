import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../../api/dashboard'

const STATUS_COLORS = {
  scheduled:   { bg: '#dbeafe', text: '#1d4ed8', label: 'Programada' },
  confirmed:   { bg: '#dcfce7', text: '#16a34a', label: 'Confirmada' },
  in_progress: { bg: '#fef9c3', text: '#a16207', label: 'En curso' },
  completed:   { bg: '#f3f4f6', text: '#374151', label: 'Completada' },
  cancelled:   { bg: '#fee2e2', text: '#dc2626', label: 'Cancelada' },
  no_show:     { bg: '#fee2e2', text: '#dc2626', label: 'No asistio' },
}

function StatCard({ label, value, sub, color, accent, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1, minWidth: '160px', cursor: onClick ? 'pointer' : 'default', borderLeft: `4px solid ${accent || '#0a3d6b'}` }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = 'none' }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0 0 0.25rem', fontSize: '2rem', fontWeight: '800', color: color || '#0a3d6b' }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{sub}</p>}
    </div>
  )
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardStats().then(r => r.data),
    refetchInterval: 60000,
  })

  const today = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
        <p style={{ fontWeight: '600' }}>Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Bienvenido a MediCore</h1>
          <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem', textTransform: 'capitalize' }}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/appointments')}
            style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nueva cita
          </button>
          <button onClick={() => navigate('/patients')}
            style={{ padding: '0.6rem 1.25rem', background: 'white', color: '#0a3d6b', border: '1.5px solid #0a3d6b', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo paciente
          </button>
        </div>
      </div>

      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resumen de hoy</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard label="Citas hoy" value={data?.citas_hoy ?? 0} sub={`${data?.atendidos_hoy ?? 0} completadas`} accent="#0a3d6b" onClick={() => navigate('/appointments')} />
        <StatCard label="Ingresos hoy" value={`$${(data?.ingresos_hoy ?? 0).toFixed(2)}`} sub={`$${(data?.ingresos_mes ?? 0).toFixed(2)} este mes`} color="#16a34a" accent="#16a34a" onClick={() => navigate('/billing')} />
        <StatCard label="Facturas pendientes" value={data?.facturas_pendientes ?? 0} sub="Sin cobrar" color={data?.facturas_pendientes > 0 ? '#d97706' : '#16a34a'} accent={data?.facturas_pendientes > 0 ? '#d97706' : '#16a34a'} onClick={() => navigate('/billing')} />
        <StatCard label="Stock bajo" value={data?.productos_stock_bajo ?? 0} sub="Productos por revisar" color={data?.productos_stock_bajo > 0 ? '#dc2626' : '#16a34a'} accent={data?.productos_stock_bajo > 0 ? '#dc2626' : '#16a34a'} onClick={() => navigate('/inventory')} />
      </div>

      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pacientes</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard label="Total pacientes" value={data?.total_pacientes ?? 0} accent="#0a3d6b" onClick={() => navigate('/patients')} />
        <StatCard label="Nuevos este mes" value={data?.nuevos_mes ?? 0} color="#0d5fa3" accent="#0d5fa3" onClick={() => navigate('/patients')} />
        <StatCard label="Atendidos hoy" value={data?.atendidos_hoy ?? 0} color="#16a34a" accent="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#0a3d6b' }}>Agenda de hoy</h2>
            <button onClick={() => navigate('/appointments')} style={{ background: 'none', border: 'none', color: '#0d5fa3', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Ver todo</button>
          </div>
          {!data?.citas_hoy_lista?.length ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>Sin citas para hoy</p>
            </div>
          ) : data?.citas_hoy_lista?.map((cita, i) => {
            const st = STATUS_COLORS[cita.status] || {}
            return (
              <div key={cita.id} style={{ padding: '0.875rem 1.25rem', borderBottom: i < data.citas_hoy_lista.length - 1 ? '1px solid #f0f4f8' : 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'center', minWidth: '52px' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0a3d6b' }}>{formatTime(cita.scheduled_at)}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>{cita.duration_minutes}min</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{cita.reason || 'Consulta general'}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>ID: {cita.patient_id.slice(0, 8)}...</p>
                </div>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: st.bg, color: st.text }}>{st.label}</span>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#0a3d6b' }}>Ultimos pacientes</h2>
            <button onClick={() => navigate('/patients')} style={{ background: 'none', border: 'none', color: '#0d5fa3', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Ver todo</button>
          </div>
          {!data?.ultimos_pacientes?.length ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>Sin pacientes registrados</p>
            </div>
          ) : data?.ultimos_pacientes?.map((p, i) => (
            <div key={p.id} style={{ padding: '0.875rem 1.25rem', borderBottom: i < data.ultimos_pacientes.length - 1 ? '1px solid #f0f4f8' : 'none', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${p.gender === 'female' ? '#e91e8c, #c2185b' : '#0a3d6b, #0d5fa3'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>
                {p.first_name?.[0]}{p.last_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{p.first_name} {p.last_name}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>{p.document_number}</p>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{formatDate(p.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
