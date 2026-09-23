import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { assetApi, roomApi, subscriptionApi, usageApi } from '../services/api'
import vidGif from '../assets/vid.gif'
import anhDecor from '../assets/anhdecor.jpg'
import OnboardingTour from '../components/OnboardingTour'
import DesignInsightsCard from '../components/DesignInsightsCard'
import RecentDesigns from '../components/RecentDesigns'
import RequestError from '../components/RequestError'
import useDocumentTitle from '../hooks/useDocumentTitle'

// TASK-081: cờ "đã xem tour onboarding" — key riêng, không trùng `homely_access_token`/`homely_refresh_token`.
const ONBOARDING_STORAGE_KEY = 'homely_onboarding_seen'

// TASK-162: format giờ:phút:giây theo giờ hệ thống (local), luôn 2 chữ số — dùng cho dòng "Cập nhật
// lúc HH:mm:ss" cạnh nút "🔄 Làm mới". Không dùng toLocaleTimeString trực tiếp vì output phụ thuộc
// locale/trình duyệt, không đảm bảo đúng format HH:mm:ss cố định theo AC.
function formatTimeHms(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function Dashboard() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usage, setUsage] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [photoUrls, setPhotoUrls] = useState({})
  const [search, setSearch] = useState('')
  const [showTour, setShowTour] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  // TASK-162: thời điểm request làm mới THẬT SỰ hoàn tất gần nhất (thành công hay lỗi đều tính) —
  // null nghĩa là chưa refresh lần nào trong phiên này (chưa hiện dòng "Cập nhật lúc HH:mm:ss").
  // KHÔNG set lúc mount (useEffect load ban đầu) — chỉ set trong handleRefresh() theo đúng Scope.
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)

  useDocumentTitle('Trang chủ')

  // TASK-113: tách riêng để nút "Thử lại" (RequestError) gọi lại đúng hàm fetch phòng này — không
  // viết lại logic mới. usage/subscription không thuộc phạm vi retry (Scope task chỉ nói "hàm fetch
  // phòng hiện có"), giữ nguyên cách gọi âm thầm (catch rỗng) như trước.
  // TASK-159: return promise chain để nút "Làm mới" biết khi nào request kết thúc (thành công/lỗi)
  // mà không thay đổi hành vi các nơi gọi cũ (useEffect mount, "Thử lại" của RequestError vẫn
  // hoạt động như trước, chỉ đơn giản bỏ qua giá trị trả về).
  function loadRooms() {
    setLoading(true)
    setError(null)
    return roomApi
      .list()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  // TASK-159: nút "Làm mới" thủ công — gọi lại đúng loadRooms() hiện có, chỉ thêm trạng thái
  // loading riêng (refreshing) để disable nút + đổi label trong lúc chờ, không đụng tới luồng
  // lỗi/loading chính (loading/error) đã có sẵn.
  function handleRefresh() {
    setRefreshing(true)
    loadRooms().finally(() => {
      setRefreshing(false)
      // TASK-162: ghi nhận thời điểm request THẬT SỰ hoàn tất (dù thành công hay lỗi — cùng tinh
      // thần đã áp dụng cho label loading TASK-159 ở trên), không phải lúc bấm nút.
      setLastRefreshedAt(new Date())
    })
  }

  useEffect(() => {
    loadRooms()
    usageApi.me().then(setUsage).catch(() => {})
    subscriptionApi.me().then(setSubscription).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TASK-162: phím tắt Shift+R gọi lại đúng handleRefresh() hiện có — pattern gate giống
  // Projects.jsx (TASK-150, phím "/"): chỉ hành động khi KHÔNG đang gõ trong input/textarea/select/
  // contentEditable (tránh chặn nhầm ô tìm kiếm sẵn có của Dashboard hoặc bất kỳ field nào khác),
  // và guard !refreshing để không gửi request chồng lấn khi đang loading.
  useEffect(() => {
    function onGlobalKeyDown(evt) {
      if (evt.key !== 'R' && evt.key !== 'r') return
      if (!evt.shiftKey) return
      const active = document.activeElement
      const isTyping =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      if (isTyping) return
      if (refreshing) return
      handleRefresh()
    }
    document.addEventListener('keydown', onGlobalKeyDown)
    return () => document.removeEventListener('keydown', onGlobalKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  // TASK-081: chỉ tự động hiện tour lần đầu (chưa có flag trong localStorage).
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        setShowTour(true)
      }
    } catch {
      // localStorage có thể bị chặn (chế độ riêng tư) — bỏ qua, coi như chưa xem tour.
    }
  }, [])

  function closeTour() {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    } catch {
      // bỏ qua nếu localStorage bị chặn
    }
    setShowTour(false)
  }

  // Ảnh phòng đã có sẵn trong RoomResponse.photoAssetId — chỉ hiển thị lại, không thêm dữ liệu mới.
  useEffect(() => {
    const roomsWithPhoto = rooms.filter((room) => room.photoAssetId)
    if (roomsWithPhoto.length === 0) return
    let cancelled = false
    const urls = {}

    Promise.all(
      roomsWithPhoto.map((room) =>
        assetApi
          .fetchObjectUrl(room.photoAssetId)
          .then((url) => {
            urls[room.id] = url
          })
          .catch(() => {})
      )
    ).then(() => {
      if (!cancelled) setPhotoUrls(urls)
    })

    return () => {
      cancelled = true
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [rooms])

  const visibleRooms = rooms.filter((room) =>
    room.roomType?.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div>
      {showTour && <OnboardingTour onClose={closeTour} />}

      <div className="section-tint">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {/* Cột trái: 2 ảnh cạnh nhau + text */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <img
                src={vidGif}
                alt="Intro"
                style={{ flex: 1, width: 0, minWidth: 0, borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: 200 }}
              />
              <img
                src={anhDecor}
                alt="Decor"
                style={{ flex: 1, width: 0, minWidth: 0, borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: 200 }}
              />
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.8rem' }}>
              {rooms.length === 0 ? 'Sẵn sàng tạo thiết kế đầu tiên?' : 'Chào mừng trở lại 👋'}
            </h2>
            <p className="text-muted" style={{ margin: 0 }}>
              Quản lý các phòng đã tạo, hoặc bắt đầu một thiết kế mới cùng AI.
            </p>
            <button
              type="button"
              className="onboarding-tour-relaunch"
              style={{ marginTop: 8 }}
              onClick={() => setShowTour(true)}
            >
              Xem lại hướng dẫn
            </button>
          </div>
          {/* TASK-145: cụm "Thao tác nhanh" — 4 nút giãn đều theo chiều dọc để vừa khung */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'stretch', minWidth: 160 }}>
            <Link to="/rooms/new" style={{ flex: 1, display: 'flex', textDecoration: 'none' }}>
              <button style={{ flex: 1, width: '100%' }}>+ Tạo phòng mới</button>
            </Link>
            <Link to="/projects" style={{ flex: 1, display: 'flex', textDecoration: 'none' }}>
              <button type="button" className="secondary" style={{ flex: 1, width: '100%' }}>Mở Projects</button>
            </Link>
            <Link to="/trash" style={{ flex: 1, display: 'flex', textDecoration: 'none' }}>
              <button type="button" className="secondary" style={{ flex: 1, width: '100%' }}>Thùng rác</button>
            </Link>
            {/* TASK-159: làm mới dữ liệu thủ công */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                type="button"
                className="secondary"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Làm mới (Shift+R)"
                style={{ flex: 1, width: '100%' }}
              >
                {refreshing ? '🔄 Đang làm mới…' : '🔄 Làm mới'}
              </button>
              {lastRefreshedAt && (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Cập nhật lúc {formatTimeHms(lastRefreshedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {rooms.length > 0 && (
          <div className="form-group" style={{ marginTop: 16, marginBottom: 0, maxWidth: 360 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo loại phòng..."
            />
          </div>
        )}
      </div>

      <RecentDesigns />

      {usage && subscription && (
        <div className="room-grid" style={{ marginTop: 16 }}>
          <div className="stat-tile" style={{ '--tile-bg': 'var(--color-primary-tint)' }}>
            <p className="stat-tile-label">Gói hiện tại</p>
            <p className="stat-tile-value">{subscription.planName}</p>
          </div>
          <div className="stat-tile" style={{ '--tile-bg': 'var(--color-accent-tint)' }}>
            <p className="stat-tile-label">Lượt tạo thiết kế tháng này</p>
            <p className="stat-tile-value">{usage.used}/{usage.limit ?? '∞'}</p>
          </div>
          <div className="stat-tile" style={{ '--tile-bg': 'var(--color-support)' }}>
            <p className="stat-tile-label">Số phòng đã tạo</p>
            <p className="stat-tile-value">{rooms.length}</p>
          </div>
        </div>
      )}

      <DesignInsightsCard />

      {loading && <p>Đang tải...</p>}
      {error && <RequestError message={error} onRetry={loadRooms} />}

      {/* TASK-113: gate theo !error — khi có lỗi API chỉ hiện RequestError, không hiện đồng thời
          empty-state (tránh thông điệp mâu thuẫn: "chưa có phòng nào" trong khi thật ra là lỗi mạng). */}
      {!loading && !error && rooms.length === 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <p>Chưa có phòng nào. Bắt đầu bằng cách tạo phòng đầu tiên và để AI đề xuất phương án thiết kế.</p>
          <Link to="/rooms/new">
            <button>Tạo phòng đầu tiên</button>
          </Link>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && visibleRooms.length === 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="text-muted" style={{ margin: 0 }}>Không có phòng nào khớp với "{search}".</p>
        </div>
      )}

      <div className="room-grid" style={{ marginTop: 16 }}>
        {visibleRooms.map((room) => (
          <div className="card" key={room.id}>
            {photoUrls[room.id] ? (
              <img className="room-card-photo" src={photoUrls[room.id]} alt={room.roomType} />
            ) : (
              <div className="room-card-photo-placeholder">🏠</div>
            )}
            <h3 style={{ margin: 0 }}>{room.roomType}</h3>
            {room.widthMeters && room.lengthMeters && (
              <p className="text-muted" style={{ margin: '4px 0 0' }}>
                {room.widthMeters}m × {room.lengthMeters}m
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
