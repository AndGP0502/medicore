import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/patients', label: 'Pacientes' },
  { to: '/appointments', label: 'Agenda' },
  { to: '/medical-records', label: 'Historia Clinica' },
  { to: '/billing', label: 'Facturacion' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/laboratory', label: 'Laboratorio' },
  { to: '/reports', label: 'Reportes' },
  { to: '/ai-assistant', label: 'Asistente IA' },
  { to: '/users', label: 'Usuarios' },
]

export default function DashboardLayout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Nunito', 'Segoe UI', sans-serif", background: '#f0f4f8' }}>
      <aside style={{ width: '220px', background: 'linear-gradient(180deg, #0a3d6b 0%, #0c4a80 100%)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
              <rect x="14" y="4" width="8" height="28" rx="2" fill="white"/>
              <rect x="4" y="14" width="28" height="8" rx="2" fill="white"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>MediCore</span>
        </div>
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'block', padding: '0.65rem 0.875rem', borderRadius: '10px',
                marginBottom: '2px', textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: isActive ? '700' : '500', fontSize: '0.875rem',
              })}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.65rem 0.875rem', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontFamily: 'inherit', textAlign: 'left' }}>
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
