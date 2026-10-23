import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

const PAGE_SIZE = 20

export default function AdminUsers() {
  const [page, setPage] = useState(0)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminApi
      .users(page, PAGE_SIZE)
      .then((data) => {
        setItems(data.items)
        setMeta(data.meta)
      })
      // TASK-085: giữ nguyên error object để phân biệt 403 (AccessDenied) — không đổi RBAC, chỉ đổi hiển thị.
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      <h2>Admin — Người dùng</h2>
      {error && (error.status === 403 ? <AccessDenied /> : <p className="error-text">{error.message}</p>)}
      {loading && <p>Đang tải...</p>}

      {!loading && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.fullName}</td>
                  <td><span className={`role-badge role-badge--${u.role}`}>{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
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
            Trang {meta.page + 1} / {meta.totalPages} ({meta.totalElements} người dùng)
          </span>
          <button className="secondary" disabled={page >= meta.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
