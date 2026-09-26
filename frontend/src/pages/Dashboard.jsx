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

// TASK-081: cờ "đã xem tour onboarding"
const ONBOARDING_STORAGE_KEY = 'homely_onboarding_seen'

// TASK-162: format giờ:phút:giây
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
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)

  useDocumentTitle('Trang chủ')

  // Container dùng chung cho toàn bộ nội dung Dashboard.
  // Mục tiêu: tất cả các section có cùng mép trái/phải.
  const contentStyle = {
    width: '100%',
    maxWidth: 1500,
    margin: '0 auto',
    boxSizing: 'border-box',
  }

  // =========================================================
  // LOAD ROOMS
  // =========================================================

  function loadRooms() {
    setLoading(true)
    setError(null)

    return roomApi
      .list()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  // =========================================================
  // REFRESH
  // =========================================================

  function handleRefresh() {
    setRefreshing(true)

    loadRooms().finally(() => {
      setRefreshing(false)
      setLastRefreshedAt(new Date())
    })
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadRooms()

    usageApi.me().then(setUsage).catch(() => {})
    subscriptionApi.me().then(setSubscription).catch(() => {})

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =========================================================
  // SHIFT + R
  // =========================================================

  useEffect(() => {
    function onGlobalKeyDown(evt) {
      if (evt.key !== 'R' && evt.key !== 'r') return
      if (!evt.shiftKey) return

      const active = document.activeElement

      const isTyping =
        active &&
        (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable
        )

      if (isTyping) return
      if (refreshing) return

      handleRefresh()
    }

    document.addEventListener('keydown', onGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', onGlobalKeyDown)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  // =========================================================
  // ONBOARDING
  // =========================================================

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        setShowTour(true)
      }
    } catch {
      // Bỏ qua nếu localStorage bị chặn.
    }
  }, [])

  function closeTour() {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    } catch {
      // Bỏ qua nếu localStorage bị chặn.
    }

    setShowTour(false)
  }

  // =========================================================
  // ROOM PHOTOS
  // =========================================================

  useEffect(() => {
    const roomsWithPhoto = rooms.filter((room) => room.photoAssetId)

    if (roomsWithPhoto.length === 0) {
      setPhotoUrls({})
      return
    }

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
      if (!cancelled) {
        setPhotoUrls(urls)
      }
    })

    return () => {
      cancelled = true

      Object.values(urls).forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [rooms])

  // =========================================================
  // SEARCH
  // =========================================================

  const visibleRooms = rooms.filter((room) =>
    room.roomType?.toLowerCase().includes(search.trim().toLowerCase())
  )

  // =========================================================
  // UI
  // =========================================================

  return (
    <div>
      {showTour && <OnboardingTour onClose={closeTour} />}

      {/* =====================================================
          HERO / INTRO
          ===================================================== */}
      <div
        className="section-tint"
        style={{
          width: 'calc(100vw - 10px)',
          minHeight: 'calc(35vw - 10px)',
          marginLeft: 'calc(50% - 50vw + 5px)',
          marginRight: 'calc(50% - 50vw + 5px)',
          marginTop: -20,
          boxSizing: 'border-box',
          padding: 20,
        }}
      >
        <div
          style={{
            ...contentStyle,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* =========================
              CỘT TRÁI
              ========================= */}
          <div
            style={{
              flex: '1 1 400px',
              minWidth: 0,
            }}
          >
            {/* Hai ảnh */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <img
                src={vidGif}
                alt="Intro"
                style={{
                  flex: 1,
                  width: 0,
                  minWidth: 0,
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover',
                  height: 200,
                }}
              />

              <img
                src={anhDecor}
                alt="Decor"
                style={{
                  flex: 1,
                  width: 0,
                  minWidth: 0,
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover',
                  height: 200,
                }}
              />
            </div>

            {/* Tiêu đề */}
            <h2
              style={{
                margin: '50px 0 4px',
                fontSize: '1.8rem',
              }}
            >
              {rooms.length === 0
                ? 'Sẵn sàng tạo thiết kế đầu tiên?'
                : 'Chào mừng trở lại 👋'}
            </h2>

            <p
              className="text-muted"
              style={{
                margin: 0,
              }}
            >
              Quản lý các phòng đã tạo, hoặc bắt đầu một thiết kế mới cùng AI.
            </p>

            <button
              type="button"
              className="onboarding-tour-relaunch"
              style={{
                marginTop: 8,
              }}
              onClick={() => setShowTour(true)}
            >
              Xem lại hướng dẫn
            </button>
          </div>

          {/* =========================
              THAO TÁC NHANH
              ========================= */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignSelf: 'stretch',
              flex: 'none',
              width: 180,
            }}
          >
            <Link
              to="/rooms/new"
              style={{
                flex: 1,
                display: 'flex',
                textDecoration: 'none',
              }}
            >
              <button
                style={{
                  flex: 1,
                  width: '100%',
                }}
              >
                + Tạo phòng mới
              </button>
            </Link>

            <Link
              to="/projects"
              style={{
                flex: 1,
                display: 'flex',
                textDecoration: 'none',
              }}
            >
              <button
                type="button"
                className="secondary"
                style={{
                  flex: 1,
                  width: '100%',
                }}
              >
                Mở Projects
              </button>
            </Link>

            <Link
              to="/trash"
              style={{
                flex: 1,
                display: 'flex',
                textDecoration: 'none',
              }}
            >
              <button
                type="button"
                className="secondary"
                style={{
                  flex: 1,
                  width: '100%',
                }}
              >
                Thùng rác
              </button>
            </Link>

            {/* Làm mới */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <button
                type="button"
                className="secondary"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Làm mới (Shift+R)"
                style={{
                  flex: 1,
                  width: '100%',
                }}
              >
                {refreshing
                  ? '🔄 Đang làm mới…'
                  : '🔄 Làm mới'}
              </button>

              {lastRefreshedAt && (
                <span
                  className="text-muted"
                  style={{
                    fontSize: '0.75rem',
                  }}
                >
                  Cập nhật lúc {formatTimeHms(lastRefreshedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================
            SEARCH
            ========================= */}
        {rooms.length > 0 && (
          <div
            style={{
              ...contentStyle,
              marginTop: 16,
            }}
          >
            <div
              className="form-group"
              style={{
                margin: 0,
                maxWidth: 360,
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo loại phòng..."
              />
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          NỘI DUNG BÊN DƯỚI
          TẤT CẢ DÙNG CHUNG maxWidth 1400
          ===================================================== */}
      <div
        className="dashboard-panel"
        style={contentStyle}
      >
        <RecentDesigns />

        {usage && subscription && (
          <div
            className="room-grid"
            style={{
              marginTop: 16,
              width: '100%',
            }}
          >
            <div
              className="stat-tile"
              style={{
                '--tile-bg': 'var(--color-primary-tint)',
              }}
            >
              <p className="stat-tile-label">
                Gói hiện tại
              </p>

              <p className="stat-tile-value">
                {subscription.planName}
              </p>
            </div>

            <div
              className="stat-tile"
              style={{
                '--tile-bg': 'var(--color-accent-tint)',
              }}
            >
              <p className="stat-tile-label">
                Lượt tạo thiết kế tháng này
              </p>

              <p className="stat-tile-value">
                {usage.used}/{usage.limit ?? '∞'}
              </p>
            </div>

            <div
              className="stat-tile"
              style={{
                '--tile-bg': 'var(--color-support)',
              }}
            >
              <p className="stat-tile-label">
                Số phòng đã tạo
              </p>

              <p className="stat-tile-value">
                {rooms.length}
              </p>
            </div>
          </div>
        )}

        {/* =========================
            DESIGN INSIGHTS
            ========================= */}
        <div
          style={{
            width: '100%',
            marginTop: 16,
          }}
        >
          <DesignInsightsCard />
        </div>

        {/* =========================
            LOADING
            ========================= */}
        {loading && (
          <p style={{ marginTop: 16 }}>
            Đang tải...
          </p>
        )}

        {/* =========================
            ERROR
            ========================= */}
        {error && (
          <div style={{ marginTop: 16 }}>
            <RequestError
              message={error}
              onRetry={loadRooms}
            />
          </div>
        )}

        {/* =========================
            EMPTY STATE
            ========================= */}
        {!loading &&
          !error &&
          rooms.length === 0 && (
            <div
              className="card"
              style={{
                marginTop: 16,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <p>
                Chưa có phòng nào. Bắt đầu bằng cách tạo
                phòng đầu tiên và để AI đề xuất phương án
                thiết kế.
              </p>

              <Link to="/rooms/new">
                <button>
                  Tạo phòng đầu tiên
                </button>
              </Link>
            </div>
          )}

        {/* =========================
            SEARCH EMPTY
            ========================= */}
        {!loading &&
          !error &&
          rooms.length > 0 &&
          visibleRooms.length === 0 && (
            <div
              className="card"
              style={{
                marginTop: 16,
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <p
                className="text-muted"
                style={{
                  margin: 0,
                }}
              >
                Không có phòng nào khớp với "{search}".
              </p>
            </div>
          )}

        {/* =========================
            ROOMS
            ========================= */}
        {!loading &&
          !error &&
          visibleRooms.length > 0 && (
            <div
              className="room-grid"
              style={{
                marginTop: 16,
                width: '100%',
              }}
            >
              {visibleRooms.map((room) => (
                <div
                  className="card"
                  key={room.id}
                >
                  {photoUrls[room.id] ? (
                    <img
                      className="room-card-photo"
                      src={photoUrls[room.id]}
                      alt={room.roomType}
                    />
                  ) : (
                    <div className="room-card-photo-placeholder">
                      🏠
                    </div>
                  )}

                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    {room.roomType}
                  </h3>

                  {room.widthMeters &&
                    room.lengthMeters && (
                      <p
                        className="text-muted"
                        style={{
                          margin: '4px 0 0',
                        }}
                      >
                        {room.widthMeters}m ×{' '}
                        {room.lengthMeters}m
                      </p>
                    )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}