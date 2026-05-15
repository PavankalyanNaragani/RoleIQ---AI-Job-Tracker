import api from './client'

export const aiWorkflowAPI = {
  runPipeline: (jdId, resumeId) => api.post(`/ai/pipeline/${jdId}/run/`, { resume_id: resumeId }),
  getStatus: (jdId) => api.get(`/ai/pipeline/${jdId}/status/`),
}
