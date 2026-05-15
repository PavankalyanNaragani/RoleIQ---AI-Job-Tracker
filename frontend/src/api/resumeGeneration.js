import api from './client'

export const resumeGenerationAPI = {
  list: () => api.get('/resume-generation/'),
  create: (data) => api.post('/resume-generation/', data),
  get: (id) => api.get(`/resume-generation/${id}/`),
  approve: (id, payload) => api.post(`/resume-generation/${id}/approve/`, payload),
  regenerate: (id) => api.post(`/resume-generation/${id}/regenerate/`),
  download: (id) => api.get(`/resume-generation/${id}/download/`, { responseType: 'blob' }),
}
