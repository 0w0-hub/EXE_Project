import { useState } from 'react'

// TASK-092: key localStorage lưu mảng preset do CHÍNH USER tự lưu lại từ lần nhập form trước đó —
// khác hẳn Templates.jsx (mẫu CỐ ĐỊNH do dự án định nghĩa sẵn, TASK-016), 2 khái niệm không thay thế
// nhau. Mỗi preset lưu snapshot TOÀN BỘ field form hiện có ở RoomNew.jsx (không chỉ 1-2 field), thuần
// client-side, không đồng bộ backend/tài khoản/thiết bị (đúng Out-of-scope task).
const PRESETS_STORAGE_KEY = 'homely_room_presets'

// Dự án chưa từng dùng prompt()/confirm() gốc trình duyệt ở đâu (đã kiểm tra trước khi code) —
// chấp nhận cho MVP theo đúng chỉ dẫn task, không tự xây modal riêng.
function readPresets() {
  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePresets(presets) {
  try {
    window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // TASK-092: nếu không lưu được (chế độ riêng tư/hết quota) vẫn cập nhật state phiên hiện tại,
    // chỉ là không giữ được preset sau khi tải lại trang — chấp nhận được cho MVP.
  }
}

/**
 * TASK-092: thanh preset "mẫu tự lưu" cho RoomNew.jsx — nút lưu snapshot form hiện tại, dải chip áp
 * dụng lại preset đã lưu (bấm để điền lại toàn bộ form, không mất khả năng tự sửa tiếp sau đó, giống
 * hành vi chip chọn nhanh phong cách đã có ở TASK-013), nút xoá riêng từng preset. `form` là state form
 * đầy đủ hiện tại của component cha; `onApply` nhận lại snapshot đã lưu để component cha tự gọi setForm.
 */
export default function RoomPresetBar({ form, onApply }) {
  const [presets, setPresets] = useState(() => readPresets())

  function handleSave() {
    const name = window.prompt('Đặt tên cho mẫu này:', form.roomType || '')
    if (!name || !name.trim()) return
    const preset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      form: { ...form },
    }
    const next = [...presets, preset]
    setPresets(next)
    writePresets(next)
  }

  function handleDelete(id) {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    writePresets(next)
  }

  return (
    <div className="form-group">
      <label>Mẫu tự lưu của bạn</label>
      <div>
        <button type="button" className="secondary" onClick={handleSave}>
          Lưu làm mẫu
        </button>
      </div>

      {presets.length > 0 && (
        <div className="room-preset-row">
          {presets.map((preset) => (
            <div key={preset.id} className="room-preset-chip">
              <span
                className="room-preset-chip-name"
                role="button"
                tabIndex={0}
                onClick={() => onApply(preset.form)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onApply(preset.form)
                }}
                title="Bấm để điền lại form theo mẫu này"
              >
                {preset.name}
              </span>
              <button
                type="button"
                className="room-preset-chip-delete"
                onClick={() => handleDelete(preset.id)}
                aria-label={`Xoá mẫu ${preset.name}`}
                title="Xoá mẫu này"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
