import api from './client'

export const resumeAPI = {
  upload:    (formData) => api.post('/resumes/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list:      ()   => api.get('/resumes/'),
  get:       (id) => api.get(`/resumes/${id}/`),
  activate:  (id) => api.patch(`/resumes/${id}/activate/`),
  delete:    (id) => api.delete(`/resumes/${id}/delete/`),
  reanalyze: (id) => api.post(`/resumes/${id}/reanalyze/`),
}