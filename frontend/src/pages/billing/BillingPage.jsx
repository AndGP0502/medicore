import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoices, createInvoice, addPayment, deleteInvoice, getInvoice } from '../../api/billing'
import { getPatients } from '../../api/patients'
import toast from 'react-hot-toast'

const STATUS = {
  pending: { label: 'Pendiente', color: '#fef9c3', text: '#a16207' },
  partial: { label: 'Parcial', color: '#dbeafe', text: '#1d4ed8' },
  paid: { label: 'Pagada', color: '#dcfce7', text: '#16a34a' },
  cancelled: { label: 'Cancelada', color: '#fee2e2', text: '#dc2626' },
}

function PaymentModal({ invoice, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ amount: parseFloat(invoice.total).toFixed(2), method: 'cash', reference: '' })

  const mutation = useMutation({
    mutationFn: addPayment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Pago registrado'); onClose() },
    onError: () => toast.error('Error al registrar pago'),
  })

  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(10,61,107,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Registrar pago</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px' }}>x</button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f0f7ff', borderRadius: '10px', padding: '1rem', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7c93' }}>Factura {invoice.number}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#0a3d6b' }}>Total: ${parseFloat(invoice.total).toFixed(2)}</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Monto a pagar *</label>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={INPUT} step="0.01" min="0" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Metodo de pago *</label>
            <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} style={INPUT}>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="insurance">Seguro</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Referencia</label>
            <input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="Numero de transaccion..." style={INPUT} />
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
          <button onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => mutation.mutate({ invoice_id: invoice.id, amount: form.amount, method: form.method, reference: form.reference || undefined })}
            disabled={mutation.isPending}
            style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            {mutation.isPending ? 'Guardando...' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PrintModal({ invoice, onClose }) {
  const items = invoice.items || []
  const subtotal = parseFloat(invoice.subtotal).toFixed(2)
  const tax = parseFloat(invoice.tax).toFixed(2)
  const total = parseFloat(invoice.total).toFixed(2)

  function handlePrint() { window.print() }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(10,61,107,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '800' }}>Vista de factura</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'inherit' }}>Imprimir</button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px' }}>x</button>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: '800', color: '#0a3d6b' }}>MediCore</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>Sistema de gestion clinica</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', fontWeight: '700', color: '#1a202c' }}>FACTURA {invoice.number}</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Descripcion', 'Cant.', 'Precio', 'Total'].map(h => (
                  <th key={h} style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', borderBottom: '1px solid #e8edf2' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{item.description}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{item.quantity}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>${parseFloat(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '2px solid #e8edf2', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <span>Subtotal:</span><span>${subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#4b5563' }}>
              <span>IVA 15%:</span><span>${tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '800', color: '#0a3d6b' }}>
              <span>TOTAL:</span><span>${total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceModal({ onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ patient_id: '', notes: '' })
  const [items, setItems] = useState([{ description: '', quantity: '1', unit_price: '' }])

  const { data: patientsData } = useQuery({
    queryKey: ['patients', ''],
    queryFn: () => getPatients({ search: '', page: 1, size: 100 }).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Factura creada'); onClose() },
    onError: (err) => { const d = err?.response?.data?.detail; toast.error(Array.isArray(d) ? d[0]?.msg : (typeof d === 'string' ? d : 'Error al guardar')) },
  })

  function setItem(i, field, value) { setItems(prev => { const arr = [...prev]; arr[i][field] = value; return arr }) }
  function addItem() { setItems(prev => [...prev, { description: '', quantity: '1', unit_price: '' }]) }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      patient_id: form.patient_id,
      notes: form.notes || undefined,
      items: items.filter(i => i.description && i.unit_price).map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price }))
    }
    if (payload.items.length === 0) { toast.error('Agrega al menos un item'); return }
    mutation.mutate(payload)
  }

  const INPUT = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const patients = patientsData?.items || []
  const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.quantity || 0) * parseFloat(i.unit_price || 0)), 0)
  const total = subtotal * 1.15

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Nueva factura</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px' }}>x</button>
        </div>
        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Paciente *</label>
              <select value={form.patient_id} onChange={e => setForm(p => ({ ...p, patient_id: e.target.value }))} style={INPUT} required>
                <option value="">Seleccionar paciente...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.document_number}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Items</label>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input value={item.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Descripcion" style={INPUT} required />
                  <input type="number" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} placeholder="Cant." style={INPUT} min="1" />
                  <input type="number" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} placeholder="Precio" style={INPUT} min="0" step="0.01" />
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', padding: '0 0.75rem', fontWeight: '700' }}>x</button>}
                </div>
              ))}
              <button type="button" onClick={addItem} style={{ padding: '0.5rem 1rem', border: '1.5px dashed #e2e8f0', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#6b7c93', fontFamily: 'inherit' }}>+ Agregar item</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.3rem' }}><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.3rem' }}><span>IVA 15%:</span><span>${(subtotal * 0.15).toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: '#0a3d6b' }}><span>Total:</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Guardando...' : 'Crear factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices({ page: 1, size: 20 }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Factura eliminada') },
    onError: () => toast.error('Error al eliminar'),
  })

  function handleDelete(id) {
    if (window.confirm('Eliminar esta factura?')) deleteMutation.mutate(id)
  }

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {showModal && <InvoiceModal onClose={() => setShowModal(false)} />}
      {paymentInvoice && <PaymentModal invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} />}
      {printInvoice && <PrintModal invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Facturacion</h1>
          <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Gestion de facturas y cobros</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nueva factura
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total facturas', value: total },
          { label: 'Pendientes', value: items.filter(i => i.status === 'pending').length },
          { label: 'Pagadas', value: items.filter(i => i.status === 'paid').length },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8edf2', flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0a3d6b' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
        {isLoading ? <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Numero', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', textTransform: 'uppercase', borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((inv, i) => {
                const st = STATUS[inv.status] || {}
                return (
                  <tr key={inv.id} style={{ borderBottom: i < items.length-1 ? '1px solid #f0f4f8' : 'none' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{inv.number}</td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '700', fontSize: '0.875rem', color: '#0a3d6b' }}>${parseFloat(inv.total).toFixed(2)}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: st.color, color: st.text }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setPrintInvoice(inv)}
                        style={{ padding: '0.35rem 0.75rem', background: '#eff6ff', color: '#0d5fa3', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Ver
                      </button>
                      {inv.status !== 'paid' && (
                        <button onClick={() => setPaymentInvoice(inv)}
                          style={{ padding: '0.35rem 0.75rem', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cobrar
                        </button>
                      )}
                      <button onClick={() => handleDelete(inv.id)}
                        style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No hay facturas registradas</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
