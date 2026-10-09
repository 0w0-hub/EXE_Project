import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  // TASK-094: trạng thái hệ thống — widget riêng, tải song song với dashboard nghiệp vụ nhưng
  // lỗi/loading của nó không chặn phần dashboard chính hiển thị (2 API độc lập).
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState(null)

  useEffect(() => {
    // TASK-085: giữ nguyên error object (thay vì chỉ err.message) để phân biệt được lỗi 403 và hiện
    // AccessDenied — AdminRoute (App.jsx) vẫn là chốt chặn RBAC chính, đây chỉ là fallback hiển thị.
    adminApi.dashboard().then(setStats).catch((err) => setError(err))
    adminApi.systemHealth().then(setHealth).catch((err) => setHealthError(err))
  }, [])

  if (error) return error.status === 403 ? <AccessDenied /> : <p className="error-text">{error.message}</p>
  if (!stats) return <p>Đang tải...</p>

  // TASK-094: xanh nếu DB "UP" và không có job nghi bị treo, ngược lại cảnh báo — đỏ khi DB DOWN
  // (nghiêm trọng hơn), vàng khi DB vẫn UP nhưng có job bị treo.
  const isHealthy = health && health.databaseStatus === 'UP' && health.stuckJobsCount === 0
  const healthTileBg = !health
    ? 'var(--color-neutral-tint)'
    : health.databaseStatus === 'DOWN'
      ? 'var(--color-danger-tint)'
      : isHealthy
        ? 'var(--color-accent-tint)'
        : 'var(--color-warning-tint)'

  return (
    <div>
      <h2>Admin — Tổng quan</h2>
      {/* TASK-097 (coordinator): agent phát hiện /admin/users và /admin/designs vốn đã có route
          nhưng KHÔNG có điều hướng nào trong app tới 2 trang đó (chỉ vào được bằng gõ URL trực
          tiếp) — thêm luôn 1 dải link nhanh cho cả 3 trang con admin ở đây, tránh /admin/moderation
          (route mới) rơi vào đúng tình trạng tương tự. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <NavLink to="/admin/users" className="secondary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }}>
           Người dùng
        </NavLink>
        <NavLink to="/admin/designs" className="secondary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }}>
           Thiết kế
        </NavLink>
        <NavLink to="/admin/moderation" className="secondary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }}>
           Kiểm duyệt chia sẻ
        </NavLink>
        {/* TASK-104: coordinator nối dây — agent được yêu cầu không tự sửa file này để tránh xung đột,
            giữ đúng quy ước dải link nhanh cho các trang admin con đã thiết lập từ TASK-097. */}
        <NavLink to="/admin/explorer" className="secondary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }}>
           Tra cứu dữ liệu
        </NavLink>
        {/* TASK-111: coordinator nối dây — cùng lý do TASK-104. */}
        <NavLink to="/admin/integrity" className="secondary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }}>
           Kiểm tra dữ liệu
        </NavLink>
      </div>
      <div className="room-grid">
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-primary-tint)' }}>
          <p className="stat-tile-label"> Tổng người dùng</p>
          <p className="stat-tile-value">{stats.totalUsers}</p>
        </div>
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-secondary-tint)' }}>
          <p className="stat-tile-label"> Tổng phòng</p>
          <p className="stat-tile-value">{stats.totalRooms}</p>
        </div>
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-accent-tint)' }}>
          <p className="stat-tile-label"> Tổng thiết kế đã tạo</p>
          <p className="stat-tile-value">{stats.totalDesignJobs}</p>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Thiết kế theo trạng thái</h3>
      <div className="room-grid">
        {Object.entries(stats.designJobsByStatus).map(([status, count]) => (
          <div className="stat-tile" key={status}>
            <span className={`status-badge status-${status}`}>{status}</span>
            <p className="stat-tile-value" style={{ marginTop: 8 }}>{count}</p>
          </div>
        ))}
      </div>

      {/* TASK-094: Admin System Health — số liệu HỆ THỐNG đo trực tiếp lúc gọi API, khác số liệu
          nghiệp vụ ở trên. Không poll tự động (out of scope), chỉ tải khi vào trang. */}
      <h3 style={{ marginTop: 24 }}>Trạng thái hệ thống</h3>
      {healthError && (
        <p className="error-text">
          {healthError.status === 403 ? 'Không có quyền xem trạng thái hệ thống' : healthError.message}
        </p>
      )}
      {health && (
        <>
          <div className="room-grid">
            <div className="stat-tile" style={{ '--tile-bg': healthTileBg }}>
              <p className="stat-tile-label"> Cơ sở dữ liệu</p>
              <p className="stat-tile-value">{health.databaseStatus === 'UP' ? 'Hoạt động' : 'Gián đoạn'}</p>
            </div>
            <div className="stat-tile" style={{ '--tile-bg': healthTileBg }}>
              <p className="stat-tile-label">⏳ Job đang chờ/xử lý</p>
              <p className="stat-tile-value">{health.pendingJobsCount}</p>
            </div>
            <div className="stat-tile" style={{ '--tile-bg': healthTileBg }}>
              <p className="stat-tile-label"> Job lỗi 24h qua</p>
              <p className="stat-tile-value">{health.failedJobsLast24h}</p>
            </div>
            <div className="stat-tile" style={{ '--tile-bg': healthTileBg }}>
              <p className="stat-tile-label"> Job nghi bị treo</p>
              <p className="stat-tile-value">{health.stuckJobsCount}</p>
            </div>
          </div>
          <p className="stat-tile-label" style={{ marginTop: 8 }}>
            Kiểm tra lúc {new Date(health.checkedAt).toLocaleString('vi-VN')}
          </p>
        </>
      )}
    </div>
  )
}
