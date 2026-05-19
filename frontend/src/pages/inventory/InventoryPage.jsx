import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct } from '../../api/inventory'
import toast from 'react-hot-toast'

function ProductModal({ onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', generic_name: '', sku: '', category: '', unit: 'unidad', min_stock: 0 })
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Producto registrado'); onClose() },
    onError: (err) => { const d = err?.response?.data?.detail; toast.error(Array.isArray(d) ? d[0]?.msg : (typeof d === 'string' ? d : 'Error al guardar')) },
  })
  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }
  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Nuevo producto</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px', fontSize: '1rem' }}>x</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, min_stock: parseInt(form.min_stock) }) }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Nombre *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Paracetamol 500mg" style={INPUT} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Nombre generico</label>
                <input value={form.generic_name} onChange={e => set('generic_name', e.target.value)} placeholder="Acetaminofen" style={INPUT} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>SKU</label>
                <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="PAR-500" style={INPUT} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Categoria</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={INPUT}>
                  <option value="">Seleccionar...</option>
                  <option value="medicamento">Medicamento</option>
                  <option value="insumo">Insumo</option>
                  <option value="equipo">Equipo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Unidad</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)} style={INPUT}>
                  <option value="unidad">Unidad</option>
                  <option value="caja">Caja</option>
                  <option value="frasco">Frasco</option>
                  <option value="ampolla">Ampolla</option>
                  <option value="sobre">Sobre</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Stock min.</label>
                <input type="number" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} style={INPUT} min="0" />
              </div>
            </div>
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Guardando...' : 'Registrar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => getProducts({ search, page: 1, size: 20 }).then(r => r.data),
  })
  const items = data?.items || []
  const total = data?.total || 0
  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {showModal && <ProductModal onClose={() => setShowModal(false)} />}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Inventario</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Gestion de productos y farmacia</p>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[{ label: 'Total productos', value: total }, { label: 'En esta pagina', value: items.length }].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0a3d6b' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', gap: '1rem' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
            style={{ flex: 1, padding: '0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={() => setShowModal(true)}
            style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo producto
          </button>
        </div>
        {isLoading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Producto', 'Nombre generico', 'Categoria', 'Unidad', 'Stock minimo'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', textTransform: 'uppercase', borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < items.length-1 ? '1px solid #f0f4f8' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{p.name}</p>
                    {p.sku && <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>SKU: {p.sku}</p>}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{p.generic_name || '-'}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{p.category || '-'}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{p.unit}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{p.min_stock}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No hay productos registrados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
