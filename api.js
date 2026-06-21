import apiClient from './apiClient'

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: async (data) => {
    const res = await apiClient.post('/auth/login', data)
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('refresh_token', res.data.refresh_token)
    return res
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

export const userService = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.patch('/users/me', data),
  updateApiKeys: (data) => apiClient.put('/users/me/api-keys', data),
  getApiKeysStatus: () => apiClient.get('/users/me/api-keys/status'),
}

export const projectService = {
  list: () => apiClient.get('/projects/'),
  get: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post('/projects/', data),
  update: (id, data) => apiClient.patch(`/projects/${id}`, data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
  generatePlan: (id, data) => apiClient.post(`/projects/${id}/generate-plan`, data),
}

export const trainingJobService = {
  list: () => apiClient.get('/training-jobs/'),
  get: (id) => apiClient.get(`/training-jobs/${id}`),
  create: (data) => apiClient.post('/training-jobs/', data),
  cancel: (id) => apiClient.post(`/training-jobs/${id}/cancel`),
  downloadUrl: (id) => `/api/v1/training-jobs/${id}/download`,
}

export const githubService = {
  push: (data) => apiClient.post('/github/push', data),
}

export const paymentService = {
  createStripeCheckout: (data) => apiClient.post('/payments/stripe/checkout', data),
  createPaypalOrder: (amount_usd, description) =>
    apiClient.post('/payments/paypal/create-order', null, {
      params: { amount_usd, description },
    }),
  capturePaypalOrder: (orderId) =>
    apiClient.post(`/payments/paypal/capture/${orderId}`),
}

export const contractService = {
  list: () => apiClient.get('/contracts/'),
  create: (data) => apiClient.post('/contracts/', data),
  update: (id, data) => apiClient.patch(`/contracts/${id}`, data),
  generateInvoice: (id) => apiClient.post(`/contracts/${id}/generate-invoice`),
}
