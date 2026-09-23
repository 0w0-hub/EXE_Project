import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

const PAGE_SIZE = 20
const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang chờ', value: 'PENDING' },
  { label: 'Đang xử lý', value: 'PROCESSING' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Lỗi', value: 'FAILED' },
]

function shortId(id) {
  return id ? `${id.slice(0, 8)}…` : ''
}

export default function AdminDesigns() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminApi
      .designs(status || undefined, page, PAGE_SIZE)
      .then((data) => {
        setItems(data.items)
        setMeta(data.meta)
      })
      // TASK-085: giữ nguyên error object để phân biệt 403 (AccessDenied) — không đổi RBAC, chỉ đổi hiển thị.
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [status, page])

  return (
    <div>
      <h2>Admin — Tất cả thiết kế</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={status === tab.value ? '' : 'secondary'}
            onClick={() => { setStatus(tab.value); setPage(0) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (error.status === 403 ? <AccessDenied /> : <p className="error-text">{error.message}</p>)}
      {loading && <p>Đang tải...</p>}

      {!loading && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Owner ID</th>
                <th>Loại phòng</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((job) => (
                <tr key={job.jobId}>
                  <td style={{ fontSize: '0.8rem' }} title={job.ownerId}>{shortId(job.ownerId)}</td>
                  <td>{job.roomType}</td>
                  <td><span className={`status-badge status-${job.status}`}>{job.status}</span></td>
                  <td>{new Date(job.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
            ← Trước
          </button>
          <span style={{ alignSelf: 'center' }}>
            Trang {meta.page + 1} / {meta.totalPages} ({meta.totalElements} thiết kế)
          </span>
          <button className="secondary" disabled={page >= meta.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
