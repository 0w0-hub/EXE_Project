import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { designApi } from '../services/api'

// TASK-100: "Recently Edited / Continue Designing" — giúp quay lại đúng thiết kế đang làm gần nhất
// thay vì phải tự lướt tìm trong lưới phòng. Chỉ hiện job PROCESSING/COMPLETED (backend đã lọc +
// sắp theo updatedAt giảm dần + giới hạn tối đa 5, xem DesignService.listRecentJobs).

const STATUS_LABELS = {
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
}

const ROOM_ICONS = [
  { keyword: 'khach', icon: '🛋️' },
  { keyword: 'ngu', icon: '🛏️' },
  { keyword: 'bep', icon: '🍳' },
  { keyword: 'lam viec', icon: '💻' },
  { keyword: 'tam', icon: '🛁' },
]

function normalize(str) {
  return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function iconForRoomType(roomType) {
  const n = normalize(roomType)
  return ROOM_ICONS.find((r) => n.includes(r.keyword))?.icon || '🏠'
}

// Thời gian tương đối tính từ updatedAt THẬT (không bịa) — không dùng thư viện ngoài vì repo
// frontend hiện chưa có date-fns/dayjs (xem package.json).
function relativeTime(isoString) {
  const then = new Date(isoString).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`

  return new Date(isoString).toLocaleDateString('vi-VN')
}

export default function RecentDesigns() {
  const [jobs, setJobs] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    designApi
      .recent()
      .then((data) => {
        if (!cancelled) setJobs(data || [])
      })
      .catch(() => {
        // Không chặn Dashboard nếu lỗi — coi như chưa có gì để hiện, section tự ẩn.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Chưa tải xong hoặc không có job PROCESSING/COMPLETED nào → ẩn hẳn, không hiện khung rỗng.
  if (!loaded || jobs.length === 0) return null

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Tiếp tục thiết kế</h3>
      <div className="room-grid">
        {jobs.map((job) => (
          <Link
            key={job.jobId}
            to={`/designs/${job.jobId}`}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.8rem' }}>{iconForRoomType(job.roomType)}</span>
              <span className={`status-badge status-${job.status}`}>{STATUS_LABELS[job.status] || job.status}</span>
            </div>
            <h3 style={{ margin: '12px 0 4px' }}>{job.roomType || 'Phòng'}</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              {relativeTime(job.updatedAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
