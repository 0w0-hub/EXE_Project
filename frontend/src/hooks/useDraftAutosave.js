import { useEffect, useRef, useState } from 'react'

// TASK-095: key localStorage lưu 1 bản NHÁP GẦN NHẤT tự động ghi lại từ form nhập liệu tạo phòng —
// khác hẳn PRESETS_STORAGE_KEY ('homely_room_presets', TASK-092) là các mẫu do user CHỦ ĐỘNG đặt tên
// và lưu nhiều bản. Draft chỉ giữ đúng 1 bản, tự ghi đè, không cần thao tác của user.
export const DRAFT_STORAGE_KEY = 'homely_room_draft'

const DEFAULT_DEBOUNCE_MS = 900

export function readDraft(key = DRAFT_STORAGE_KEY) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && parsed.form ? parsed : null
  } catch {
    return null
  }
}

function writeDraft(key, form) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ form, savedAt: Date.now() }))
    return true
  } catch {
    // TASK-095: chế độ riêng tư/hết quota localStorage — bỏ qua, không throw, chỉ là không autosave được.
    return false
  }
}

export function clearDraftStorage(key = DRAFT_STORAGE_KEY) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * TASK-095: tự động lưu `form` vào localStorage sau debounce (mặc định ~900ms) kể từ lần thay đổi gần
 * nhất, tránh ghi liên tục từng phím. KHÔNG ghi ở lần render đầu tiên (mount) — tránh việc mount lại với
 * form rỗng/điền sẵn từ template ghi đè ngay bản nháp cũ đang có sẵn trong localStorage trước khi banner
 * khôi phục (ở RoomNew.jsx) kịp đọc nó. `status`: 'idle' (chưa gõ gì trong phiên) | 'saving' | 'saved'.
 */
export function useDraftAutosave(form, options = {}) {
  const { key = DRAFT_STORAGE_KEY, delay = DEFAULT_DEBOUNCE_MS, enabled = true } = options
  const [status, setStatus] = useState('idle')
  const timerRef = useRef(null)
  const skippedFirstRun = useRef(false)

  useEffect(() => {
    if (!enabled) return undefined

    if (!skippedFirstRun.current) {
      skippedFirstRun.current = true
      return undefined
    }

    setStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const ok = writeDraft(key, form)
      setStatus(ok ? 'saved' : 'idle')
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, enabled, key, delay])

  function clearDraft() {
    if (timerRef.current) clearTimeout(timerRef.current)
    clearDraftStorage(key)
    setStatus('idle')
  }

  return { status, clearDraft }
}
