import { useState } from 'react'

const FONT_SIZE_STORAGE_KEY = 'homely_font_size'
const LEVELS = ['sm', 'md', 'lg']
const DEFAULT_LEVEL = 'md'

function applyFontSize(level) {
  document.documentElement.setAttribute('data-font-size', level)
}

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
      {/* <button
        type="button"
        className="secondary"
        onClick={decrease}
        disabled={level === 'sm'}
        aria-label="Giảm cỡ chữ"
        title="Giảm cỡ chữ"
      >
        
      </button>
      <button
        type="button"
        className="secondary"
        onClick={reset}
        disabled={level === 'md'}
        aria-label="Đặt lại cỡ chữ mặc định"
        title="Cỡ chữ mặc định"
      >
        
      </button>
      <button
        type="button"
        className="secondary"
        onClick={increase}
        disabled={level === 'lg'}
        aria-label="Tăng cỡ chữ"
        title="Tăng cỡ chữ"
      >
        
      </button> */}
    </span>
  )
}
