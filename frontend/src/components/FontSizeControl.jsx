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
    </span>
  )
}
