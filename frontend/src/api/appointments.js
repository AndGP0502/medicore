import api from './client'
export const getAppointments = (params) => api.get('/appointments', { params })
export const createAppointment = (data) => api.post('/appointments', data)
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data)
