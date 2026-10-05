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

// Backend bọc mọi response trong { success, data, error } — xem rules/api/error-format.md.
// Interceptor này "mở" sẵn để nơi gọi chỉ cần dùng trực tiếp payload.
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
  // Endpoint asset yêu cầu Bearer token — <img src=...> gọi thẳng URL không tự gắn header được,
  // nên fetch bằng tay (không qua interceptor JSON của `api`) rồi tạo object URL để hiển thị.
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
  // TASK-103: favoriteOnly optional, mặc định false — giữ backward-compatible với các nơi gọi cũ
  // không truyền tham số này (chỉ 2 tham số đầu status/page vẫn hoạt động như trước).
  // TASK-106: thêm `sort` optional ở CUỐI — giữ backward-compatible với các nơi gọi cũ chỉ truyền
  // 4 tham số đầu (favoriteOnly). undefined -> backend tự dùng mặc định createdAt_desc.
  listMine: (status, page = 0, size = 10, favoriteOnly = false, sort = undefined) =>
    api.get('/designs', { params: { status, page, size, favoriteOnly, sort } }),
  // TASK-093: nhân bản job COMPLETED thành job mới độc lập, không tốn lượt generate trong gói.
  duplicate: (jobId) => api.post(`/designs/jobs/${jobId}/duplicate`),
  // TASK-100: tối đa 5 job PROCESSING/COMPLETED sửa gần đây nhất (sắp theo updatedAt giảm dần) —
  // dùng cho section "Recently Edited / Continue Designing" trên Dashboard.
  recent: () => api.get('/designs/recent'),
  // TASK-103: toggle qua lại true/false trạng thái yêu thích, trả về DesignJobResponse mới nhất.
  toggleFavorite: (jobId) => api.post(`/designs/jobs/${jobId}/toggle-favorite`),
  // TASK-106: đặt/xoá tên riêng (Design Naming Assistant) — customName null/rỗng để xoá, quay về
  // tên tự sinh (suggestedName). Trả về DesignJobResponse mới nhất.
  renameJob: (jobId, customName) => api.patch(`/designs/jobs/${jobId}/name`, { customName }),
  // TASK-123: Ghi chú nhanh (Quick Notes) — note null/rỗng để xoá ghi chú. Trả về DesignJobResponse
  // mới nhất (cùng pattern renameJob).
  updateNote: (jobId, note) => api.patch(`/designs/jobs/${jobId}/note`, { note }),
  // TASK-107: Thùng rác (Trash / Soft Delete & Restore).
  softDelete: (jobId) => api.delete(`/designs/jobs/${jobId}`),
  restore: (jobId) => api.post(`/designs/jobs/${jobId}/restore`),
  // KHÔNG THỂ HOÀN TÁC — chỉ cho phép khi job đã ở trong thùng rác (backend tự chặn 400 nếu chưa),
  // FE PHẢI xác nhận rõ ràng trước khi gọi (xem Trash.jsx).
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

// TASK-078: bật/tắt chia sẻ liên kết công khai — yêu cầu đăng nhập + là chủ sở hữu job (interceptor
// tự gắn Bearer token có sẵn, không cần xử lý riêng).
export const shareApi = {
  enable: (jobId) => api.post(`/designs/jobs/${jobId}/share`),
  disable: (jobId) => api.delete(`/designs/jobs/${jobId}/share`),
}

// TASK-078: endpoint PUBLIC, không cần Authorization header — người xem không có tài khoản Homely
// vẫn gọi được bình thường (interceptor chỉ gắn header khi có token trong localStorage, không có
// thì bỏ qua, không lỗi). `assetUrl` dùng thẳng trong <img src>, khác `assetApi.fetchObjectUrl`
// (endpoint asset nội bộ yêu cầu Bearer token nên phải fetch bằng tay).
export const publicShareApi = {
  get: (shareToken) => api.get(`/public/shares/${shareToken}`),
  assetUrl: (shareToken) => `${baseURL}/public/shares/${shareToken}/asset`,
  listComments: (shareToken) => api.get(`/public/shares/${shareToken}/comments`),
  addComment: (shareToken, payload) => api.post(`/public/shares/${shareToken}/comments`, payload),
}

// TASK-082: chỉ 1 loại sự kiện — design job COMPLETED/FAILED (xem NavBar.jsx cho bell dropdown +
// polling unread-count).
export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

// TASK-087: xuất dữ liệu cá nhân (profile + room + design job) thành file JSON — interceptor tự
// gắn Bearer token có sẵn. Response đã là payload "mở" (xem interceptor phía trên).
export const userExportApi = {
  export: () => api.get('/users/me/export'),
}

// TASK-084: lịch sử hoạt động của chính user (room/design/share ghép từ createdAt thật) — interceptor
// tự gắn Bearer token có sẵn.
export const activityApi = {
  list: () => api.get('/users/me/activity'),
}

// TASK-091: huy hiệu thành tựu của chính user, tính từ dữ liệu thật (room/design job COMPLETED/
// share) mỗi lần gọi — không lưu trạng thái riêng. Interceptor tự gắn Bearer token có sẵn.
export const achievementApi = {
  list: () => api.get('/users/me/achievements'),
}

// TASK-099: thống kê thiết kế cá nhân toàn tài khoản (khác achievementApi là huy hiệu mốc, khác
// budget breakdown theo từng thiết kế) — tính lại mỗi lần gọi từ dữ liệu thật, interceptor tự
// gắn Bearer token có sẵn.
export const insightsApi = {
  me: () => api.get('/insights/me'),
}

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (page = 0, size = 20) => api.get('/admin/users', { params: { page, size } }),
  designs: (status, page = 0, size = 20) => api.get('/admin/designs', { params: { status, page, size } }),
  // TASK-094: trạng thái hệ thống (DB, job kẹt/lỗi) — chỉ tải khi vào trang/bấm làm mới, không poll.
  systemHealth: () => api.get('/admin/system-health'),
  // TASK-097: hàng đợi kiểm duyệt chia sẻ công khai — hậu kiểm, share mới vẫn công khai ngay,
  // admin chỉ ẩn/khôi phục 1 share đã có (xem tasks/completed/TASK-097-admin-moderation-queue.md).
  shares: (status) => api.get('/admin/shares', { params: status ? { status } : {} }),
  moderateShare: (shareId, status) => api.patch(`/admin/shares/${shareId}/moderate`, { status }),
  // TASK-104: Admin Data Explorer — tra cứu xuyên bảng, THUẦN READ-ONLY. Tìm chính xác theo
  // email/jobId (không search mờ), lỗi 404 khi không tìm thấy đi qua interceptor như các API khác.
  explorerUser: (email) => api.get('/admin/explorer/user', { params: { email } }),
  explorerJob: (jobId) => api.get('/admin/explorer/job', { params: { jobId } }),
  // TASK-111: "Admin Data Integrity Checker" — quét dữ liệu mồ côi (5 mối quan hệ khoá ngoại logic),
  // THUẦN READ-ONLY, tính lại mỗi lần gọi (không cache).
  orphanChecks: () => api.get('/admin/integrity/orphans'),
}
