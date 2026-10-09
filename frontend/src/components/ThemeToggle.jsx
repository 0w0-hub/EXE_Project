import { useState } from 'react'

// TASK-088: key localStorage lưu lựa chọn theme của user — "light" | "dark".
// Mặc định "light" nếu chưa từng chọn (KHÔNG tự theo prefers-color-scheme hệ điều hành, theo scope task).
const THEME_STORAGE_KEY = 'homely_theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

// TASK-088: đọc localStorage và áp dụng attribute [data-theme] ngay trong lúc khởi tạo state (chạy
// đồng bộ trước khi React commit/browser paint) để tránh nháy sáng (FOUC) khi user đã chọn dark trước đó.
// Bọc try/catch vì localStorage có thể throw ở một số chế độ duyệt web riêng tư — AC yêu cầu console sạch lỗi.
function readAndApplyStoredTheme() {
  let theme = 'light'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    theme = stored === 'dark' ? 'dark' : 'light'
  } catch {
    theme = 'light'
  }
  applyTheme(theme)
  return theme
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readAndApplyStoredTheme)
  const isDark = theme === 'dark'

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    applyTheme(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
    }
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="secondary"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
