import api from './client'
export const getMedicalRecords = (patientId, params) => api.get(`/medical-records/patient/${patientId}`, { params })
export const getMedicalRecord = (id) => api.get(`/medical-records/${id}`)
export const createMedicalRecord = (data) => api.post('/medical-records', data)
