import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { notificationApi } from '../services/api'
import useEscapeKey from '../hooks/useEscapeKey'
import ThemeToggle from './ThemeToggle'
import FontSizeControl from './FontSizeControl'
import logoImg from '../assets/Logo.jpg'

// TASK-082: poll interval cho unread-count — đơn giản đúng quy mô MVP, KHÔNG dùng WebSocket/SSE
// (xem tasks/active/TASK-082-notification-center.md).
const NOTIFICATION_POLL_MS = 20000

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const displayName = user?.fullName || user?.email || ''
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : '?'

  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-brand" end>
        <img
          src={logoImg}
          alt="Homely"
          style={{
            height: '42px',
            width: 'auto',
            borderRadius: '5px',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </NavLink>
      <nav className="navbar-nav">
        {/* TASK-088 (coordinator): hiện cho cả 2 trạng thái đăng nhập — theme là sở thích trình duyệt,
            không phải dữ liệu tài khoản. */}
        <ThemeToggle />
        {/* TASK-132: cùng vị trí/điều kiện hiển thị với ThemeToggle — cỡ chữ là sở thích trình duyệt,
            không phải dữ liệu tài khoản. */}
        <FontSizeControl />
        {user ? (
          <>
            <NavLink to="/templates">Mẫu thiết kế</NavLink>
            <NavLink to="/projects">Dự án của tôi</NavLink>
            {user.role === 'ADMIN' && <NavLink to="/admin">Quản trị</NavLink>}
            <NotificationBell navigate={navigate} />
            <AccountMenu displayName={displayName} initial={initial} onLogout={handleLogout} />
          </>
        ) : (
          <>
            <NavLink to="/login">Đăng nhập</NavLink>
            <NavLink to="/register">Đăng ký</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}

// TASK-083/084/087 (coordinator, sau khi 4 agent round 3 báo cáo xong): gộp link tới 3 trang tài
// khoản mới (đổi mật khẩu, lịch sử hoạt động, xuất dữ liệu) vào 1 dropdown thay vì thêm 3 nút rời —
// đỡ rối thanh nav vốn đã có nhiều mục. Khối riêng, tự quản lý state, cùng pattern NotificationBell.
function AccountMenu({ displayName, initial, onLogout }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // TASK-090: Esc đóng dropdown khi đang mở.
  useEscapeKey(open, () => setOpen(false))

  return (
    <span className="account-menu" ref={wrapRef}>
      <button
        type="button"
        className="account-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="avatar-circle" title={displayName}>{initial}</span>
        <span className="navbar-user">{displayName}</span>
      </button>
      {open && (
        <div className="account-menu__dropdown">
          <NavLink to="/account/password" onClick={() => setOpen(false)}>Đổi mật khẩu</NavLink>
          <NavLink to="/account/activity" onClick={() => setOpen(false)}>Lịch sử hoạt động</NavLink>
          {/* TASK-091 (coordinator): gộp link vào dropdown "Tài khoản" có sẵn, cùng cách TASK-083/084/087. */}
          <NavLink to="/account/achievements" onClick={() => setOpen(false)}>Huy hiệu</NavLink>
          <NavLink to="/account/export" onClick={() => setOpen(false)}>Xuất dữ liệu của tôi</NavLink>
          {/* TASK-107: gộp link vào dropdown "Tài khoản" có sẵn, cùng cách TASK-083/084/087/091. */}
          <NavLink to="/trash" onClick={() => setOpen(false)}>🗑️ Thùng rác</NavLink>
          <button type="button" className="secondary" onClick={onLogout}>Đăng xuất</button>
        </div>
      )}
    </span>
  )
}

// TASK-082: khối riêng, tự quản lý state — thêm additive vào NavBar để giảm rủi ro merge với các
// task khác cùng đụng NavBar.jsx.
function NotificationBell({ navigate }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const wrapRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function pollUnreadCount() {
      try {
        const data = await notificationApi.unreadCount()
        if (!cancelled) setUnreadCount(data?.count ?? 0)
      } catch {
        // Bỏ qua lỗi poll nền — không làm phiền user bằng lỗi mạng tạm thời.
      }
    }

    pollUnreadCount()
    const timer = setInterval(pollUnreadCount, NOTIFICATION_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // TASK-090: Esc đóng dropdown khi đang mở.
  useEscapeKey(open, () => setOpen(false))

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      try {
        const data = await notificationApi.list()
        setItems(data ?? [])
      } catch {
        setItems([])
      }
    }
  }

  async function handleItemClick(item) {
    setOpen(false)
    if (!item.read) {
      try {
        await notificationApi.markRead(item.id)
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch {
        // Điều hướng vẫn tiếp tục dù đánh dấu đã đọc thất bại — không chặn luồng chính của user.
      }
    }
    navigate(`/designs/${item.jobId}`)
  }

  // TASK-151: "Đánh dấu tất cả đã đọc". Spec gốc giả định `notificationApi` CHƯA có endpoint hàng
  // loạt (yêu cầu lặp `markRead(id)` qua từng thông báo chưa đọc trong state client nếu vậy) — nhưng
  // kiểm tra `services/api.js` cho thấy `notificationApi.markAllRead()` (PATCH /notifications/read-all)
  // đã tồn tại sẵn (backend TASK-082, cùng đợt, đang ở working tree chưa commit). Vì endpoint hàng loạt
  // đã có thật (không phải bịa mới), dùng thẳng 1 lệnh gọi thay vì lặp N lệnh `markRead` riêng lẻ —
  // đúng tinh thần "không thêm dữ liệu backend mới", chỉ khác là dùng cái đã có thay vì loop client.
  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead()
      setItems((prev) => prev.map((item) => ({ ...item, read: true })))
      setUnreadCount(0)
    } catch {
      // Giữ nguyên items/unreadCount hiện tại nếu API lỗi — tránh hiển thị sai "đã đọc hết" trong khi
      // thực tế thất bại (không có cách nào biết phần nào đã thành công với 1 lệnh PATCH gộp).
    }
  }

  return (
    <span className="notification-bell" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={toggleOpen}
        aria-label="Thông báo"
        aria-haspopup="true"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="notification-bell__dropdown">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-bell__mark-all secondary"
              onClick={handleMarkAllRead}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
          {items.length === 0 ? (
            <p className="notification-bell__empty text-muted">Chưa có thông báo nào.</p>
          ) : (
            <ul className="notification-bell__list">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={item.read ? 'is-read' : 'is-unread'}
                  onClick={() => handleItemClick(item)}
                >
                  <p className="notification-bell__message">{item.message}</p>
                  <span className="notification-bell__time">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  )
}
