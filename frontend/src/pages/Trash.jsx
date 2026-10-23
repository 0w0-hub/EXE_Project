import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { designApi } from '../services/api'
import RequestError from '../components/RequestError'

const PAGE_SIZE = 10

export default function Trash() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyJobId, setBusyJobId] = useState(null)

  function load() {
    setLoading(true)
    setError(null)
    designApi
      .trash(page, PAGE_SIZE)
      .then((data) => {
        setItems(data.items)
        setMeta(data.meta)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  function handleRestore(jobId) {
    setBusyJobId(jobId)
    setError(null)
    designApi
      .restore(jobId)
      .then(() => setItems((prev) => prev.filter((job) => job.jobId !== jobId)))
      .catch((err) => setError(err.message))
      .finally(() => setBusyJobId(null))
  }

  function handlePermanentDelete(job) {
    const label = job.customName || job.suggestedName || job.roomType || 'thiết kế này'
    const confirmed = window.confirm(
      `Xoá VĨNH VIỄN "${label}"? Hành động này KHÔNG THỂ hoàn tác — toàn bộ dữ liệu (ảnh, nội thất, màu sắc) sẽ mất hẳn.`
    )
    if (!confirmed) return

    setBusyJobId(job.jobId)
    setError(null)
    designApi
      .permanentDelete(job.jobId)
      .then(() => setItems((prev) => prev.filter((j) => j.jobId !== job.jobId)))
      .catch((err) => setError(err.message))
      .finally(() => setBusyJobId(null))
  }

  return (
    <div>
      <h2>Thùng rác</h2>
      <p className="text-muted">
        Thiết kế đã xoá mềm nằm ở đây. Khôi phục để đưa lại vào "Dự án của tôi", hoặc xoá vĩnh viễn để
        xoá hẳn (không thể hoàn tác). Homely hiện chưa tự động dọn rác — thiết kế nằm ở đây cho tới khi
        bạn tự khôi phục hoặc xoá vĩnh viễn.
      </p>

      {error && <RequestError message={error} onRetry={load} />}
      {loading && <p>Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="card">
          <p>Thùng rác trống.</p>
          <Link to="/projects">
            <button type="button" className="secondary">
              ← Về Dự án của tôi
            </button>
          </Link>
        </div>
      )}

      <div className="room-grid">
        {items.map((job) => {
          const label = job.customName || job.suggestedName || job.roomType || 'Phòng'
          const busy = busyJobId === job.jobId
          return (
            <div className="card" key={job.jobId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className={`status-badge status-${job.status}`}>{job.status}</span>
              </div>
              <h3 style={{ margin: '12px 0 4px' }}>{label}</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                Đã xoá lúc {job.deletedAt ? new Date(job.deletedAt).toLocaleString('vi-VN') : '—'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" disabled={busy} onClick={() => handleRestore(job.jobId)}>
                  ↺ Khôi phục
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => handlePermanentDelete(job)}
                >
                  Xoá vĩnh viễn
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
            ← Trước
          </button>
          <span style={{ alignSelf: 'center' }}>
            Trang {meta.page + 1} / {meta.totalPages}
          </span>
          <button className="secondary" disabled={page >= meta.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
