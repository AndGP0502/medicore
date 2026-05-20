import api from './client'
export const getLabOrders = (params) => api.get('/laboratory/orders', { params })
export const createLabOrder = (data) => api.post('/laboratory/orders', data)
export const updateLabOrder = (id, data) => api.put(`/laboratory/orders/${id}`, data)
export const deleteLabOrder = (id) => api.delete(`/laboratory/orders/${id}`)
export const addLabResult = (data) => api.post('/laboratory/results', data)
