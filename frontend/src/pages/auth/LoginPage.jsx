import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(email, password)
      setAuth(data.access_token, null)
      navigate('/')
    } catch {
      toast.error('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Nunito', 'Segoe UI', sans-serif", background: '#f0f4f8' }}>
      <div style={{ flex: '0 0 45%', background: 'linear-gradient(145deg, #0a3d6b 0%, #0d5fa3 60%, #1a7fc4 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '800', margin: '0 0 0.5rem', textAlign: 'center' }}>MediCore</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', margin: '0 0 3rem', textAlign: 'center' }}>Sistema de gestión clínica</p>
        {[{ num: '8', label: 'Módulos integrados' }, { num: '100%', label: 'Local y seguro' }, { num: '24/7', label: 'Disponibilidad' }].map((s) => (
          <div key={s.label} style={{ width: '100%', maxWidth: '280px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '1.4rem', minWidth: '60px' }}>{s.num}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: '800', color: '#0a3d6b' }}>Bienvenido</h2>
          <p style={{ margin: '0 0 2rem', color: '#6b7c93', fontSize: '0.9rem' }}>Ingresa tus credenciales para continuar</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.82rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Correo electrónico</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@clinica.com" required
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.82rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
