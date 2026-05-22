import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, getRoles, createUser, updateUser, deleteUser } from '../../api/users'
import toast from 'react-hot-toast'

const ROLE_COLORS = {
  admin:        { bg: '#fee2e2', text: '#dc2626' },
  doctor:       { bg: '#dbeafe', text: '#1d4ed8' },
  receptionist: { bg: '#dcfce7', text: '#16a34a' },
  cashier:      { bg: '#fef9c3', text: '#a16207' },
  lab:          { bg: '#f3e8ff', text: '#7c3aed' },
  pharmacy:     { bg: '#ffedd5', text: '#ea580c' },
}

const ROLE_LABELS = {
  admin: 'Administrador', doctor: 'Doctor', receptionist: 'Recepcionista',
  cashier: 'Cajero', lab: 'Laboratorista', pharmacy: 'Farmaceutico',
}

function UserModal({ user, roles, onClose }) {
  const queryClient = useQueryClient()
  const isEdit = !!user
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    role_id: user?.role?.id || '',
    is_active: user?.is_active ?? true,
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateUser(user.id, data) : createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado')
      onClose()
    },
    onError: (err) => {
      const d = err?.response?.data?.detail
      toast.error(typeof d === 'string' ? d : 'Error al guardar')
    },
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { full_name: form.full_name, email: form.email, role_id: form.role_id }
    if (!isEdit) payload.password = form.password
    if (isEdit) payload.is_active = form.is_active
    mutation.mutate(payload)
  }

  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px', fontSize: '1rem' }}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Nombre completo *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dr. Juan Perez" style={INPUT} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="usuario@clinica.com" style={INPUT} required />
            </div>
            {!isEdit && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Contrasena *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimo 6 caracteres" style={INPUT} required minLength={6} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Rol *</label>
              <select value={form.role_id} onChange={e => set('role_id', e.target.value)} style={INPUT} required>
                <option value="">Seleccionar rol...</option>
                {roles?.map(r => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] || r.name}</option>)}
              </select>
            </div>
            {isEdit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="is_active" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Usuario activo</label>
              </div>
            )}
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const mutation = useMutation({
    mutationFn: () => {
      const { changePassword } = require('../../api/users')
      return changePassword({ current_password: form.current_password, new_password: form.new_password })
    },
    onSuccess: () => { toast.success('Contrasena actualizada'); onClose() },
    onError: (err) => { const d = err?.response?.data?.detail; toast.error(typeof d === 'string' ? d : 'Error al actualizar') },
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (form.new_password !== form.confirm) { toast.error('Las contrasenas no coinciden'); return }
    if (form.new_password.length < 6) { toast.error('La contrasena debe tener al menos 6 caracteres'); return }
    mutation.mutate()
  }

  const INPUT = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,61,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Nunito','Segoe UI',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>Cambiar contrasena</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px' }}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Contrasena actual *</label>
              <input type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} style={INPUT} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Nueva contrasena *</label>
              <input type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)} placeholder="Minimo 6 caracteres" style={INPUT} required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Confirmar contrasena *</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} style={INPUT} required />
            </div>
          </div>
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.65rem 1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mutation.isPending ? 'Guardando...' : 'Actualizar contrasena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => getUsers().then(r => r.data) })
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => getRoles().then(r => r.data) })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario desactivado') },
    onError: () => toast.error('Error al desactivar'),
  })

  function handleDelete(user) {
    if (window.confirm(`Desactivar al usuario ${user.full_name}?`)) deleteMutation.mutate(user.id)
  }

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {showModal && <UserModal roles={roles} onClose={() => setShowModal(false)} />}
      {editUser && <UserModal user={editUser} roles={roles} onClose={() => setEditUser(null)} />}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Gestion de usuarios</h1>
          <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Administra el acceso al sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowPassword(true)}
            style={{ padding: '0.6rem 1.25rem', background: 'white', color: '#0a3d6b', border: '1.5px solid #0a3d6b', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cambiar contrasena
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Usuario', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#6b7c93', textTransform: 'uppercase', borderBottom: '1px solid #f0f4f8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users?.map((u, i) => {
                const roleColor = ROLE_COLORS[u.role?.name] || { bg: '#f3f4f6', text: '#374151' }
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f0f4f8' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.8rem', flexShrink: 0 }}>
                          {u.full_name?.[0]}
                        </div>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.875rem', color: '#1a202c' }}>{u.full_name}</p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{u.email}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: roleColor.bg, color: roleColor.text }}>
                        {ROLE_LABELS[u.role?.name] || u.role?.name || 'Sin rol'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#16a34a' : '#dc2626' }}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditUser(u)}
                        style={{ padding: '0.35rem 0.75rem', background: '#eff6ff', color: '#0d5fa3', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(u)}
                        style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Desactivar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!users?.length && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No hay usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
