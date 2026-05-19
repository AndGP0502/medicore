import api from './client'
export const getUsers = () => api.get('/users')
export const getDoctors = () => api.get('/users/doctors')
