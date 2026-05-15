import api from './client'

export const analyticsAPI = {
  funnel: () => api.get('/analytics/funnel/'),
  velocity: () => api.get('/analytics/velocity/'),
  skillGaps: () => api.get('/analytics/skill-gaps/'),
  responseRate: () => api.get('/analytics/response-rate/'),
  sources: () => api.get('/analytics/sources/'),
  scoreDistribution: () => api.get('/analytics/score-distribution/'),
}
