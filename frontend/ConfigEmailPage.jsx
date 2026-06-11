import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import toast from 'react-hot-toast'

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

  if (isLoading) return <div className="p-6 text-gray-500">Cargando...</div>

  return (
    <div className="max-w-xl space-y-4 p-6">
      <h2 className="text-lg font-semibold">Configuración de correo</h2>
      <p className="text-sm text-gray-500">
        Las facturas autorizadas se enviarán al cliente con el XML y el RIDE (PDF) adjuntos.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Servidor SMTP
          <input className="input w-full" value={form.host}
            onChange={e => set('host', e.target.value)} placeholder="smtp.gmail.com" />
        </label>
        <label className="text-sm">Puerto
          <input className="input w-full" type="number" value={form.puerto}
            onChange={e => set('puerto', parseInt(e.target.value) || 587)} />
        </label>
      </div>

      <label className="text-sm block">Correo emisor (usuario SMTP)
        <input className="input w-full" value={form.usuario}
          onChange={e => set('usuario', e.target.value)} placeholder="miclinica@gmail.com" />
      </label>

      <label className="text-sm block">Clave SMTP
        <input className="input w-full" type="password" value={form.clave}
          onChange={e => set('clave', e.target.value)}
          placeholder={config?.configured ? '(dejar vacío para mantener la actual)' : ''} />
        <span className="text-xs text-gray-400">
          Con Gmail debes usar una "contraseña de aplicación" (myaccount.google.com/apppasswords), no tu clave normal.
        </span>
      </label>

      <label className="text-sm block">Nombre del remitente
        <input className="input w-full" value={form.remitente_nombre}
          onChange={e => set('remitente_nombre', e.target.value)} placeholder="MediCore Clínica" />
      </label>

      <div className="flex gap-6">
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={form.usar_tls}
            onChange={e => set('usar_tls', e.target.checked)} />
          STARTTLS (puerto 587) — desmarcar para SSL (465)
        </label>
      </div>
      <label className="text-sm flex items-center gap-2">
        <input type="checkbox" checked={form.envio_automatico}
          onChange={e => set('envio_automatico', e.target.checked)} />
        Enviar automáticamente al autorizar la factura
      </label>

      <div className="flex gap-3 pt-2">
        <button className="btn btn-primary" disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate(form)}>
          {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button className="btn" disabled={probando} onClick={handleProbar}>
          {probando ? 'Probando...' : 'Probar conexión'}
        </button>
        {onClose && <button className="btn" onClick={onClose}>Cerrar</button>}
      </div>
    </div>
  )
}
