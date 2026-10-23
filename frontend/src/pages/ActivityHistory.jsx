import { useEffect, useState } from 'react'
import { activityApi } from '../services/api'
import RequestError from '../components/RequestError'

const TYPE_META = {
  ROOM_CREATED: { label: 'Tạo phòng' },
  DESIGN_GENERATED: { label: 'Tạo thiết kế AI' },
  DESIGN_SHARED: { label: 'Chia sẻ công khai' },
}

export default function ActivityHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function loadActivity() {
    setLoading(true)
    setError(null)
    activityApi
      .list()
      .then((data) => setItems(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadActivity()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <h2>Lịch sử hoạt động</h2>
      <p className="text-muted">
        Các hoạt động gần đây nhất trên tài khoản của bạn: phòng đã tạo, thiết kế AI đã tạo, chia sẻ
        công khai đã bật.
      </p>

      {error && <RequestError message={error} onRetry={loadActivity} />}
      {loading && <p>Đang tải...</p>}

      {!loading && !error && items.length === 0 && (
        <div className="card">
          <p>Chưa có hoạt động nào. Hãy tạo phòng hoặc thiết kế AI đầu tiên của bạn.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item, index) => {
            const meta = TYPE_META[item.type] || { label: item.type }
            return (
              <li key={`${item.type}-${item.createdAt}-${index}`} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{item.description}</p>
                    <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
