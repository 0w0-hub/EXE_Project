import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { assetApi, designApi, roomApi, usageApi } from '../services/api'
import { slugify } from '../lib/slug'
import RoomPresetBar from '../components/RoomPresetBar'
import DraftIndicator from '../components/DraftIndicator'
import { useDraftAutosave, readDraft, DRAFT_STORAGE_KEY } from '../hooks/useDraftAutosave'
import useDocumentTitle from '../hooks/useDocumentTitle'
import roomTipPhoto from '../assets/roomnew-tip-photo.jpg'

const ROOM_TYPE_OPTIONS = [
  { label: 'Phòng khách' },
  { label: 'Phòng ngủ' },
  { label: 'Phòng bếp' },
  { label: 'Phòng làm việc' },
  { label: 'Phòng tắm' },
]

const STYLE_OPTIONS = ['Scandinavian', 'Japandi', 'Modern', 'Industrial', 'Minimalist', 'Bohemian']

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function validatePhotoFile(file) {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return 'File không hợp lệ — chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WEBP.'
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return `Ảnh quá lớn (${formatFileSize(file.size)}) — kích thước tối đa cho phép là 10 MB.`
  }
  return null
}

function isFormEmpty(f) {
  return (
    !f.roomType &&
    !f.widthMeters &&
    !f.lengthMeters &&
    !f.style &&
    !f.preferredColors &&
    !f.desiredFurniture &&
    !f.budget &&
    !f.freeTextRequest
  )
}

function buildDefaultForm(template) {
  return {
    roomType: template?.roomType || '',
    widthMeters: '',
    lengthMeters: '',
    style: template?.style || '',
    preferredColors: template?.preferredColors || '',
    desiredFurniture: template?.desiredFurniture || '',
    budget: template?.suggestedBudget ? String(template.suggestedBudget) : '',
    freeTextRequest: '',
  }
}

function isFormDefault(f, defaults) {
  return Object.keys(defaults).every((key) => f[key] === defaults[key])
}

export default function RoomNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const template = location.state?.template
  const [form, setForm] = useState(() => buildDefaultForm(template))
  const defaultFormRef = useRef(buildDefaultForm(template))
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('idle') // idle | creating-room | uploading-photo | saving-preference | generating
  const [usage, setUsage] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const formRef = useRef(null)
  const [invalidCount, setInvalidCount] = useState(0)
  const errorRef = useRef(null)
  const singleLineInputRefs = useRef([])

  const freeTextRequestRef = useRef(null)

  function handleSingleLineEnter(index) {
    return (e) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      const nextInput = singleLineInputRefs.current[index + 1]
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  function handlePasteTrim(field) {
    return (e) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').trim()
      const el = e.target
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? el.value.length
      let newValue = el.value.slice(0, start) + pasted + el.value.slice(end)
      if (el.maxLength >= 0 && newValue.length > el.maxLength) {
        newValue = newValue.slice(0, el.maxLength)
      }
      update(field, newValue)
      const cursorPos = Math.min(start + pasted.length, newValue.length)
      requestAnimationFrame(() => {
        el.setSelectionRange(cursorPos, cursorPos)
      })
    }
  }

  function isFieldChanged(field) {
    return form[field] !== defaultFormRef.current[field]
  }

  function canResetToDefault(field) {
    return isFieldChanged(field) && !!defaultFormRef.current[field]
  }

  useDocumentTitle('Tạo phòng mới')

  const { status: draftStatus, clearDraft } = useDraftAutosave(form)
  const [draftBanner, setDraftBanner] = useState(null)

  useEffect(() => {
    usageApi.me().then(setUsage).catch(() => {})
  }, [])

  useEffect(() => {
    const formEl = formRef.current
    if (!formEl) return undefined
    function handleNativeInvalid() {
      setInvalidCount(formEl.querySelectorAll(':invalid').length)
    }
    formEl.addEventListener('invalid', handleNativeInvalid, true)
    return () => formEl.removeEventListener('invalid', handleNativeInvalid, true)
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null)
      return undefined
    }
    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  useEffect(() => {
    const draft = readDraft(DRAFT_STORAGE_KEY)
    if (draft && isFormEmpty(form)) {
      setDraftBanner(draft)
    }
  }, [])

  function handleRestoreDraft() {
    if (draftBanner?.form) {
      setForm((f) => ({ ...f, ...draftBanner.form }))
    }
    setDraftBanner(null)
  }

  function handleDismissDraft() {
    clearDraft()
    setDraftBanner(null)
  }

  function handleClearAll() {
    if (!isFormDefault(form, defaultFormRef.current)) {
      const confirmed = window.confirm(
        'Xoá toàn bộ thông tin đã điền trong form này về mặc định? Hành động này không thể hoàn tác.'
      )
      if (!confirmed) return
    }
    setForm(defaultFormRef.current)
  }

  const limitReached = usage && usage.limit !== null && usage.used >= usage.limit

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function clearField(field, el) {
    update(field, '')
    el?.focus()
  }

  function handlePhotoSelect(file) {
    if (!file) return
    const validationError = validatePhotoFile(file)
    if (validationError) {
      setPhotoError(validationError)
      return
    }
    setPhotoError(null)
    setPhotoFile(file)
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setInvalidCount(0)
    setError(null)
    setSubmitting(true)
    try {
      setStep('creating-room')
      const room = await roomApi.create({
        roomType: form.roomType,
        widthMeters: form.widthMeters ? Number(form.widthMeters) : null,
        lengthMeters: form.lengthMeters ? Number(form.lengthMeters) : null,
      })

      if (photoFile) {
        setStep('uploading-photo')
        const asset = await assetApi.upload(photoFile, 'ROOM_PHOTO')
        await roomApi.attachPhoto(room.id, asset.id)
      }

      setStep('saving-preference')
      const preference = await roomApi.savePreference(room.id, {
        style: form.style || null,
        preferredColors: form.preferredColors || null,
        desiredFurniture: form.desiredFurniture || null,
        budget: form.budget ? Number(form.budget) : null,
        freeTextRequest: form.freeTextRequest || null,
      })

      setStep('generating')
      const job = await designApi.generate(room.id, preference.id)
      clearDraft()
      const slug = slugify([form.roomType, form.style].filter(Boolean).join(' '))
      navigate(slug ? `/designs/${job.jobId}/${slug}` : `/designs/${job.jobId}`)
    } catch (err) {
      setError(err.message)
      setStep('idle')
    } finally {
      setSubmitting(false)
    }
  }

  const stepLabels = {
    'creating-room': 'Đang lưu thông tin phòng...',
    'uploading-photo': 'Đang upload ảnh phòng...',
    'saving-preference': 'Đang lưu sở thích của bạn...',
    generating: 'Đang gửi yêu cầu cho AI...',
  }

  const STEP_ORDER = ['creating-room', 'uploading-photo', 'saving-preference', 'generating']
  const STEP_TITLES = {
    'creating-room': '1. Thông tin phòng',
    'uploading-photo': '2. Ảnh hiện trạng',
    'saving-preference': '3. Phong cách & ngân sách',
    generating: '4. Gửi yêu cầu AI',
  }
  const currentStepIndex = STEP_ORDER.indexOf(step)

  return (
    <div className="card room-new-page">
      <h2>Tạo phòng mới & yêu cầu AI thiết kế</h2>
      {template && (
        <p className="text-muted">Đã điền sẵn theo mẫu "{template.style || template.roomType}" — bạn có thể chỉnh lại trước khi gửi.</p>
      )}

      <p className="text-muted">Chỉ <strong>Loại phòng</strong> là bắt buộc — mọi thông tin khác đều tuỳ chọn, điền càng nhiều AI càng thiết kế sát ý bạn.</p>

      {draftBanner && (
        <div className="card card--warning">
          <p style={{ margin: 0 }}>Bạn có bản nháp chưa hoàn thành từ lần trước.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={handleRestoreDraft}>Khôi phục</button>
            <button type="button" className="secondary" onClick={handleDismissDraft}>Bỏ qua</button>
          </div>
        </div>
      )}

      {submitting && (
        <div className="step-indicator">
          {STEP_ORDER.map((s, idx) => (
            <div
              key={s}
              className={`step-indicator__item ${
                idx === currentStepIndex ? 'is-active' : idx < currentStepIndex ? 'is-done' : ''
              }`}
            >
              {STEP_TITLES[s]}
            </div>
          ))}
        </div>
      )}

      {limitReached && (
        <div className="card card--warning">
          <p style={{ margin: 0 }}>
            Bạn đã dùng hết {usage.limit} lượt tạo thiết kế trong gói hiện tại tháng này.
            Vui lòng chờ tháng sau hoặc nâng cấp gói.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} ref={formRef}>
        {invalidCount > 0 && (
          <div className="card card--warning" role="alert">
            <p style={{ margin: 0 }}>Vui lòng kiểm tra {invalidCount} mục</p>
          </div>
        )}

        <RoomPresetBar form={form} onApply={(preset) => setForm((f) => ({ ...f, ...preset }))} />

        <div className="form-group">
          <label>Loại phòng *</label>
          <div className="type-card-row">
            {ROOM_TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.label}
                className={`type-card ${form.roomType === opt.label ? 'is-active' : ''}`}
                onClick={() => update('roomType', opt.label)}
                role="button"
              >
                <span className="type-card-icon">{opt.icon}</span>
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
          <input required value={form.roomType} onChange={(e) => update('roomType', e.target.value)}
                 placeholder="Phòng khách, Phòng ngủ, Phòng bếp..."
                 ref={(el) => (singleLineInputRefs.current[0] = el)}
                 onKeyDown={handleSingleLineEnter(0)} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>
              Chiều rộng (m)
              {isFieldChanged('widthMeters') && <span className="field-changed-badge">Đã chỉnh</span>}
              {canResetToDefault('widthMeters') && (
                <button type="button" className="field-reset-default-btn"
                        onClick={() => update('widthMeters', defaultFormRef.current.widthMeters)}>
                  Về mặc định
                </button>
              )}
            </label>
            <input type="number" step="0.1" min="1" max="20" value={form.widthMeters}
                   onChange={(e) => update('widthMeters', e.target.value)}
                   ref={(el) => (singleLineInputRefs.current[1] = el)}
                   onKeyDown={handleSingleLineEnter(1)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>
              Chiều dài (m)
              {isFieldChanged('lengthMeters') && <span className="field-changed-badge">Đã chỉnh</span>}
              {canResetToDefault('lengthMeters') && (
                <button type="button" className="field-reset-default-btn"
                        onClick={() => update('lengthMeters', defaultFormRef.current.lengthMeters)}>
                  Về mặc định
                </button>
              )}
            </label>
            <input type="number" step="0.1" min="1" max="20" value={form.lengthMeters}
                   onChange={(e) => update('lengthMeters', e.target.value)}
                   ref={(el) => (singleLineInputRefs.current[2] = el)}
                   onKeyDown={handleSingleLineEnter(2)} />
          </div>
        </div>

        <div className="form-group">
          <label>Ảnh phòng hiện tại</label>
          <div className="dropzone-row">
            {photoFile ? (
              <div
                className="dropzone"
                style={{ flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', cursor: 'default', gap: 10, padding: 12 }}
              >
                <img
                  src={photoPreviewUrl}
                  alt="Ảnh xem trước phòng đã chọn"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 6, background: 'var(--color-neutral)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  <span>{photoFile.name}</span>
                  <span className="text-muted">{formatFileSize(photoFile.size)}</span>
                </div>
                <button type="button" className="secondary" onClick={handleRemovePhoto}>
                   Bỏ ảnh
                </button>
              </div>
            ) : (
              <label
                className={`dropzone ${dragOver ? 'is-dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  handlePhotoSelect(file)
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handlePhotoSelect(e.target.files?.[0] ?? null)
                    // Cho phép chọn lại đúng file cũ sau khi "Bỏ ảnh" (onChange không bắn lại nếu value không đổi).
                    e.target.value = ''
                  }}
                />
                Kéo-thả ảnh vào đây, hoặc bấm để chọn tệp
              </label>
            )}
            <div className="dropzone-tip">
              <img src={roomTipPhoto} alt="Ví dụ ảnh chụp phòng đẹp" />
              <span>Mẹo: chụp ảnh sáng, thẳng góc để AI phân tích chính xác hơn</span>
            </div>
          </div>
          {photoError && <p className="error-text">{photoError}</p>}
        </div>

        <div className="form-group">
          <label>
            Phong cách mong muốn
            {isFieldChanged('style') && <span className="field-changed-badge">Đã chỉnh</span>}
            {canResetToDefault('style') && (
              <button type="button" className="field-reset-default-btn"
                      onClick={() => update('style', defaultFormRef.current.style)}>
                Về mặc định
              </button>
            )}
          </label>
          <div className="style-chip-row">
            {STYLE_OPTIONS.map((opt) => (
              <div
                key={opt}
                className={`style-chip ${form.style === opt ? 'is-active' : ''}`}
                onClick={() => update('style', opt)}
                role="button"
              >
                {opt}
              </div>
            ))}
          </div>
          <div className="field-with-clear">
            <input value={form.style} onChange={(e) => update('style', e.target.value)}
                   onPaste={handlePasteTrim('style')}
                   placeholder="Scandinavian, Japandi, Hiện đại tối giản..."
                   maxLength={500}
                   ref={(el) => (singleLineInputRefs.current[3] = el)}
                   onKeyDown={handleSingleLineEnter(3)} />
            {form.style && (
              <button type="button" className="field-clear-btn" aria-label="Xoá phong cách mong muốn"
                      onClick={() => clearField('style', singleLineInputRefs.current[3])}>
                x
              </button>
            )}
          </div>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.style.length}/500 ký tự</span>
        </div>

        <div className="form-group">
          <label>
            Màu sắc mong muốn
            {isFieldChanged('preferredColors') && <span className="field-changed-badge">Đã chỉnh</span>}
            {canResetToDefault('preferredColors') && (
              <button type="button" className="field-reset-default-btn"
                      onClick={() => update('preferredColors', defaultFormRef.current.preferredColors)}>
                 Về mặc định
              </button>
            )}
          </label>
          <div className="field-with-clear">
            <input value={form.preferredColors} onChange={(e) => update('preferredColors', e.target.value)}
                   onPaste={handlePasteTrim('preferredColors')}
                   placeholder="Trắng, xanh pastel..."
                   maxLength={500}
                   ref={(el) => (singleLineInputRefs.current[4] = el)}
                   onKeyDown={handleSingleLineEnter(4)} />
            {form.preferredColors && (
              <button type="button" className="field-clear-btn" aria-label="Xoá màu sắc mong muốn"
                      onClick={() => clearField('preferredColors', singleLineInputRefs.current[4])}>
                x
              </button>
            )}
          </div>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.preferredColors.length}/500 ký tự</span>
        </div>

        <div className="form-group">
          <label>
            Nội thất mong muốn
            {isFieldChanged('desiredFurniture') && <span className="field-changed-badge">Đã chỉnh</span>}
            {canResetToDefault('desiredFurniture') && (
              <button type="button" className="field-reset-default-btn"
                      onClick={() => update('desiredFurniture', defaultFormRef.current.desiredFurniture)}>
                Về mặc định
              </button>
            )}
          </label>
          <div className="field-with-clear">
            <input value={form.desiredFurniture} onChange={(e) => update('desiredFurniture', e.target.value)}
                   onPaste={handlePasteTrim('desiredFurniture')}
                   placeholder="Muốn giữ sofa cũ, muốn thêm bàn làm việc..."
                   maxLength={1000}
                   ref={(el) => (singleLineInputRefs.current[5] = el)}
                   onKeyDown={handleSingleLineEnter(5)} />
            {form.desiredFurniture && (
              <button type="button" className="field-clear-btn" aria-label="Xoá nội thất mong muốn"
                      onClick={() => clearField('desiredFurniture', singleLineInputRefs.current[5])}>
                x
              </button>
            )}
          </div>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.desiredFurniture.length}/1000 ký tự</span>
        </div>

        <div className="form-group">
          <label>
            Ngân sách dự kiến (VNĐ)
            {isFieldChanged('budget') && <span className="field-changed-badge">Đã chỉnh</span>}
            {canResetToDefault('budget') && (
              <button type="button" className="field-reset-default-btn"
                      onClick={() => update('budget', defaultFormRef.current.budget)}>
                Về mặc định
              </button>
            )}
          </label>
          <div className="field-with-clear">
            <input type="number" value={form.budget} onChange={(e) => update('budget', e.target.value)}
                   placeholder="30000000"
                   ref={(el) => (singleLineInputRefs.current[6] = el)}
                   onKeyDown={handleSingleLineEnter(6)} />
            {form.budget && (
              <button type="button" className="field-clear-btn" aria-label="Xoá ngân sách dự kiến"
                      onClick={() => clearField('budget', singleLineInputRefs.current[6])}>
                x
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>
            Yêu cầu thêm (mô tả tự do)
            {isFieldChanged('freeTextRequest') && <span className="field-changed-badge">Đã chỉnh</span>}
            {canResetToDefault('freeTextRequest') && (
              <button type="button" className="field-reset-default-btn"
                      onClick={() => update('freeTextRequest', defaultFormRef.current.freeTextRequest)}>
                Về mặc định
              </button>
            )}
          </label>
          <div className="field-with-clear">
            <textarea rows={3} value={form.freeTextRequest}
                      onChange={(e) => update('freeTextRequest', e.target.value)}
                      onPaste={handlePasteTrim('freeTextRequest')}
                      placeholder="Bất kỳ điều gì bạn muốn AI biết thêm..."
                      maxLength={2000}
                      ref={freeTextRequestRef} />
            {form.freeTextRequest && (
              <button type="button" className="field-clear-btn" aria-label="Xoá yêu cầu thêm"
                  onClick={() => clearField('freeTextRequest', freeTextRequestRef.current)}>
                x
              </button>
            )}
          </div>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.freeTextRequest.length}/2000 ký tự</span>
        </div>

        {error && <p ref={errorRef} className="error-text">{error}</p>}

        <div className="room-new-submit-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" disabled={submitting || limitReached}>
            {submitting ? stepLabels[step] || 'Đang xử lý...' : 'Gửi yêu cầu AI thiết kế'}
          </button>
          <button type="button" className="secondary" onClick={handleClearAll} disabled={submitting}>
            Xoá thiết lập
          </button>
          <DraftIndicator status={draftStatus} />
        </div>
      </form>
    </div>
  )
}
