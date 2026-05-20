import api from './client'
export const getProducts = (params) => api.get('/inventory/products', { params })
export const createProduct = (data) => api.post('/inventory/products', data)
export const updateProduct = (id, data) => api.put(`/inventory/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/inventory/products/${id}`)
export const addLot = (data) => api.post('/inventory/lots', data)
