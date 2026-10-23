import { useState } from 'react'

const PRESETS_STORAGE_KEY = 'homely_room_presets'

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
  }
}

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
