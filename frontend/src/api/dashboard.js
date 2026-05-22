import api from './client'
export const getDashboardStats = () => api.get('/reports/dashboard')
