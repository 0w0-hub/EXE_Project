import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { assetApi, roomApi, subscriptionApi, usageApi } from '../services/api'
import vidGif from '../assets/vid.gif'
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
          HERO / GIỚI THIỆU
          ===================================================== */}
      <div
        className="section-tint"
        style={{
          width: 'calc(100vw - 10px)',
          marginLeft: 'calc(50% - 50vw + 5px)',
          marginRight: 'calc(50% - 50vw + 5px)',
          marginTop: -20,
          boxSizing: 'border-box',
          padding: '48px 20px 56px',
        }}
      >
        <div
          style={{
            ...contentStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* =========================
              GIF TRUNG TÂM
              ========================= */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <img
              src={vidGif}
              alt="Homely AI Interior Design"
              style={{
                display: 'block',
                width: 'min(760px, 100%)',
                height: 'auto',
                maxHeight: 430,
                borderRadius: 'var(--radius-lg, 16px)',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0,0,0,0.12))',
              }}
            />
          </div>

          {/* =========================
              GIỚI THIỆU NGẮN
              ========================= */}
          <div
            style={{
              width: '100%',
              maxWidth: 850,
              marginTop: 36,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: 1.15,
              }}
            >
              Thiết kế không gian sống
              <br />
              <span style={{ color: 'var(--color-primary)' }}>
                theo cách của bạn
              </span>
            </h1>

            <p
              className="text-muted"
              style={{
                maxWidth: 720,
                margin: '18px auto 0',
                fontSize: '1.05rem',
                lineHeight: 1.7,
              }}
            >
              Homely giúp bạn biến ý tưởng về căn phòng trong mơ thành
              thiết kế nội thất trực quan bằng AI. Chỉ cần tạo phòng,
              lựa chọn phong cách và ngân sách, Homely sẽ đề xuất phương
              án phù hợp với không gian của bạn.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 24,
              }}
            >
              <Link
                to="/rooms/new"
                style={{
                  textDecoration: 'none',
                }}
              >
                <button type="button">
                  Tạo phòng mới
                </button>
              </Link>

              <Link
                to="/templates"
                style={{
                  textDecoration: 'none',
                }}
              >
                <button
                  type="button"
                  className="secondary"
                >
                  Khám phá mẫu thiết kế
                </button>
              </Link>
            </div>
          </div>

          {/* =========================
              3D DECOR
              ========================= */}
          <div
            style={{
              width: '100%',
              maxWidth: 1100,
              marginTop: 64,
              paddingTop: 48,
              borderTop: '1px solid var(--color-border, #e5e7eb)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
              }}
            >
              3D Decor
            </p>

            <h2
              style={{
                margin: '8px 0 12px',
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              }}
            >
              Trực quan hóa căn phòng với không gian 3D
            </h2>

            <p
              className="text-muted"
              style={{
                maxWidth: 760,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Không chỉ xem hình ảnh thiết kế, bạn còn có thể khám phá
              không gian nội thất dưới góc nhìn 3D. Quan sát cách bố trí
              nội thất, hình dung không gian và dễ dàng đánh giá phương án
              trước khi đưa ra quyết định.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginTop: 28,
                textAlign: 'left',
              }}
            >
              <div
                className="card"
                style={{
                  margin: 0,
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: 12,
                  }}
                >
                  
                </div>

                <h3 style={{ margin: '0 0 8px' }}>
                  Không gian 3D
                </h3>

                <p
                  className="text-muted"
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Xem căn phòng dưới dạng không gian 3D thay vì
                  chỉ nhìn một hình ảnh phẳng.
                </p>
              </div>

              <div
                className="card"
                style={{
                  margin: 0,
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: 12,
                  }}
                >
                  
                </div>

                <h3 style={{ margin: '0 0 8px' }}>
                  Bố trí nội thất
                </h3>

                <p
                  className="text-muted"
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Hình dung vị trí và cách sắp xếp các món nội thất
                  trong chính không gian của bạn.
                </p>
              </div>

              <div
                className="card"
                style={{
                  margin: 0,
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: 12,
                  }}
                >
                  
                </div>

                <h3 style={{ margin: '0 0 8px' }}>
                  Khám phá thiết kế
                </h3>

                <p
                  className="text-muted"
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Xoay, quan sát và khám phá thiết kế để có góc nhìn
                  trực quan hơn về căn phòng.
                </p>
              </div>
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
              marginTop: 40,
            }}
          >
            <div
              className="form-group"
              style={{
                margin: 0,
                maxWidth: 360,
                marginLeft: 'auto',
                marginRight: 'auto',
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
          ===================================================== */}
      <div
        className="dashboard-panel"
        style={contentStyle}
      >
        <RecentDesigns />

        {/* =========================
            THỐNG KÊ GÓI / USAGE / PHÒNG
            ========================= */}
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