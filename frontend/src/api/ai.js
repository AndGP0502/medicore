import api from './client'
export const chatWithAI = (data) => api.post('/ai/chat', data)
export const suggestDiagnosis = (data) => api.post('/ai/suggest-diagnosis', data)
export const suggestTreatment = (data) => api.post('/ai/suggest-treatment', data)
export const summarizeHistory = (data) => api.post('/ai/summarize-history', data)
