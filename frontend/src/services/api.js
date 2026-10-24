import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({ baseURL })

// Instance riêng để gọi refresh token, tránh bị interceptor của api can thiệp
const refreshClient = axios.create({ baseURL })

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('homely_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
api.interceptors.response.use(
  (response) => response.data?.data,
  async (error) => {
    const originalRequest = error.config
    const apiError = error.response?.data?.error
    const status = error.response?.status

    // Xử lý Silent Refresh khi Access Token hết hạn
    if (status === 401 && apiError?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('homely_refresh_token')

      // Nếu không có refreshToken, xóa token và reject
      if (!refreshToken) {
        localStorage.removeItem('homely_access_token')
        localStorage.removeItem('homely_refresh_token')
        return Promise.reject({
          code: 'TOKEN_EXPIRED',
          message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
          status: 401,
        })
      }

      if (isRefreshing) {
        // Đang có tiến trình refresh dở -> xếp vào hàng đợi chờ token mới
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await refreshClient.post('/auth/refresh', { refreshToken })
        const authData = res.data?.data
        const newAccessToken = authData?.accessToken
        const newRefreshToken = authData?.refreshToken

        if (newAccessToken) {
          localStorage.setItem('homely_access_token', newAccessToken)
          if (newRefreshToken) {
            localStorage.setItem('homely_refresh_token', newRefreshToken)
          }

          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          processQueue(null, newAccessToken)
          return api(originalRequest)
        } else {
          throw new Error('Không nhận được token mới từ server')
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('homely_access_token')
        localStorage.removeItem('homely_refresh_token')
        window.dispatchEvent(new CustomEvent('homely:session-expired'))
        return Promise.reject({
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Phiên đăng nhập đã hết hạn hoàn toàn, vui lòng đăng nhập lại.',
          status: 401,
        })
      } finally {
        isRefreshing = false
      }
    }

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
  refresh: (refreshToken) => refreshClient.post('/auth/refresh', { refreshToken }).then((res) => res.data?.data),
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
export const paymentApi = {
  createLink: (planCode, billing) => api.post('/payments/create-link', { planCode, billing }),
  orderStatus: (orderId) => api.get(`/payments/orders/${orderId}/status`),
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
  analytics: () => api.get('/admin/analytics'),
}
