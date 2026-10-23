import { useEffect, useRef } from 'react'

// TASK-090: hook dùng chung cho 3 nơi cần đóng bằng phím Esc (NotificationBell, AccountMenu trong
// NavBar.jsx, và OnboardingTour) — tránh lặp lại cùng 1 đoạn useEffect gắn/gỡ listener keydown.
// `active` = false thì không gắn listener (ví dụ dropdown đang đóng). Dùng ref cho callback để
// effect không phải add/remove listener lại mỗi lần component re-render.
export default function useEscapeKey(active, onEscape) {
  const callbackRef = useRef(onEscape)
  callbackRef.current = onEscape

  useEffect(() => {
    if (!active) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        callbackRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active])
}
