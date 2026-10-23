import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

// TASK-097: hàng đợi kiểm duyệt hậu kiểm — mọi share MỚI vẫn công khai NGAY (xem Goal trong task
// file), admin chỉ có thể ẨN (REJECTED) 1 share đã có hoặc KHÔI PHỤC (APPROVED) lại sau đó.
const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang hiển thị', value: 'APPROVED' },
  { label: 'Đã ẩn', value: 'REJECTED' },
]

function shortId(id) {
  return id ? `${id.slice(0, 8)}…` : ''
}

export default function AdminModeration() {
  const [status, setStatus] = useState('')
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  // TASK-097: theo dõi riêng shareId đang gọi API moderate để disable đúng 1 nút, không khoá cả bảng.
  const [moderatingId, setModeratingId] = useState(null)

  function load() {
    setLoading(true)
    adminApi
      .shares(status || undefined)
      .then(setItems)
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status])

  async function handleModerate(shareId, nextStatus) {
    setModeratingId(shareId)
    try {
      const updated = await adminApi.moderateShare(shareId, nextStatus)
      setItems((prev) => prev.map((item) => (item.shareId === shareId ? updated : item)))
    } catch (err) {
      setError(err)
    } finally {
      setModeratingId(null)
    }
  }

  return (
    <div>
      <h2>Admin — Kiểm duyệt chia sẻ công khai</h2>
      <p className="text-muted">
        Chia sẻ mới bật lên vẫn hiển thị công khai ngay lập tức — tại đây chỉ có thể ẨN 1 chia sẻ đã
        có sau khi phát hiện nội dung không phù hợp, hoặc khôi phục lại nếu ẩn nhầm.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={status === tab.value ? '' : 'secondary'}
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (error.status === 403 ? <AccessDenied /> : <p className="error-text">{error.message}</p>)}
      {loading && <p>Đang tải...</p>}

      {!loading && !error && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Loại phòng</th>
                <th>Share token</th>
                <th>Trạng thái bật</th>
                <th>Kiểm duyệt</th>
                <th>Bình luận</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((share) => (
                <tr key={share.shareId}>
                  <td style={{ fontSize: '0.8rem' }} title={share.jobId}>{shortId(share.jobId)}</td>
                  <td>{share.roomType || '—'}</td>
                  <td style={{ fontSize: '0.8rem' }} title={share.shareToken}>{shortId(share.shareToken)}</td>
                  <td>
                    <span className={`status-badge status-${share.enabled ? 'COMPLETED' : 'FAILED'}`}>
                      {share.enabled ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${share.moderationStatus === 'REJECTED' ? 'FAILED' : 'COMPLETED'}`}>
                      {share.moderationStatus === 'REJECTED' ? 'Đã ẩn' : share.moderationStatus}
                    </span>
                  </td>
                  <td>{share.commentCount}</td>
                  <td>{new Date(share.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    {share.moderationStatus === 'REJECTED' ? (
                      <button
                        className="secondary"
                        disabled={moderatingId === share.shareId}
                        onClick={() => handleModerate(share.shareId, 'APPROVED')}
                      >
                        Khôi phục
                      </button>
                    ) : (
                      <button
                        style={{ background: 'var(--color-danger)', color: '#fff', borderColor: 'var(--color-danger)' }}
                        disabled={moderatingId === share.shareId}
                        onClick={() => handleModerate(share.shareId, 'REJECTED')}
                      >
                        Ẩn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-muted">Không có chia sẻ nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
