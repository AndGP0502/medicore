import api from './client'
export const getProducts = (params) => api.get('/inventory/products', { params })
export const createProduct = (data) => api.post('/inventory/products', data)
export const addLot = (data) => api.post('/inventory/lots', data)
