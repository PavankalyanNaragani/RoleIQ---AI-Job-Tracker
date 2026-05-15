import api from './client'

export const recommendationsAPI = {
  list: (params = {}) => api.get('/ai/recommendations/', { params }),
  create: (data) => api.post('/ai/recommendations/', data),
  get: (id) => api.get(`/ai/recommendations/${id}/`),
  retry: (id) => api.post(`/ai/recommendations/${id}/retry/`),
}
