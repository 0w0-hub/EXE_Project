import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

// TASK-111: "Admin Data Integrity Checker" — quét dữ liệu mồ côi (bản ghi tham chiếu tới id không
// còn tồn tại, tích luỹ qua nhiều migration V1->V10). THUẦN READ-ONLY — trang này không có nút
// sửa/xoá nào, chỉ hiển thị báo cáo thật để coordinator/user tự quyết định xử lý nếu có orphan.
// Khác "Admin Data Explorer" (TASK-104, tra cứu 1 entity cụ thể) — đây là quét toàn bộ tìm lỗi.

function shortId(id) {
  return id ? `${id.slice(0, 8)}…` : '—'
}

function CheckCard({ check }) {
  const hasOrphans = check.totalOrphanCount > 0
  const hiddenCount = check.totalOrphanCount - check.orphanIds.length

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${hasOrphans ? 'var(--color-danger)' : 'var(--color-accent)'}`,
      }}
    >
      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.1rem' }}>{hasOrphans ? '' : ''}</span>
        <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{check.checkName}</strong>
      </p>
      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 8px' }}>
        Bảng: {check.table}
      </p>
      <p style={{ margin: 0, fontWeight: 600, color: hasOrphans ? 'var(--color-danger)' : 'var(--color-accent)' }}>
        {hasOrphans ? `${check.totalOrphanCount} bản ghi mồ côi` : 'Không có bản ghi mồ côi'}
      </p>

      {hasOrphans && (
        <div style={{ marginTop: 10 }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {check.orphanIds.map((id) => (
              <li
                key={id}
                title={id}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  background: 'var(--color-danger-tint)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {shortId(id)}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
              và {hiddenCount} id khác (chỉ hiện tối đa {check.orphanIds.length} đầu tiên)
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminDataIntegrity() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    adminApi
      .orphanChecks()
      .then(setResult)
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  // AdminRoute (App.jsx) đã chặn trước — vẫn xử lý fallback đúng pattern các trang admin khác
  // (AdminDashboard/AdminDataExplorer) phòng khi quyền bị thu hồi giữa phiên.
  if (error?.status === 403) {
    return <AccessDenied />
  }

  return (
    <div>
      <h2>Admin — Kiểm tra dữ liệu mồ côi</h2>
      <p className="text-muted">
        Quét 5 mối quan hệ khoá ngoại logic trong dữ liệu (room/preference của thiết kế, job của kết
        quả, kết quả của nội thất, job của liên kết chia sẻ) để tìm bản ghi tham chiếu tới id không
        còn tồn tại. Tính lại mỗi lần bấm "Làm mới" — không cache. Trang này chỉ đọc dữ liệu, không
        sửa/xoá gì ở đây.
      </p>

      <button type="button" onClick={load} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Đang kiểm tra...' : ' Làm mới'}
      </button>

      {error && error.status !== 403 && <p className="error-text">{error.message}</p>}

      {!error && loading && !result && <p>Đang kiểm tra...</p>}

      {result && (
        <>
          <p
            style={{
              fontWeight: 600,
              color: result.anyOrphansFound ? 'var(--color-danger)' : 'var(--color-accent)',
            }}
          >
            {result.anyOrphansFound ? ' Phát hiện dữ liệu mồ côi — xem chi tiết bên dưới.' : ' Không phát hiện dữ liệu mồ côi nào.'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: -8, marginBottom: 16 }}>
            Kiểm tra lúc {new Date(result.checkedAt).toLocaleString('vi-VN')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.checks.map((check) => (
              <CheckCard key={check.checkName} check={check} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
