import api from './client'

export const jobDescriptionAPI = {
  list: () => api.get('/job-descriptions/'),
  create: (data) => api.post('/job-descriptions/', data),
  get: (id) => api.get(`/job-descriptions/${id}/`),
  update: (id, data) => api.patch(`/job-descriptions/${id}/`, data),
  reanalyze: (id) => api.post(`/job-descriptions/${id}/reanalyze/`),
}
