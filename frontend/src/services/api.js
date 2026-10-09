import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('homely_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
api.interceptors.response.use(
  (response) => response.data?.data,
  (error) => {
    const apiError = error.response?.data?.error
    return Promise.reject({
      code: apiError?.code || 'NETWORK_ERROR',
      message: apiError?.message || 'Không thể kết nối tới server',
      status: error.response?.status,
    })
  }
)
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/users/me'),
  // TASK-083: đổi mật khẩu khi đã đăng nhập — interceptor tự gắn Bearer token.
  changePassword: (payload) => api.patch('/auth/password', payload),
}
export const roomApi = {
  create: (payload) => api.post('/rooms', payload),
  list: () => api.get('/rooms'),
  get: (id) => api.get(`/rooms/${id}`),
  update: (id, payload) => api.patch(`/rooms/${id}`, payload),
  attachPhoto: (id, assetId) => api.post(`/rooms/${id}/photo`, null, { params: { assetId } }),
  savePreference: (id, payload) => api.post(`/rooms/${id}/preferences`, payload),
  getPreference: (roomId, preferenceId) => api.get(`/rooms/${roomId}/preferences/${preferenceId}`),
}

export const assetApi = {
  upload: (file, type = 'ROOM_PHOTO') => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { type },
    })
  },
  url: (assetId) => `${baseURL}/assets/${assetId}`,
  fetchObjectUrl: async (assetId) => {
    const token = localStorage.getItem('homely_access_token')
    const response = await fetch(`${baseURL}/assets/${assetId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error('Không tải được ảnh')
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },
}
export const designApi = {
  generate: (roomId, preferenceId) => api.post('/designs/generate', { roomId, preferenceId }),
  getJob: (jobId) => api.get(`/designs/jobs/${jobId}`),
  listMine: (status, page = 0, size = 10, favoriteOnly = false, sort = undefined) =>
    api.get('/designs', { params: { status, page, size, favoriteOnly, sort } }),
  duplicate: (jobId) => api.post(`/designs/jobs/${jobId}/duplicate`),
  recent: () => api.get('/designs/recent'),
  toggleFavorite: (jobId) => api.post(`/designs/jobs/${jobId}/toggle-favorite`),
  renameJob: (jobId, customName) => api.patch(`/designs/jobs/${jobId}/name`, { customName }),
  updateNote: (jobId, note) => api.patch(`/designs/jobs/${jobId}/note`, { note }),
  softDelete: (jobId) => api.delete(`/designs/jobs/${jobId}`),
  restore: (jobId) => api.post(`/designs/jobs/${jobId}/restore`),
  permanentDelete: (jobId) => api.delete(`/designs/jobs/${jobId}/permanent`),
  trash: (page = 0, size = 10) => api.get('/designs/trash', { params: { page, size } }),
}

export const studioDesignApi = {
  save: (payload) => api.post('/designs/studio/save', payload),
  get: (id) => api.get(`/designs/studio/${id}`),
  listMine: () => api.get('/designs/studio/mine'),
  delete: (id) => api.delete(`/designs/studio/${id}`),
}
export const designStudioApi = studioDesignApi

export const templateApi = {
  list: (category) => api.get('/templates', { params: category ? { category } : {} }),
  categories: () => api.get('/templates/categories'),
  get: (id) => api.get(`/templates/${id}`),
}
export const planApi = {
  list: () => api.get('/plans'),
}
export const subscriptionApi = {
  me: () => api.get('/subscriptions/me'),
}
export const usageApi = {
  me: () => api.get('/usage/me'),
}
export const shareApi = {
  enable: (jobId) => api.post(`/designs/jobs/${jobId}/share`),
  disable: (jobId) => api.delete(`/designs/jobs/${jobId}/share`),
}
export const publicShareApi = {
  get: (shareToken) => api.get(`/public/shares/${shareToken}`),
  assetUrl: (shareToken) => `${baseURL}/public/shares/${shareToken}/asset`,
  listComments: (shareToken) => api.get(`/public/shares/${shareToken}/comments`),
  addComment: (shareToken, payload) => api.post(`/public/shares/${shareToken}/comments`, payload),
}
export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}
export const userExportApi = {
  export: () => api.get('/users/me/export'),
}
export const activityApi = {
  list: () => api.get('/users/me/activity'),
}
export const achievementApi = {
  list: () => api.get('/users/me/achievements'),
}
export const insightsApi = {
  me: () => api.get('/insights/me'),
}
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (page = 0, size = 20) => api.get('/admin/users', { params: { page, size } }),
  designs: (status, page = 0, size = 20) => api.get('/admin/designs', { params: { status, page, size } }),
  systemHealth: () => api.get('/admin/system-health'),
  shares: (status) => api.get('/admin/shares', { params: status ? { status } : {} }),
  moderateShare: (shareId, status) => api.patch(`/admin/shares/${shareId}/moderate`, { status }),
  explorerUser: (email) => api.get('/admin/explorer/user', { params: { email } }),
  explorerJob: (jobId) => api.get('/admin/explorer/job', { params: { jobId } }),
  orphanChecks: () => api.get('/admin/integrity/orphans'),
}
