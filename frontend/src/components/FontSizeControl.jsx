import { useState } from 'react'

// TASK-132: key localStorage lưu lựa chọn cỡ chữ của user — "sm" | "md" | "lg".
// Mặc định "md" nếu chưa từng chọn (= cỡ chữ hiện tại của toàn app, không cần rule CSS riêng).
const FONT_SIZE_STORAGE_KEY = 'homely_font_size'
const LEVELS = ['sm', 'md', 'lg']
const DEFAULT_LEVEL = 'md'

function applyFontSize(level) {
  document.documentElement.setAttribute('data-font-size', level)
}

// TASK-132: đọc localStorage và áp dụng attribute [data-font-size] ngay trong lúc khởi tạo state
// (chạy đồng bộ trước khi React commit/browser paint) để tránh nháy cỡ chữ (FOUC) khi user đã chọn
// sm/lg trước đó. Bọc try/catch vì localStorage có thể throw ở một số chế độ duyệt web riêng tư —
// AC yêu cầu console sạch lỗi.
function readAndApplyStoredFontSize() {
  let level = DEFAULT_LEVEL
  try {
    const stored = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY)
    level = LEVELS.includes(stored) ? stored : DEFAULT_LEVEL
  } catch {
    level = DEFAULT_LEVEL
  }
  applyFontSize(level)
  return level
}

function persistFontSize(level) {
  try {
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, level)
  } catch {
    // TASK-132: nếu không lưu được (chế độ riêng tư/quota) vẫn áp dụng cỡ chữ cho phiên hiện tại,
    // chỉ là không giữ được lựa chọn sau khi tải lại trang.
  }
}

export default function FontSizeControl() {
  const [level, setLevel] = useState(readAndApplyStoredFontSize)

  function changeTo(next) {
    applyFontSize(next)
    persistFontSize(next)
    setLevel(next)
  }

  function decrease() {
    const index = LEVELS.indexOf(level)
    changeTo(LEVELS[Math.max(0, index - 1)])
  }

  function increase() {
    const index = LEVELS.indexOf(level)
    changeTo(LEVELS[Math.min(LEVELS.length - 1, index + 1)])
  }

  function reset() {
    changeTo(DEFAULT_LEVEL)
  }

  return (
    <span className="font-size-control">
      <button
        type="button"
        className="secondary"
        onClick={decrease}
        disabled={level === 'sm'}
        aria-label="Giảm cỡ chữ"
        title="Giảm cỡ chữ"
      >
        A−
      </button>
      <button
        type="button"
        className="secondary"
        onClick={reset}
        disabled={level === 'md'}
        aria-label="Đặt lại cỡ chữ mặc định"
        title="Cỡ chữ mặc định"
      >
        A
      </button>
      <button
        type="button"
        className="secondary"
        onClick={increase}
        disabled={level === 'lg'}
        aria-label="Tăng cỡ chữ"
        title="Tăng cỡ chữ"
      >
        A+
      </button>
    </span>
  )
}
