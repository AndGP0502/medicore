import api from './client'

export const exportPatients = () => api.get('/excel/export/patients', { responseType: 'blob' })
export const exportAppointments = () => api.get('/excel/export/appointments', { responseType: 'blob' })
export const exportInvoices = () => api.get('/excel/export/invoices', { responseType: 'blob' })
export const downloadTemplate = () => api.get('/excel/template/patients', { responseType: 'blob' })
export const importPatients = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/excel/import/patients', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
