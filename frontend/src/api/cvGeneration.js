import api from './client'

export const cvGenerationAPI = {
  list: () => api.get('/cv-generation/'),
  create: (data) => api.post('/cv-generation/', data),
  get: (id) => api.get(`/cv-generation/${id}/`),
  approve: (id, payload) => api.post(`/cv-generation/${id}/approve/`, payload),
  regenerate: (id) => api.post(`/cv-generation/${id}/regenerate/`),
  download: (id) => api.get(`/cv-generation/${id}/download/`, { responseType: 'blob' }),
}
