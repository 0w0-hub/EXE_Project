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

// TASK-110: whitelist định dạng ảnh chấp nhận cho ảnh phòng — không chấp nhận SVG (có thể chứa
// script) dù trình duyệt coi SVG là "image/*". Giới hạn dung lượng khớp ĐÚNG
// spring.servlet.multipart.max-file-size: 10MB đã cấu hình ở backend/src/main/resources/application.yml
// (nginx.conf cho phép tới 15MB nhưng backend chặt hơn nên dùng số backend).
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

// TASK-110: format dung lượng file dạng dễ đọc ("X.X MB" / "X KB").
function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// TASK-110: validate THẬT ảnh phòng trước khi cho vào state (accept="image/*" trên input chỉ là
// gợi ý trình duyệt, không chặn thật). Trả về thông báo lỗi (string) nếu không hợp lệ, null nếu hợp lệ.
function validatePhotoFile(file) {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return 'File không hợp lệ — chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WEBP.'
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return `Ảnh quá lớn (${formatFileSize(file.size)}) — kích thước tối đa cho phép là 10 MB.`
  }
  return null
}

// TASK-095: form coi là "rỗng" (user chưa gõ/chọn gì thật trong phiên hiện tại) khi mọi field đều
// rỗng — dùng để quyết định có nên hiện banner khôi phục nháp cũ hay không lúc vừa vào trang.
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

// TASK-149: shape khởi tạo state `form` — tách thành hàm riêng để nút "Xoá thiết lập" tái dùng ĐÚNG
// giá trị mặc định ban đầu (kể cả khi có template điền sẵn từ Templates.jsx), thay vì đoán field/hardcode
// object rỗng khác với lúc mount thật.
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

// TASK-149: form đang khác mặc định (đã có dữ liệu user tự gõ/chọn) hay chưa — dùng để chỉ hiện
// window.confirm khi thật sự có gì để xoá, tránh hỏi vô ích lúc form đang trống/mặc định.
function isFormDefault(f, defaults) {
  return Object.keys(defaults).every((key) => f[key] === defaults[key])
}

/**
 * Input đầy đủ theo docs/project/requirements.md:
 * thông tin phòng + ảnh phòng + sở thích + phong cách + màu sắc + nội thất mong muốn + ngân sách + text tự do.
 * Có thể được điền sẵn từ một mẫu thiết kế (Templates.jsx truyền qua location.state.template).
 */
export default function RoomNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const template = location.state?.template

  const [form, setForm] = useState(() => buildDefaultForm(template))
  // TASK-149: snapshot giá trị mặc định ban đầu — cố định 1 lần lúc mount (useRef, không phụ thuộc
  // form hiện tại), dùng cho nút "Xoá thiết lập" (reset) và check isFormDefault (có nên hỏi xác nhận không).
  const defaultFormRef = useRef(buildDefaultForm(template))
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('idle') // idle | creating-room | uploading-photo | saving-preference | generating
  const [usage, setUsage] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  // TASK-155: ref tới thẻ <form> — dùng để đọc kết quả validate HTML5 gốc của trình duyệt
  // (querySelectorAll(':invalid')), KHÔNG viết engine validate JS mới.
  const formRef = useRef(null)
  // TASK-155: số trường đang :invalid theo Constraint Validation API gốc — hiện dòng tóm tắt
  // "⚠️ Vui lòng kiểm tra N mục" ở đầu form khi > 0.
  const [invalidCount, setInvalidCount] = useState(0)
  // TASK-155: ref tới đoạn hiện lỗi chung (từ catch API) — dùng để scrollIntoView khi lỗi xuất hiện,
  // đặc biệt hữu ích trên mobile khi lỗi nằm dưới khung nhìn hiện tại.
  const errorRef = useRef(null)

  // TASK-153: refs theo đúng thứ tự hiển thị của các input dòng đơn trong form (loại phòng, chiều
  // rộng, chiều dài, phong cách, màu ưa thích, nội thất mong muốn, ngân sách) — dùng để Enter chuyển
  // focus sang input kế tiếp thay vì submit sớm. KHÔNG gồm textarea yêu cầu tự do (Enter phải xuống
  // dòng bình thường) và KHÔNG gồm nút submit (giữ hành vi mặc định).
  const singleLineInputRefs = useRef([])

  // TASK-164: ref riêng cho textarea "Yêu cầu thêm" — KHÔNG nằm trong singleLineInputRefs (Enter phải
  // xuống dòng bình thường theo TASK-153), dùng để focus lại textarea sau khi bấm nút "×" xoá riêng
  // trường này.
  const freeTextRequestRef = useRef(null)

  // TASK-153: onKeyDown dùng chung cho các input dòng đơn ở trên — Enter luôn preventDefault (tránh
  // submit sớm ngoài ý muốn), rồi focus input kế tiếp trong mảng nếu có; nếu đang ở input CUỐI CÙNG
  // thì không focus gì thêm, user phải chủ động bấm nút submit.
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

  // TASK-167: onPaste dùng chung cho các trường văn bản tự do — dán xong TỰ ĐỘNG trim khoảng trắng
  // đầu/cuối nội dung vừa dán (không đụng khoảng trắng ở GIỮA, không ảnh hưởng gõ tay bình thường vì
  // đây là handler RIÊNG cho sự kiện 'paste', tách biệt hẳn onChange). preventDefault trước rồi tự chèn
  // text đã trim vào đúng vị trí con trỏ/vùng đang chọn (thay vì để trình duyệt dán thô rồi trim lại cả
  // chuỗi — cách đó có thể trim mất khoảng trắng hợp lệ user đã gõ tay ở đầu/cuối trước khi dán vào giữa).
  function handlePasteTrim(field) {
    return (e) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').trim()
      const el = e.target
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? el.value.length
      let newValue = el.value.slice(0, start) + pasted + el.value.slice(end)
      // TASK-158: tôn trọng ĐÚNG giới hạn maxLength có sẵn trên input/textarea — bình thường trình duyệt
      // tự chặn maxLength lúc paste thật, nhưng ở đây ta đã preventDefault + tự dựng chuỗi mới nên phải tự
      // cắt bớt thủ công (el.maxLength trả -1 nếu field không khai báo maxLength).
      if (el.maxLength >= 0 && newValue.length > el.maxLength) {
        newValue = newValue.slice(0, el.maxLength)
      }
      update(field, newValue)
      const cursorPos = Math.min(start + pasted.length, newValue.length)
      // Khôi phục vị trí con trỏ sau khi React render lại value mới (setSelectionRange cần chạy SAU khi
      // DOM đã cập nhật, nên đợi 1 tick bằng requestAnimationFrame thay vì gọi ngay đồng bộ ở đây).
      requestAnimationFrame(() => {
        el.setSelectionRange(cursorPos, cursorPos)
      })
    }
  }

  // TASK-167: field nào đang khác giá trị mặc định ban đầu (defaultFormRef.current, TASK-149) — tái
  // dùng THẲNG so sánh có sẵn, không thêm state/tracking mới, dùng để hiện huy hiệu "Đã chỉnh" cạnh label.
  function isFieldChanged(field) {
    return form[field] !== defaultFormRef.current[field]
  }

  // TASK-169: field đang khác mặc định (isFieldChanged) VÀ mặc định đó là giá trị THẬT khác rỗng — chỉ
  // xảy ra khi vào form qua "Áp dụng mẫu" (Templates.jsx → buildDefaultForm(template) điền sẵn
  // style/preferredColors/desiredFurniture/budget từ mẫu). Dùng để hiện hành động "↺ Về mặc định", KHÁC
  // nút "×" (TASK-164, luôn xoá về rỗng): bấm "↺" khôi phục ĐÚNG giá trị mẫu ban đầu thay vì xoá trắng.
  // Khi KHÔNG vào qua mẫu, defaultFormRef.current[field] luôn là '' nên điều kiện này tự động false,
  // tránh 2 nút cùng hiện cạnh nhau mà làm y hệt một việc.
  function canResetToDefault(field) {
    return isFieldChanged(field) && !!defaultFormRef.current[field]
  }

  useDocumentTitle('Tạo phòng mới')

  // TASK-095: autosave form nháp (debounce ~900ms) — key riêng, khác PRESETS_STORAGE_KEY của TASK-092.
  const { status: draftStatus, clearDraft } = useDraftAutosave(form)
  // Snapshot bản nháp cũ đang chờ user quyết định Khôi phục/Bỏ qua — null nghĩa là không hiện banner.
  const [draftBanner, setDraftBanner] = useState(null)

  useEffect(() => {
    usageApi.me().then(setUsage).catch(() => {})
  }, [])

  // TASK-155: đếm số trường :invalid mỗi khi trình duyệt chặn submit vì validate HTML5 (TASK-153's
  // required/min/max) thất bại. Sự kiện `invalid` bắn RIÊNG cho từng field không hợp lệ và KHÔNG bubble
  // (React onInvalid trên <form> sẽ không bắt được) nên phải addEventListener thủ công với capture:true
  // trên chính thẻ form. Đây là lúc DUY NHẤT bắt được "submit thất bại vì validate" — khi form invalid,
  // trình duyệt chặn hẳn sự kiện `submit` (handleSubmit/onSubmit sẽ KHÔNG được gọi), nên không thể đọc
  // checkValidity() bên trong handleSubmit để phát hiện trường hợp bị chặn.
  useEffect(() => {
    const formEl = formRef.current
    if (!formEl) return undefined
    function handleNativeInvalid() {
      setInvalidCount(formEl.querySelectorAll(':invalid').length)
    }
    formEl.addEventListener('invalid', handleNativeInvalid, true)
    return () => formEl.removeEventListener('invalid', handleNativeInvalid, true)
  }, [])

  // TASK-155: cuộn mượt tới dòng lỗi chung (state `error`, set trong catch của handleSubmit) mỗi khi nó
  // đổi từ null sang có giá trị — đặc biệt cần trên mobile khi dòng lỗi nằm dưới khung nhìn hiện tại.
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // TASK-110: ảnh xem trước thật cho photoFile — cùng pattern tạo/revoke object URL trong useEffect
  // như assetApi.fetchObjectUrl đã dùng ở DesignResult.jsx/Dashboard.jsx (tạo trong effect, revoke ở
  // cleanup mỗi khi photoFile đổi hoặc component unmount, tránh rò rỉ bộ nhớ).
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
    // TASK-095: chỉ kiểm tra 1 lần lúc vào trang. Form rỗng ngay lúc mount nghĩa là user chưa gõ/chọn
    // gì thật trong phiên này (kể cả chưa áp dụng template) — an toàn để đề nghị khôi phục nháp cũ.
    const draft = readDraft(DRAFT_STORAGE_KEY)
    if (draft && isFormEmpty(form)) {
      setDraftBanner(draft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleRestoreDraft() {
    if (draftBanner?.form) {
      setForm((f) => ({ ...f, ...draftBanner.form }))
    }
    setDraftBanner(null)
  }

  function handleDismissDraft() {
    // TASK-095: user chủ động bỏ qua → xoá hẳn draft, không tự hiện lại banner ở lần vào tiếp theo.
    clearDraft()
    setDraftBanner(null)
  }

  // TASK-149: "Xoá thiết lập" — reset state `form` (input đang gõ dở trong phiên hiện tại) về mặc định
  // ban đầu. KHÁC banner Khôi phục/Bỏ qua ở trên (đụng bản nháp đã lưu trong localStorage qua
  // useDraftAutosave/clearDraft) — 2 khái niệm tách biệt, nên hàm này CỐ TÌNH không gọi clearDraft():
  // xoá form hiện tại không được phép xoá luôn bản nháp cũ đã lưu trước đó.
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

  // TASK-164: nút "×" xoá RIÊNG 1 trường văn bản — khác hẳn "🧹 Xoá thiết lập" (handleClearAll,
  // TASK-149, xoá TOÀN form). Tái dùng thẳng `update` hiện có rồi focus lại đúng input/textarea đó
  // để user gõ tiếp ngay không cần bấm chuột lại vào ô.
  function clearField(field, el) {
    update(field, '')
    el?.focus()
  }

  // TASK-110: chọn/kéo-thả ảnh phòng — validate THẬT trước khi set vào photoFile (không chỉ dựa vào
  // accept="image/*" của input, vì đó chỉ là gợi ý trình duyệt).
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
    // TASK-155: onSubmit chỉ chạy khi form ĐÃ hợp lệ (trình duyệt tự chặn submit + bắn 'invalid' khi
    // còn field lỗi — xem effect ở trên), nên tới được đây nghĩa là invalidCount chắc chắn phải về 0 —
    // reset để dòng tóm tắt tự ẩn khi user submit lại thành công.
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
      // TASK-095: tạo phòng thành công → không còn lý do giữ nháp của 1 phòng đã tạo xong thật.
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
    // TASK-149: className riêng để CSS mobile (@media max-width: 640px trong styles.css) chỉ nhắm vào
    // trang này (sticky nút hành động chính "Gửi yêu cầu AI thiết kế" khi cuộn) mà không ảnh hưởng các
    // trang khác cũng dùng chung .card — cùng pattern TASK-146 (.design-result-page).
    <div className="card room-new-page">
      <h2>Tạo phòng mới & yêu cầu AI thiết kế</h2>
      {template && (
        <p className="text-muted">Đã điền sẵn theo mẫu "{template.style || template.roomType}" — bạn có thể chỉnh lại trước khi gửi.</p>
      )}

      {/* TASK-161: dòng thông tin TĨNH (không tính toán theo trạng thái form) nhắc rõ chỉ "Loại phòng"
          là bắt buộc (input duy nhất có `required`, khớp @NotBlank roomType ở CreateRoomRequest.java) —
          mọi trường khác đều tuỳ chọn (widthMeters/lengthMeters chỉ có @DecimalMin/@DecimalMax, không
          @NotNull). Đặt ngay dưới tiêu đề trang, trước banner nháp/form, để user thấy trước khi điền. */}
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
        {/* TASK-155: chỉ ĐỌC kết quả Constraint Validation API gốc (đếm :invalid lúc trình duyệt chặn
            submit) — KHÔNG viết engine validate JS mới, KHÔNG thay thế required/min/max của TASK-153. */}
        {invalidCount > 0 && (
          <div className="card card--warning" role="alert">
            <p style={{ margin: 0 }}>⚠️ Vui lòng kiểm tra {invalidCount} mục</p>
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
                  ↺ Về mặc định
                </button>
              )}
            </label>
            {/* TASK-153: KHÔNG `required` — chiều rộng vốn dĩ optional có chủ đích (form tối thiểu chỉ cần
                loại phòng + ảnh, `handleSubmit` gửi `null` khi trống, backend `@DecimalMin`/`@DecimalMax`
                bỏ qua giá trị null theo mặc định Bean Validation) — chỉ giữ `min`/`max` để validate ĐÚNG
                khi user CÓ nhập giá trị, khớp đúng giới hạn thật `CreateRoomRequest.java`. */}
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
                  ↺ Về mặc định
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
                  ✕ Bỏ ảnh
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
                ↺ Về mặc định
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
          {/* TASK-164: .field-with-clear đặt input + nút "×" cạnh nhau trong 1 hàng flex — nút chỉ
              hiện khi form.style đang có nội dung, bấm → clearField('style', ...) rồi focus lại input. */}
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
                ×
              </button>
            )}
          </div>
          {/* TASK-158: đếm ký tự thời gian thực, đọc trực tiếp từ state `form` hiện có — chặn thật ở
              `maxLength` phía trên khớp đúng giới hạn cột DB `style` (500) trong RoomPreference.java. */}
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.style.length}/500 ký tự</span>
        </div>

        <div className="form-group">
          <label>
            Màu sắc mong muốn
            {isFieldChanged('preferredColors') && <span className="field-changed-badge">Đã chỉnh</span>}
            {canResetToDefault('preferredColors') && (
              <button type="button" className="field-reset-default-btn"
                      onClick={() => update('preferredColors', defaultFormRef.current.preferredColors)}>
                ↺ Về mặc định
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
                ×
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
                ↺ Về mặc định
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
                ×
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
                ↺ Về mặc định
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
                ×
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
                ↺ Về mặc định
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
                ×
              </button>
            )}
          </div>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.freeTextRequest.length}/2000 ký tự</span>
        </div>

        {error && <p ref={errorRef} className="error-text">{error}</p>}

        {/* TASK-149: class riêng (thay inline-only) để @media mobile trong styles.css override được
            position (inline style luôn thắng CSS thường bất kể specificity — cùng lý do .design-actions
            đã đổi từ inline sang class ở TASK-146). Base rule (mọi viewport) giữ NGUYÊN hành vi cũ
            display:flex/alignItems:center; chỉ mobile mới thêm position: sticky. */}
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
