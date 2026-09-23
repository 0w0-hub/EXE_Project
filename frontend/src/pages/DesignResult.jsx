import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assetApi, designApi, roomApi, shareApi } from '../services/api'
import { buildIcsContent, downloadIcsFile } from '../lib/icsExport'
import { slugify } from '../lib/slug'
import DesignHealthCheck from '../components/DesignHealthCheck'
import useDocumentTitle from '../hooks/useDocumentTitle'
// TASK-123 (Phần B): cùng hook dùng chung mà Room3DViewer.jsx dùng cho các menu đóng-bằng-Esc — tái
// dùng để lightbox ảnh phòng gốc đóng được bằng Esc mà không cần focus thủ công vào overlay.
import useEscapeKey from '../hooks/useEscapeKey'

// TASK-089: lazy-load three.js/Room3DViewer — tách khỏi bundle chính vì đây là trang duy nhất dùng 3D.
const Room3DViewer = lazy(() => import('../components/Room3DViewer'))

const POLL_INTERVAL_MS = 2000
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED']

/**
 * State machine tiến trình generation: PENDING -> PROCESSING -> COMPLETED | FAILED.
 * Xem rules/frontend/state-management.md — không để loading vô hạn, luôn hiển thị trạng thái rõ ràng.
 */
const CATEGORY_LABELS = { seating: 'Ghế/sofa', table: 'Bàn', lighting: 'Đèn', storage: 'Tủ/kệ lưu trữ' }
const CATEGORY_COLORS = {
  seating: 'var(--color-primary)',
  table: 'var(--color-secondary)',
  lighting: 'var(--color-accent)',
  storage: 'var(--color-support)',
}
const FALLBACK_CATEGORY_COLOR = 'var(--color-neutral-text)'

export default function DesignResult() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [preference, setPreference] = useState(null)
  const [beforeUrl, setBeforeUrl] = useState(null)
  const [afterUrl, setAfterUrl] = useState(null)
  const [comparePercent, setComparePercent] = useState(50)
  const [shareCopied, setShareCopied] = useState(false)
  const [publicShareState, setPublicShareState] = useState('idle') // idle | loading | copied | error
  const [duplicateState, setDuplicateState] = useState('idle') // idle | loading | error
  // TASK-096: form nhắc lịch .ics — inline toggle, không cần modal riêng (đúng phạm vi task).
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDescription, setReminderDescription] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderError, setReminderError] = useState(null)
  // TASK-115: khối "Thông tin kỹ thuật" (Job ID/Room ID để báo lỗi/hỗ trợ) — thu gọn mặc định,
  // đặt cuối trang, không làm rối các khối chính hiện có.
  const [techInfoOpen, setTechInfoOpen] = useState(false)
  const [jobIdCopied, setJobIdCopied] = useState(false)
  // TASK-123 (Phần A): Ghi chú nhanh (Quick Notes) — ô nhập inline, lưu qua onBlur (đúng pattern
  // TASK-046/TASK-106, không gọi API mỗi phím gõ). noteSaveError chỉ hiển thị lỗi tạm thời, không
  // chặn thao tác khác trên trang.
  const [noteValue, setNoteValue] = useState('')
  const [noteSaveError, setNoteSaveError] = useState(null)
  // TASK-123 (Phần B): lightbox ảnh phòng GỐC trong khối Trước/Sau (TASK-015) — tách biệt hoàn toàn
  // với imageLightboxOpen của Room3DViewer.jsx (đó là ảnh AI, đây là ảnh gốc).
  const [originalPhotoLightboxOpen, setOriginalPhotoLightboxOpen] = useState(false)
  // TASK-134: đổi tên nhanh ngay tại tiêu đề trang (khác Ghi chú nhanh TASK-123 Phần A ở trên) — cùng
  // pattern startEditingName/cancelEditingName/saveEditingName ở Projects.jsx (editingJobId/editingValue),
  // nhưng chỉ có 1 job trên trang này nên không cần theo dõi jobId đang sửa, chỉ cần cờ bật/tắt.
  // skipNextBlurSaveRef: Esc huỷ sửa KHÔNG được kích hoạt lưu qua onBlur theo sau (input mất focus khi
  // unmount) — copy đúng cơ chế của Projects.jsx.
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const skipNameBlurSaveRef = useRef(false)
  const timerRef = useRef(null)

  useEscapeKey(originalPhotoLightboxOpen, () => setOriginalPhotoLightboxOpen(false))

  // TASK-120: tiêu đề tab theo loại phòng + phong cách của thiết kế đang xem — dùng dữ liệu đã fetch
  // sẵn (room.roomType, preference.style), không gọi thêm API. Chưa load xong (room/preference còn
  // null) thì dùng tiêu đề mặc định tạm thời cho tới khi có dữ liệu thật.
  const pageTitle =
    room?.roomType && preference?.style
      ? `${room.roomType} · ${preference.style}`
      : room?.roomType || preference?.style || 'Kết quả thiết kế'
  useDocumentTitle(pageTitle)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await designApi.getJob(jobId)
        if (cancelled) return
        setJob(data)
        if (!TERMINAL_STATUSES.includes(data.status)) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [jobId])

  // TASK-123 (Phần A): khởi tạo ô ghi chú từ note thật của job — CHỈ khi đổi sang job khác (dependency
  // job?.jobId, không phải toàn bộ `job`), tránh việc poll 2s/lần (xem useEffect ở trên) ghi đè nội
  // dung user đang gõ dở trước khi họ kịp blur để lưu.
  useEffect(() => {
    setNoteValue(job?.note || '')
  }, [job?.jobId])

  // Lấy kích thước phòng (width/length) để dựng scene 3D đúng tỉ lệ — chỉ cần khi đã có kết quả.
  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.roomId) return
    let cancelled = false
    roomApi.get(job.roomId).then((data) => {
      if (!cancelled) setRoom(data)
    }).catch(() => {
      // Không chặn hiển thị kết quả nếu lấy room thất bại — 3D viewer dùng fallback kích thước mặc định.
    })
    return () => {
      cancelled = true
    }
  }, [job?.status, job?.roomId])

  // Sở thích thật đã lưu lúc tạo phòng (TASK-011) — dùng cho khối ngân sách + checklist yêu cầu.
  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.roomId || !job.preferenceId) return
    let cancelled = false
    roomApi.getPreference(job.roomId, job.preferenceId).then((data) => {
      if (!cancelled) setPreference(data)
    }).catch(() => {
      // Không có preference (job cũ trước TASK-011) — bỏ qua, các khối phụ thuộc sẽ tự ẩn.
    })
    return () => {
      cancelled = true
    }
  }, [job?.status, job?.roomId, job?.preferenceId])

  // Ảnh trước (room.photoAssetId) / sau (job.result.resultAssetId) cho khối so sánh — dữ liệu đã có sẵn,
  // chỉ fetch thêm để hiển thị song song (Room3DViewer chỉ dùng ảnh "sau" cho tab 2D riêng của nó).
  useEffect(() => {
    if (!room?.photoAssetId) {
      setBeforeUrl(null)
      return undefined
    }
    let objectUrl
    assetApi.fetchObjectUrl(room.photoAssetId).then((url) => {
      objectUrl = url
      setBeforeUrl(url)
    }).catch(() => setBeforeUrl(null))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [room?.photoAssetId])

  useEffect(() => {
    const resultAssetId = job?.result?.resultAssetId
    if (!resultAssetId) {
      setAfterUrl(null)
      return undefined
    }
    let objectUrl
    assetApi.fetchObjectUrl(resultAssetId).then((url) => {
      objectUrl = url
      setAfterUrl(url)
    }).catch(() => setAfterUrl(null))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [job?.result?.resultAssetId])

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }).catch(() => {})
  }

  // TASK-078: khác hẳn handleShare (copy URL trang nội bộ yêu cầu đăng nhập, TASK-024) — nút này
  // bật share công khai ở backend rồi copy URL /share/{shareToken} xem được không cần tài khoản.
  async function handlePublicShare() {
    setPublicShareState('loading')
    try {
      const data = await shareApi.enable(job.jobId)
      const url = `${window.location.origin}/share/${data.shareToken}`
      await navigator.clipboard.writeText(url)
      setPublicShareState('copied')
      setTimeout(() => setPublicShareState('idle'), 2500)
    } catch (err) {
      setPublicShareState('error')
      setTimeout(() => setPublicShareState('idle'), 2500)
    }
  }

  // TASK-093: nhân bản job hiện tại thành job mới độc lập (không tốn lượt generate trong gói) rồi
  // điều hướng sang trang kết quả của job mới — để user thử phương án khác mà không mất bản gốc.
  async function handleDuplicate() {
    setDuplicateState('loading')
    try {
      const data = await designApi.duplicate(job.jobId)
      navigate(`/designs/${data.jobId}`)
    } catch (err) {
      setDuplicateState('error')
      setTimeout(() => setDuplicateState('idle'), 2500)
    }
  }

  // TASK-096: bật form nhắc lịch, gợi ý sẵn tiêu đề/mô tả từ dữ liệu thật của job đang xem
  // (roomType + decorDescription) — chỉ set lần đầu mở, không ghi đè nếu user đã tự sửa.
  function handleToggleReminderForm() {
    setShowReminderForm((prev) => {
      const next = !prev
      if (next && !reminderTitle && job?.result) {
        const roomTypeLabel = room?.roomType || 'phòng'
        setReminderTitle(`Mua sắm nội thất cho ${roomTypeLabel}`)
        setReminderDescription(job.result.decorDescription || '')
      }
      return next
    })
  }

  function handleDownloadIcs() {
    setReminderError(null)
    try {
      const content = buildIcsContent({ title: reminderTitle, description: reminderDescription, date: reminderDate })
      downloadIcsFile(content)
    } catch (err) {
      setReminderError(err.message)
    }
  }

  // TASK-115: chỉ dùng dữ liệu đã có sẵn trong state `job` — không gọi thêm API. Cùng pattern
  // navigator.clipboard.writeText đã dùng ở handleShare/handlePublicShare trong chính file này.
  function handleCopyJobId() {
    navigator.clipboard.writeText(job.jobId).then(() => {
      setJobIdCopied(true)
      setTimeout(() => setJobIdCopied(false), 2000)
    }).catch(() => {})
  }

  // TASK-127 (Phần B): tải ảnh phòng GỐC (khác ảnh AI 2D/chụp scene 3D đều đã có nút tải từ TASK-024/033/
  // 121) — `beforeUrl` đã là blob object URL có sẵn từ `assetApi.fetchObjectUrl` (effect load ảnh Trước/
  // Sau ở trên), không cần gọi thêm API. Tên file có ý nghĩa, đúng quy ước TASK-125.
  function handleDownloadOriginalPhoto() {
    if (!beforeUrl) return
    const roomSlug = slugify(room?.roomType) || 'phong'
    const dateStr = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.download = `homely-goc-${roomSlug}-${dateStr}.jpg`
    link.href = beforeUrl
    link.click()
  }

  // TASK-123 (Phần A): lưu ghi chú qua onBlur — rỗng/chỉ khoảng trắng thì gửi null để XOÁ ghi chú
  // (đúng pattern saveEditingName ở Projects.jsx cho customName). Đồng bộ lại noteValue từ response
  // thật (backend có thể trim) để ô nhập luôn khớp dữ liệu đã lưu.
  function handleNoteBlur() {
    if (!job) return
    const trimmed = noteValue.trim()
    designApi
      .updateNote(job.jobId, trimmed ? trimmed : null)
      .then((updated) => {
        setJob((prev) => (prev ? { ...prev, note: updated.note } : prev))
        setNoteValue(updated.note || '')
        setNoteSaveError(null)
      })
      .catch((err) => setNoteSaveError(err.message))
  }

  // TASK-134: mở ô nhập inline ngay tại tiêu đề — giá trị khởi tạo là customName hiện có (rỗng nếu
  // chưa đặt, KHÔNG prefill bằng tên gợi ý mặc định vì đó không phải tên user đã gõ) — đúng pattern
  // startEditingName ở Projects.jsx.
  function startEditingName() {
    setNameValue(job.customName || '')
    setEditingName(true)
  }

  function cancelEditingName() {
    skipNameBlurSaveRef.current = true
    setEditingName(false)
    setNameValue('')
  }

  // TASK-134: lưu tên riêng — rỗng/chỉ khoảng trắng thì gửi null để XOÁ tên riêng (quay về tên gợi ý
  // mặc định), đúng pattern saveEditingName ở Projects.jsx. Chỉ cập nhật customName trong state `job`
  // local (không cần load lại cả trang).
  function saveEditingName() {
    const trimmed = nameValue.trim()
    designApi
      .renameJob(job.jobId, trimmed ? trimmed : null)
      .then((updated) => {
        setJob((prev) => (prev ? { ...prev, customName: updated.customName } : prev))
        setEditingName(false)
        setNameValue('')
      })
      .catch((err) => setError(err.message))
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') {
      saveEditingName()
    } else if (e.key === 'Escape') {
      cancelEditingName()
    }
  }

  function handleNameBlur() {
    if (skipNameBlurSaveRef.current) {
      skipNameBlurSaveRef.current = false
      return
    }
    saveEditingName()
  }

  function formatFullDateTime(isoString) {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'medium' })
  }

  if (error) {
    return <p className="error-text">{error}</p>
  }

  if (!job) {
    return <p>Đang tải trạng thái...</p>
  }

  return (
    // TASK-146: className riêng để CSS mobile (@media max-width: 640px trong styles.css) chỉ nhắm vào
    // trang này (vd: giảm padding .card, xếp cột hàng nút hành động) mà không ảnh hưởng các trang khác
    // cũng dùng chung .card/.form-group.
    <div className="design-result-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* TASK-134: đổi tên nhanh ngay tại tiêu đề — thay tiêu đề tĩnh cũ. Click để sửa inline
              (Enter lưu/Esc huỷ), đúng UX pattern Projects.jsx. Tên hiển thị ưu tiên customName; khi
              chưa đặt, dùng tên gợi ý mặc định — DesignJobResponse (API getJob dùng ở trang này) KHÔNG
              có field suggestedName như DesignJobSummaryResponse ở Projects.jsx (thêm field đó là đổi
              backend, ngoài phạm vi task) nên fallback về room?.roomType đã fetch sẵn ở trang này (cùng
              nguồn dữ liệu suggestedName được tính từ đó), rồi cuối cùng về đúng chữ tiêu đề tĩnh cũ. */}
          {editingName ? (
            <input
              type="text"
              autoFocus
              maxLength={200}
              className="design-name-input"
              value={nameValue}
              placeholder="Nhập tên riêng, để trống để dùng tên gợi ý"
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameBlur}
              style={{ fontSize: '1.5rem', fontWeight: 700, padding: '2px 6px', minWidth: 240 }}
            />
          ) : (
            <h2
              onClick={startEditingName}
              title="Nhấn để đổi tên thiết kế"
              style={{ cursor: 'pointer', margin: 0 }}
            >
              {job.customName || room?.roomType || 'Kết quả thiết kế'}
            </h2>
          )}
          <span className={`status-badge status-${job.status}`}>{job.status}</span>
        </div>
        {job.status === 'COMPLETED' && job.result && (
          // TASK-146: đổi từ inline style={{ display: 'flex', gap: 8 }} sang class `design-actions` —
          // inline style có specificity cao hơn CSS thường nên @media mobile không override được nếu
          // giữ inline (xem ghi chú tương tự ở .room3d-mount trong styles.css, dòng ~1115). Rule mặc
          // định của `design-actions` trong CSS giữ ĐÚNG y hệt display:flex; gap:8px để không đổi
          // layout desktop; @media (max-width: 640px) mới thêm riêng cho trang này xếp cột + tap target
          // ~44px trên mobile.
          <div className="no-print design-actions">
            <button type="button" className="secondary" onClick={handleShare}>
              {shareCopied ? 'Đã sao chép liên kết!' : '🔗 Chia sẻ'}
            </button>
            {/* TASK-078: khác nút "Chia sẻ" ở trên (copy URL trang này, yêu cầu đăng nhập) — nút này
                tạo link public /share/{shareToken} xem + góp ý được không cần tài khoản Homely. */}
            <button type="button" className="secondary" onClick={handlePublicShare} disabled={publicShareState === 'loading'}>
              {publicShareState === 'copied' && 'Đã sao chép liên kết công khai!'}
              {publicShareState === 'error' && 'Lỗi, thử lại'}
              {(publicShareState === 'idle' || publicShareState === 'loading') && '🔗 Tạo link chia sẻ công khai (xem + góp ý)'}
            </button>
            <button type="button" className="secondary" onClick={() => window.print()}>
              🖨️ In / Xuất PDF
            </button>
            {/* TASK-108: trang RIÊNG tối giản để in/lưu hồ sơ (bảng nội thất dạng văn bản + yêu cầu
                gốc, không có before/after/3D/biểu đồ) — bổ sung lựa chọn, không thay thế nút trên. */}
            <button type="button" className="secondary" onClick={() => navigate(`/designs/${job.jobId}/summary`)}>
              📋 Tóm tắt để in
            </button>
            {/* TASK-093: nhân bản job COMPLETED sang job mới độc lập để thử phương án khác — không
                đụng bản gốc, không tốn lượt generate trong gói (xem DesignService.duplicateJob). */}
            <button type="button" className="secondary" onClick={handleDuplicate} disabled={duplicateState === 'loading'}>
              {duplicateState === 'error' ? 'Lỗi, thử lại' : '⧉ Nhân bản để thử nghiệm'}
            </button>
            {/* TASK-096: xuất file .ics nhắc lịch (mua sắm/cải tạo) — thuần client-side, không tích
                hợp OAuth Google/Outlook/Apple, chỉ tạo file chuẩn RFC 5545 để user tự import. */}
            <button type="button" className="secondary" onClick={handleToggleReminderForm}>
              📅 Đặt lịch nhắc
            </button>
          </div>
        )}
      </div>

      {job.status === 'COMPLETED' && job.result && showReminderForm && (
        <div className="card no-print" style={{ marginTop: 12 }}>
          <h4 style={{ marginTop: 0 }}>📅 Đặt lịch nhắc việc</h4>
          <div className="form-group">
            <label>Ngày nhắc</label>
            <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tiêu đề</label>
            <input type="text" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea rows={3} value={reminderDescription} onChange={(e) => setReminderDescription(e.target.value)} />
          </div>
          {reminderError && <p className="error-text">{reminderError}</p>}
          <button type="button" className="secondary" onClick={handleDownloadIcs} disabled={!reminderDate}>
            Tải file .ics
          </button>
        </div>
      )}

      {/* TASK-101: cảnh báo chủ động (thiếu ảnh/chưa nội thất/vượt ngân sách) — đặt ngay sau thanh
          hành động đầu trang, trước khối "Trước/Sau", để user thấy trước khi coi thiết kế là "xong". */}
      <DesignHealthCheck job={job} room={room} preference={preference} />

      {job.status === 'PENDING' && <p>Yêu cầu đang trong hàng chờ xử lý...</p>}
      {job.status === 'PROCESSING' && <p>AI đang phân tích phòng và tạo phương án thiết kế...</p>}
      {job.status === 'FAILED' && (
        <div className="card">
          <p className="error-text">Xử lý thất bại: {job.errorMessage || 'Không rõ nguyên nhân'}</p>
        </div>
      )}

      {job.status === 'COMPLETED' && job.result && (
        <div className="card">
          <h3>Phương án decor</h3>
          <p>{job.result.decorDescription}</p>

          {beforeUrl && afterUrl && (
            <>
              <h3>Trước / Sau</h3>
              <div className="compare-slider">
                {/* TASK-123 (Phần B): click ảnh gốc để phóng to toàn màn hình — chỉ khả dụng khi
                    beforeUrl thực sự có ảnh (khối này vốn đã chỉ render khi beforeUrl && afterUrl).
                    KHÔNG đụng ảnh "Sau" (afterUrl) bên dưới — lightbox AI 2D riêng đã có ở Room3DViewer.jsx. */}
                <img
                  src={beforeUrl}
                  alt="Ảnh phòng trước khi thiết kế"
                  style={{ cursor: 'zoom-in' }}
                  onClick={() => setOriginalPhotoLightboxOpen(true)}
                />
                <div className="compare-slider__after" style={{ clipPath: `inset(0 ${100 - comparePercent}% 0 0)` }}>
                  <img src={afterUrl} alt="Ảnh phòng sau khi thiết kế (AI)" />
                </div>
                <span className="compare-slider__label compare-slider__label--after">Sau (AI)</span>
                <span className="compare-slider__label compare-slider__label--before">Trước</span>
              </div>
              <input
                type="range"
                className="compare-slider__range no-print"
                min={0}
                max={100}
                value={comparePercent}
                onChange={(e) => setComparePercent(Number(e.target.value))}
              />
              {/* TASK-127 (Phần B): nút tải riêng ảnh phòng gốc — chỉ hiện khi thực sự có ảnh (nhánh
                  render này vốn đã chỉ chạy khi beforeUrl && afterUrl). */}
              <button type="button" className="secondary no-print" onClick={handleDownloadOriginalPhoto}>
                📥 Tải ảnh gốc
              </button>
              {/* TASK-123 (Phần B): overlay lightbox — cấu trúc/class copy từ Room3DViewer.jsx
                  (~dòng 2517-2528, state imageLightboxOpen) để nhất quán hành vi đóng (click nền +
                  Esc, xem useEscapeKey ở trên). Tách biệt hoàn toàn khỏi Phần A (ghi chú) bên dưới. */}
              {originalPhotoLightboxOpen && beforeUrl && (
                <div
                  className="room3d-lightbox no-print"
                  role="button"
                  tabIndex={0}
                  aria-label="Đóng ảnh phóng to"
                  onClick={() => setOriginalPhotoLightboxOpen(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setOriginalPhotoLightboxOpen(false)}
                >
                  <img src={beforeUrl} alt="Ảnh phòng trước khi thiết kế (phóng to)" />
                </div>
              )}
            </>
          )}

          {/* id dùng để DesignHealthCheck (TASK-101) cuộn tới khi cảnh báo vượt ngân sách — trỏ vào
              khối "Live Budget Guard" (TASK-079) bên trong Room3DViewer ngay bên dưới. */}
          <h3 className="no-print" id="room-3d-viewer">Không gian 3D</h3>
          {/* TASK-036: Room3DViewer tự quản lý no-print bên trong (khối tương tác ẩn khi in, riêng sơ
              đồ mặt bằng 2D luôn có mặt để in được — canvas 3D/ảnh AI không phù hợp in, xem TASK-024). */}
          <Suspense fallback={<p className="page-loading">Đang tải khung nhìn 3D...</p>}>
            <Room3DViewer
              room={room}
              furniture={job.result.furniture}
              colors={job.result.colors}
              resultAssetId={job.result.resultAssetId}
              onRoomResized={setRoom}
              budget={preference?.budget}
            />
          </Suspense>

          <h3>Bố trí</h3>
          <p>{job.result.layoutDescription}</p>

          {(() => {
            const items = [
              preference?.style && { label: 'Phong cách mong muốn', value: preference.style },
              preference?.preferredColors && { label: 'Màu sắc mong muốn', value: preference.preferredColors },
              preference?.desiredFurniture && { label: 'Nội thất mong muốn', value: preference.desiredFurniture },
              preference?.freeTextRequest && { label: 'Yêu cầu thêm', value: preference.freeTextRequest },
            ].filter(Boolean)
            if (items.length === 0) return null
            return (
              <>
                <h3>Yêu cầu đặc thù đã xem xét</h3>
                {items.map((item) => (
                  <div className="requirement-item" key={item.label}>
                    <span className="requirement-item__icon">✓</span>
                    <span><strong>{item.label}:</strong> {item.value}</span>
                  </div>
                ))}
              </>
            )
          })()}

          <h3>Danh sách nội thất</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Loại</th>
                  <th>Vị trí</th>
                  <th>Chi phí ước tính</th>
                </tr>
              </thead>
              <tbody>
                {job.result.furniture?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.position}</td>
                    <td>{item.estimatedCost?.toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Màu sắc</h3>
          <div>
            {job.result.colors?.map((color, idx) => (
              <span key={idx} title={`${color.role}: ${color.colorHex}`}>
                <span className="color-swatch" style={{ background: color.colorHex }} />
              </span>
            ))}
          </div>

          <h3>Chi phí dự kiến</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {job.result.estimatedCost?.toLocaleString('vi-VN')} đ
          </p>

          {(() => {
            const totals = {}
            job.result.furniture?.forEach((item) => {
              const key = item.category || 'khac'
              totals[key] = (totals[key] || 0) + (item.estimatedCost || 0)
            })
            const totalCost = Object.values(totals).reduce((sum, v) => sum + v, 0)
            const categories = Object.entries(totals).filter(([, cost]) => cost > 0)
            if (categories.length === 0 || totalCost <= 0) return null
            return (
              <>
                <h4>Phân bổ theo loại nội thất</h4>
                <div className="budget-breakdown__bar">
                  {categories.map(([category, cost]) => (
                    <div
                      key={category}
                      style={{
                        width: `${(cost / totalCost) * 100}%`,
                        background: CATEGORY_COLORS[category] || FALLBACK_CATEGORY_COLOR,
                      }}
                    />
                  ))}
                </div>
                <div className="budget-breakdown__legend">
                  {categories.map(([category, cost]) => (
                    <span className="budget-breakdown__legend-item" key={category}>
                      <span
                        className="budget-breakdown__dot"
                        style={{ background: CATEGORY_COLORS[category] || FALLBACK_CATEGORY_COLOR }}
                      />
                      {CATEGORY_LABELS[category] || category}: {cost.toLocaleString('vi-VN')} đ (
                      {Math.round((cost / totalCost) * 100)}%)
                    </span>
                  ))}
                </div>
              </>
            )
          })()}

          {preference?.budget > 0 && (
            <>
              <div className="budget-bar">
                <div
                  className={`budget-bar__fill ${job.result.estimatedCost > preference.budget ? 'is-over' : ''}`}
                  style={{ width: `${Math.min(100, (job.result.estimatedCost / preference.budget) * 100)}%` }}
                />
              </div>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                So với ngân sách dự kiến {preference.budget.toLocaleString('vi-VN')} đ —{' '}
                {job.result.estimatedCost > preference.budget
                  ? `vượt ${(job.result.estimatedCost - preference.budget).toLocaleString('vi-VN')} đ`
                  : `còn dư ${(preference.budget - job.result.estimatedCost).toLocaleString('vi-VN')} đ`}
              </p>
            </>
          )}

          <h3>Giải thích của AI</h3>
          <p>{job.result.aiExplanation}</p>
        </div>
      )}

      {/* TASK-123 (Phần A): Ghi chú nhanh (Quick Notes) — khối MỚI, TÁCH BIỆT hoàn toàn khỏi khối
          "Thông tin kỹ thuật" (TASK-115) ngay bên dưới, chỉ đặt gần nhau theo vị trí. Lưu server-side
          (không phải localStorage) qua PATCH /designs/jobs/{jobId}/note, onBlur — không gọi API mỗi
          phím gõ. Không phụ thuộc job.status (hữu ích cả khi job chưa COMPLETED/FAILED). */}
      <div className="card no-print" style={{ marginTop: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="design-quick-note">📝 Ghi chú nhanh</label>
          <input
            id="design-quick-note"
            type="text"
            maxLength={500}
            placeholder="Vd: đổi sofa, xem lại màu tường trước khi chốt..."
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleNoteBlur}
          />
          {noteSaveError && <p className="error-text">{noteSaveError}</p>}
        </div>
      </div>

      {/* TASK-115: khối kỹ thuật để báo lỗi/hỗ trợ — chỉ dữ liệu đã có sẵn trong `job`, không gọi
          thêm API. Đặt cuối trang, thu gọn mặc định, không phụ thuộc job.status (hữu ích cả khi
          FAILED — lúc đó user cần Job ID để báo lỗi nhất). */}
      <div className="card no-print" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="secondary"
          onClick={() => setTechInfoOpen((prev) => !prev)}
          style={{ width: '100%', textAlign: 'left' }}
        >
          {techInfoOpen ? '▾' : '▸'} 🔧 Thông tin kỹ thuật
        </button>
        {techInfoOpen && (
          <div style={{ marginTop: 12 }}>
            <div className="form-group">
              <label>Mã thiết kế (Job ID)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <code>{job.jobId}</code>
                <button type="button" className="secondary" onClick={handleCopyJobId}>
                  {jobIdCopied ? 'Đã sao chép!' : '📋 Sao chép'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Mã phòng (Room ID)</label>
              <code>{job.roomId}</code>
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <span className={`status-badge status-${job.status}`}>{job.status}</span>
            </div>
            <div className="form-group">
              <label>Ngày tạo</label>
              <span>{formatFullDateTime(job.createdAt)}</span>
            </div>
            <div className="form-group">
              <label>Cập nhật gần nhất</label>
              <span>{formatFullDateTime(job.updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
