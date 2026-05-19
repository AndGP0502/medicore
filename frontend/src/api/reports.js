import api from './client'
export const getRevenueReport = (params) => api.get('/reports/revenue', { params })
export const getPatientStats = () => api.get('/reports/patients')
