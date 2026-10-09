import { useState } from 'react'

const THEME_STORAGE_KEY = 'homely_theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

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
