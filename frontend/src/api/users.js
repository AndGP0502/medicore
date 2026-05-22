import api from './client'
export const getUsers = () => api.get('/users')
export const getRoles = () => api.get('/users/roles')
export const getDoctors = () => api.get('/users/doctors')
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)
export const changePassword = (data) => api.post('/users/change-password', data)
