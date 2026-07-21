import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import toast from 'react-hot-toast'

const inp = { width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #d5dfeb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', marginTop: '0.25rem', boxSizing: 'border-box' }
const lbl = { fontSize: '0.8rem', fontWeight: '700', color: '#0a3d6b', display: 'block' }
const btn = (primary) => ({ padding: '0.6rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', border: primary ? 'none' : '1.5px solid #d5dfeb', background: primary ? 'linear-gradient(135deg, #0a3d6b, #0d5fa3)' : 'white', color: primary ? 'white' : '#0a3d6b' })

export default function ConfigEmailPage({ onClose }) {
  const queryClient = useQueryClient()
  const [probando, setProbando] = useState(false)
  const [form, setForm] = useState({
    host: 'smtp.gmail.com', puerto: 587, usuario: '', clave: '',
    remitente_nombre: '', usar_tls: true, envio_automatico: true,
  })

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-email'],
    queryFn: () => api.get('/billing/config-email').then(r => r.data),
  })

  useEffect(() => {
    if (config?.configured) {
      setForm(prev => ({
        ...prev,
        host: config.host || 'smtp.gmail.com',
        puerto: config.puerto || 587,
        usuario: config.usuario || '',
        remitente_nombre: config.remitente_nombre || '',
        usar_tls: config.usar_tls ?? true,
        envio_automatico: config.envio_automatico ?? true,
        clave: '', // nunca se devuelve; vacía = mantener la actual
      }))
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/billing/config-email', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-email'] })
      toast.success('Configuración de correo guardada')
    },
    onError: (err) => {
      const d = err?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Error al guardar')
    },
  })

  async function handleProbar() {
    setProbando(true)
    try {
      await api.post('/billing/config-email/probar')
      toast.success('Conexión SMTP exitosa')
    } catch (err) {
      const d = err?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Error de conexión SMTP')
    } finally {
      setProbando(false)
    }
  }

  function set(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(10,61,107,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Configuración de correo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {isLoading ? <div style={{ padding: '2rem', color: '#6b7c93' }}>Cargando...</div> : (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>
            Las facturas autorizadas se enviarán al cliente con el XML y el RIDE (PDF) adjuntos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <label style={lbl}>Servidor SMTP
              <input style={inp} value={form.host} onChange={e => set('host', e.target.value)} placeholder="smtp.gmail.com" />
            </label>
            <label style={lbl}>Puerto
              <input style={inp} type="number" value={form.puerto} onChange={e => set('puerto', parseInt(e.target.value) || 587)} />
            </label>
          </div>

          <label style={lbl}>Correo emisor (usuario SMTP)
            <input style={inp} value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="miclinica@gmail.com" />
          </label>

          <label style={lbl}>Clave SMTP
            <input style={inp} type="password" value={form.clave} onChange={e => set('clave', e.target.value)}
              placeholder={config?.configured ? '(dejar vacío para mantener la actual)' : ''} />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '400' }}>
              Con Gmail usa una "contraseña de aplicación" (myaccount.google.com/apppasswords), no tu clave normal.
            </span>
          </label>

          <label style={lbl}>Nombre del remitente
            <input style={inp} value={form.remitente_nombre} onChange={e => set('remitente_nombre', e.target.value)} placeholder="MediCore Clínica" />
          </label>

          <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '400', color: '#334155' }}>
            <input type="checkbox" checked={form.usar_tls} onChange={e => set('usar_tls', e.target.checked)} />
            STARTTLS (puerto 587) — desmarcar para SSL (465)
          </label>
          <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '400', color: '#334155' }}>
            <input type="checkbox" checked={form.envio_automatico} onChange={e => set('envio_automatico', e.target.checked)} />
            Enviar automáticamente al autorizar la factura
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button style={btn(false)} onClick={onClose}>Cerrar</button>
            <button style={btn(false)} disabled={probando} onClick={handleProbar}>
              {probando ? 'Probando...' : 'Probar conexión'}
            </button>
            <button style={btn(true)} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
