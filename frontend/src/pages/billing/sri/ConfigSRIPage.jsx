import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import toast from 'react-hot-toast'

const inp = { width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #d5dfeb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', marginTop: '0.25rem', boxSizing: 'border-box' }
const lbl = { fontSize: '0.8rem', fontWeight: '700', color: '#0a3d6b', display: 'block' }
const btn = (primary) => ({ padding: '0.6rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', border: primary ? 'none' : '1.5px solid #d5dfeb', background: primary ? 'linear-gradient(135deg, #0a3d6b, #0d5fa3)' : 'white', color: primary ? 'white' : '#0a3d6b' })

export default function ConfigSRIPage({ onClose }) {
  const queryClient = useQueryClient()
  const [subiendoCert, setSubiendoCert] = useState(false)
  const [form, setForm] = useState({
    ruc: '', razon_social: '', nombre_comercial: '', direccion_matriz: '',
    direccion_sucursal: '', codigo_establecimiento: '001', punto_emision: '001',
    ambiente: 1, tipo_emision: 1, clave_certificado: '',
  })

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-sri'],
    queryFn: () => api.get('/billing/config-sri').then(r => r.data),
  })

  useEffect(() => {
    if (config?.configured) {
      setForm(prev => ({
        ...prev,
        ruc: config.ruc || '',
        razon_social: config.razon_social || '',
        nombre_comercial: config.nombre_comercial || '',
        direccion_matriz: config.direccion_matriz || '',
        direccion_sucursal: config.direccion_sucursal || '',
        codigo_establecimiento: config.codigo_establecimiento || '001',
        punto_emision: config.punto_emision || '001',
        ambiente: config.ambiente ?? 1,
        tipo_emision: config.tipo_emision ?? 1,
        clave_certificado: '', // nunca se devuelve; vacía = mantener la actual
      }))
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/billing/config-sri', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-sri'] })
      toast.success('Configuración SRI guardada')
    },
    onError: (err) => {
      const d = err?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Error al guardar')
    },
  })

  function guardar() {
    if (!form.ruc || !form.razon_social) { toast.error('RUC y razón social son obligatorios'); return }
    const payload = { ...form }
    if (!payload.clave_certificado) delete payload.clave_certificado
    saveMutation.mutate(payload)
  }

  async function subirArchivo(e, endpoint, nombre) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendoCert(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/billing/config-sri/${endpoint}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      queryClient.invalidateQueries({ queryKey: ['config-sri'] })
      toast.success(`${nombre} subido correctamente`)
    } catch (err) {
      const d = err?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : `Error al subir ${nombre.toLowerCase()}`)
    } finally {
      setSubiendoCert(false)
      e.target.value = ''
    }
  }

  function set(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(10,61,107,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Configuración SRI — Facturación electrónica</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {isLoading ? <div style={{ padding: '2rem', color: '#6b7c93' }}>Cargando...</div> : (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={lbl}>RUC *
              <input style={inp} value={form.ruc} maxLength={13} onChange={e => set('ruc', e.target.value.replace(/\D/g, ''))} placeholder="1799999999001" />
            </label>
            <label style={lbl}>Razón social *
              <input style={inp} value={form.razon_social} onChange={e => set('razon_social', e.target.value)} />
            </label>
          </div>

          <label style={lbl}>Nombre comercial
            <input style={inp} value={form.nombre_comercial} onChange={e => set('nombre_comercial', e.target.value)} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={lbl}>Dirección matriz
              <input style={inp} value={form.direccion_matriz} onChange={e => set('direccion_matriz', e.target.value)} />
            </label>
            <label style={lbl}>Dirección sucursal
              <input style={inp} value={form.direccion_sucursal} onChange={e => set('direccion_sucursal', e.target.value)} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <label style={lbl}>Establecimiento
              <input style={inp} value={form.codigo_establecimiento} maxLength={3} onChange={e => set('codigo_establecimiento', e.target.value.replace(/\D/g, ''))} />
            </label>
            <label style={lbl}>Punto de emisión
              <input style={inp} value={form.punto_emision} maxLength={3} onChange={e => set('punto_emision', e.target.value.replace(/\D/g, ''))} />
            </label>
            <label style={lbl}>Ambiente
              <select style={inp} value={form.ambiente} onChange={e => set('ambiente', parseInt(e.target.value))}>
                <option value={1}>Pruebas</option>
                <option value={2}>Producción</option>
              </select>
            </label>
          </div>

          <div style={{ background: '#f4f8fc', border: '1.5px solid #d5dfeb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ ...lbl, marginBottom: '0.5rem' }}>
              Certificado de firma (.p12) — {config?.tiene_certificado
                ? <span style={{ color: '#16a34a' }}>cargado ✓</span>
                : <span style={{ color: '#dc2626' }}>no cargado</span>}
            </div>
            <input type="file" accept=".p12" disabled={subiendoCert} style={{ fontSize: '0.8rem' }}
              onChange={e => subirArchivo(e, 'upload-certificado', 'Certificado')} />
            <label style={{ ...lbl, marginTop: '0.75rem' }}>Clave del certificado
              <input style={inp} type="password" value={form.clave_certificado}
                onChange={e => set('clave_certificado', e.target.value)}
                placeholder={config?.configured ? '(dejar vacío para mantener la actual)' : ''} />
            </label>
          </div>

          <div style={{ background: '#f4f8fc', border: '1.5px solid #d5dfeb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ ...lbl, marginBottom: '0.5rem' }}>Logo para el RIDE (PDF) — opcional</div>
            <input type="file" accept=".png,.jpg,.jpeg" disabled={subiendoCert} style={{ fontSize: '0.8rem' }}
              onChange={e => subirArchivo(e, 'upload-logo', 'Logo')} />
          </div>

          {config?.configured && (
            <div style={{ fontSize: '0.8rem', color: '#6b7c93' }}>
              Siguiente secuencial: <b>{String(config.siguiente_secuencial).padStart(9, '0')}</b>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button style={btn(false)} onClick={onClose}>Cancelar</button>
            <button style={btn(true)} disabled={saveMutation.isPending} onClick={guardar}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
