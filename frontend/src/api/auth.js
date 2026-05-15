import api from './client'

export const authAPI = {
  register:          (data)  => api.post('/auth/register/', data),
  activate:          (token) => api.get(`/auth/activate/?token=${token}`),
  resendActivation:  (email) => api.post('/auth/resend-activation/', { email }),
  login:             (data)  => api.post('/auth/login/', data),
  logout:            (refresh) => api.post('/auth/logout/', { refresh }),
  refreshToken:      (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getMe:             ()      => api.get('/auth/me/'),
  updateMe:          (data)  => api.patch('/auth/me/', data),
  forgotPassword:    (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword:     (data)  => api.post('/auth/reset-password/', data),
}