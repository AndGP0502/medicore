import api from './client'
export const getInvoices = (params) => api.get('/billing/invoices', { params })
export const getInvoice = (id) => api.get(`/billing/invoices/${id}`)
export const createInvoice = (data) => api.post('/billing/invoices', data)
export const deleteInvoice = (id) => api.delete(`/billing/invoices/${id}`)
export const addPayment = (data) => api.post('/billing/payments', data)
export const getConfigSRI = () => api.get('/billing/config-sri')
export const saveConfigSRI = (data) => api.post('/billing/config-sri', data)
export const emitirFactura = (id) => api.post(`/billing/invoices/${id}/emitir`)
