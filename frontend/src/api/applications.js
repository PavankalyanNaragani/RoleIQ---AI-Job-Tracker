import api from './client'

export const applicationsAPI = {
  list: () => api.get('/applications/'),
  create: (data) => api.post('/applications/', data),
  get: (id) => api.get(`/applications/${id}/`),
  update: (id, data) => api.patch(`/applications/${id}/`, data),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status/`, { status }),
  rescore: (id) => api.post(`/applications/${id}/rescore/`),
  updateMissingSkills: (id, missing_skills) => api.patch(`/applications/${id}/missing-skills/`, { missing_skills }),
}
