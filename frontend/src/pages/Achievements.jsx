import { useEffect, useState } from 'react'
import { achievementApi } from '../services/api'
import RequestError from '../components/RequestError'

export default function Achievements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // TASK-129: tách riêng để nút "Thử lại" (RequestError) gọi lại đúng logic fetch này — cùng pattern
  // loadItems/loadRooms ở Projects.jsx/Dashboard.jsx.
  function loadAchievements() {
    setLoading(true)
    setError(null)
    achievementApi
      .list()
      .then((data) => setItems(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAchievements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const achievedCount = items.filter((item) => item.achieved).length

  return (
    <div>
      <h2>Huy hiệu thành tựu</h2>
      <p className="text-muted">
        Huy hiệu được tính tự động dựa trên số phòng, số thiết kế AI đã hoàn thành và số thiết kế đã
        chia sẻ của bạn — không cần tự đánh dấu.
      </p>

      {/* TASK-129: RequestError (nút "🔄 Thử lại" thủ công) thay cho <p className="error-text"> trần. */}
      {error && <RequestError message={error} onRetry={loadAchievements} />}
      {loading && <p>Đang tải...</p>}

      {!loading && !error && (
        <>
          <p className="text-muted">
            Đã đạt {achievedCount}/{items.length} huy hiệu
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {items.map((item) => (
              <div
                key={item.code}
                className="card"
                style={{
                  opacity: item.achieved ? 1 : 0.55,
                  border: item.achieved ? '2px solid var(--color-primary, #2f6f4f)' : undefined,
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.8rem' }}>{item.achieved ? '🏆' : '🔒'}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                    <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                      {item.achieved ? item.description : item.achievedRequirement}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
