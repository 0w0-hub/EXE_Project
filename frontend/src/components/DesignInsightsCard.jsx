import { useEffect, useState } from 'react'
import { insightsApi } from '../services/api'

// TASK-099: thống kê thiết kế cá nhân ở mức TOÀN BỘ tài khoản (khác Achievements TASK-091 là huy
// hiệu mốc, khác budget breakdown TASK-026 là theo TỪNG thiết kế). Ẩn hẳn khi user chưa có thiết
// kế hoàn tất nào (totalDesigns === 0) để không hiện "0 cho mọi thứ" gây khó hiểu — xem
// tasks/active/TASK-099-design-insights.md.
export default function DesignInsightsCard() {
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    insightsApi.me().then(setInsights).catch(() => {})
  }, [])

  if (!insights || !insights.totalDesigns) {
    return null
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Thống kê thiết kế của bạn</h3>
      <div className="room-grid">
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-primary-tint)' }}>
          <p className="stat-tile-label">Tổng số thiết kế đã hoàn thành</p>
          <p className="stat-tile-value">{insights.totalDesigns}</p>
        </div>
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-accent-tint)' }}>
          <p className="stat-tile-label">Loại phòng phổ biến nhất</p>
          <p className="stat-tile-value">{insights.mostCommonRoomType ?? '—'}</p>
        </div>
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-support)' }}>
          <p className="stat-tile-label">Phong cách phổ biến nhất</p>
          <p className="stat-tile-value">{insights.mostCommonStyle ?? '—'}</p>
        </div>
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-primary-tint)' }}>
          <p className="stat-tile-label">Tổng số món nội thất</p>
          <p className="stat-tile-value">{insights.totalFurnitureItems}</p>
        </div>
        <div className="stat-tile" style={{ '--tile-bg': 'var(--color-accent-tint)' }}>
          <p className="stat-tile-label">Ngân sách trung bình</p>
          <p className="stat-tile-value">
            {insights.averageBudget != null ? `${Math.round(insights.averageBudget).toLocaleString('vi-VN')} đ` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
