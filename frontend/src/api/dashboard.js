import api from './client'

export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
}
