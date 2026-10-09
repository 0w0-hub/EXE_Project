import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { designApi } from '../services/api'

const STATUS_LABELS = {
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
}

const ROOM_ICONS = [
  { keyword: 'khach' },
  { keyword: 'ngu'},
  { keyword: 'bep'},
  { keyword: 'lam viec' },
  { keyword: 'tam'},
]

function normalize(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function iconForRoomType(roomType) {
  const normalized = normalize(roomType)

  return (
    ROOM_ICONS.find((room) => normalized.includes(room.keyword))?.icon ||
    ''
  )
}

function relativeTime(isoString) {
  const then = new Date(isoString).getTime()

  if (Number.isNaN(then)) {
    return ''
  }

  const diffMs = Date.now() - then
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'vừa xong'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} giờ trước`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays === 1) {
    return 'hôm qua'
  }

  if (diffDays < 7) {
    return `${diffDays} ngày trước`
  }

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
        if (!cancelled) {
          setJobs(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJobs([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded || jobs.length === 0) {
    return null
  }

  return (
    <section className="recent-designs dashboard-panel">
      <div className="recent-designs__header">
        <div>
          <h3 className="recent-designs__title">
            Tiếp tục thiết kế
          </h3>

          <p className="recent-designs__subtitle">
            Những thiết kế bạn vừa làm gần đây
          </p>
        </div>
      </div>

      <div className="recent-designs__grid">
        {jobs.map((job) => (
          <Link
            key={job.jobId}
            to={`/designs/${job.jobId}`}
            className="recent-design-card"
          >
            <div className="recent-design-card__top">
              <span className="recent-design-card__icon">
                {iconForRoomType(job.roomType)}
              </span>

              <span
                className={`status-badge status-${job.status}`}
              >
                {STATUS_LABELS[job.status] || job.status}
              </span>
            </div>

            <h3 className="recent-design-card__title">
              {job.roomType || 'Phòng'}
            </h3>

            <p className="recent-design-card__time">
              {relativeTime(job.updatedAt)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
