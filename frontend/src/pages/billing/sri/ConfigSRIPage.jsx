import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfigSRI, saveConfigSRI } from '../../../api/billing'
import api from '../../../api/client'
import toast from 'react-hot-toast'

export default function ConfigSRIPage({ onClose }) {
  const queryClient = useQueryClient()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    ruc: '', razon_social: '', nombre_comercial: '', direccion_matriz: '',
    direccion_sucursal: '', codigo_establecimiento: '001', punto_emision: '001',
    ambiente: 2, tipo_emision: 1, clave_certificado: '',
    ruta_certificado: '',
  })

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-sri'],
    queryFn: () => getConfigSRI().then(r => r.data),
    onSuccess: (data) => {
      if (data.configured) {
        setForm(prev => ({
          ...prev,
          ruc: data.ruc || '',
          razon_social: data.razon_social || '',
          nombre_comercial: data.nombre_comercial || '',
          direccion_matriz: data.direccion_matriz || '',
          direccion_sucursal: data.direccion_sucursal || '',
          codigo_establecimiento: data.codigo_establecimiento || '001',
          punto_emision: data.punto_emision || '001',
          ambiente: data.ambiente || 2,
          tipo_emision: data.tipo_emision || 1,
        }))
      }
    }
  })

  const saveMutation = useMutation({
    mutationFn: saveConfigSRI,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['config-sri'] }); toast.success('Configuracion guardada') },
    onError: (err) => { const d = err?.response?.data?.detail; toast.error(typeof d === 'string' ? d : 'Error al guardar') },
  })

  async function handleUploadCertificado(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.p12')) { toast.error('Solo se permiten archivos .p12'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/billing/config-sri/upload-certificado', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(prev => ({ ...prev, ruta_certificado: res.data.path }))
      toast.success('Certificado subido correctamente')
    } catch {
      toast.error('Error al subir el certificado')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.ruc || form.ruc.length !== 13) { toast.error('El RUC debe tener 13 digitos'); return }
    if (!form.razon_social) { toast.error('La razon social es requerida'); return }
    saveMutation.mutate(form)
  }

  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '620px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Configuracion SRI</h2>
            <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Datos del emisor y certificado de firma electronica</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px' }}>x</button>
        </div>

        {/* Estado actual */}
        {config && (
          <div style={{ padding: '0.75rem 1.5rem', background: config.configured ? '#dcfce7' : '#fee2e2', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem' }}>{config.configured ? 'OK' : 'X'}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: config.configured ? '#16a34a' : '#dc2626' }}>
              {config.configured
                ? `Configurado ? ${config.ruc} | Certificado: ${config.tiene_certificado ? 'Cargado' : 'Pendiente'} | Secuencial: ${config.siguiente_secuencial}`
                : 'No configurado ? completa los datos para emitir facturas al SRI'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos del emisor</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>RUC *</label>
                <input value={form.ruc} onChange={e => set('ruc', e.target.value)} placeholder="0102030405001" style={INPUT} maxLength={13} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Nombre comercial</label>
                <input value={form.nombre_comercial} onChange={e => set('nombre_comercial', e.target.value)} placeholder="Clinica MediCore" style={INPUT} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Razon social *</label>
              <input value={form.razon_social} onChange={e => set('razon_social', e.target.value)} placeholder="PEREZ LOPEZ JUAN CARLOS" style={INPUT} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Direccion matriz *</label>
              <input value={form.direccion_matriz} onChange={e => set('direccion_matriz', e.target.value)} placeholder="Av. Principal 123, Quito" style={INPUT} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Direccion sucursal</label>
              <input value={form.direccion_sucursal} onChange={e => set('direccion_sucursal', e.target.value)} placeholder="Igual a matriz si no hay sucursal" style={INPUT} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Establecimiento</label>
                <input value={form.codigo_establecimiento} onChange={e => set('codigo_establecimiento', e.target.value)} placeholder="001" style={INPUT} maxLength={3} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Pto. Emision</label>
                <input value={form.punto_emision} onChange={e => set('punto_emision', e.target.value)} placeholder="001" style={INPUT} maxLength={3} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Ambiente</label>
                <select value={form.ambiente} onChange={e => set('ambiente', parseInt(e.target.value))} style={INPUT}>
                  <option value={1}>Pruebas</option>
                  <option value={2}>Produccion</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Tipo emision</label>
                <select value={form.tipo_emision} onChange={e => set('tipo_emision', parseInt(e.target.value))} style={INPUT}>
                  <option value={1}>Normal</option>
                </select>
              </div>
            </div>

            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certificado de firma electronica</p>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#1a202c' }}>Archivo .p12</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: form.ruta_certificado ? '#16a34a' : '#9ca3af' }}>
                    {form.ruta_certificado ? 'Certificado cargado correctamente' : 'Sin certificado cargado'}
                  </p>
                </div>
                <input ref={fileRef} type="file" accept=".p12" onChange={handleUploadCertificado} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
                  style={{ padding: '0.6rem 1rem', background: uploading ? '#e2e8f0' : 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: uploading ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {uploading ? 'Subiendo...' : 'Subir .p12'}
                </button>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Clave del certificado *</label>
                <input type="password" value={form.clave_certificado} onChange={e => set('clave_certificado', e.target.value)} placeholder="Clave del archivo .p12" style={INPUT} />
              </div>
            </div>

          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cerrar</button>
            <button type="submit" disabled={saveMutation.isPending}
              style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar configuracion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
