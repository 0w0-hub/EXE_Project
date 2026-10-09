import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assetApi, designApi, roomApi, shareApi } from '../services/api'
import { buildIcsContent, downloadIcsFile } from '../lib/icsExport'
import { slugify } from '../lib/slug'
import DesignHealthCheck from '../components/DesignHealthCheck'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useEscapeKey from '../hooks/useEscapeKey'

const Room3DViewer = lazy(() => import('../components/Room3DViewer'))

const POLL_INTERVAL_MS = 2000
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED']


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
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDescription, setReminderDescription] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderError, setReminderError] = useState(null)
  const [techInfoOpen, setTechInfoOpen] = useState(false)
  const [jobIdCopied, setJobIdCopied] = useState(false)
  const [noteValue, setNoteValue] = useState('')
  const [noteSaveError, setNoteSaveError] = useState(null)
  const [originalPhotoLightboxOpen, setOriginalPhotoLightboxOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const skipNameBlurSaveRef = useRef(false)
  const timerRef = useRef(null)

  useEscapeKey(originalPhotoLightboxOpen, () => setOriginalPhotoLightboxOpen(false))

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

  useEffect(() => {
    setNoteValue(job?.note || '')
  }, [job?.jobId])

  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.roomId) return
    let cancelled = false
    roomApi.get(job.roomId).then((data) => {
      if (!cancelled) setRoom(data)
    }).catch(() => {
    })
    return () => {
      cancelled = true
    }
  }, [job?.status, job?.roomId])

  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.roomId || !job.preferenceId) return
    let cancelled = false
    roomApi.getPreference(job.roomId, job.preferenceId).then((data) => {
      if (!cancelled) setPreference(data)
    }).catch(() => {
    })
    return () => {
      cancelled = true
    }
  }, [job?.status, job?.roomId, job?.preferenceId])

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

  function handleCopyJobId() {
    navigator.clipboard.writeText(job.jobId).then(() => {
      setJobIdCopied(true)
      setTimeout(() => setJobIdCopied(false), 2000)
    }).catch(() => {})
  }

  function handleDownloadOriginalPhoto() {
    if (!beforeUrl) return
    const roomSlug = slugify(room?.roomType) || 'phong'
    const dateStr = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.download = `homely-goc-${roomSlug}-${dateStr}.jpg`
    link.href = beforeUrl
    link.click()
  }

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

  function startEditingName() {
    setNameValue(job.customName || '')
    setEditingName(true)
  }

  function cancelEditingName() {
    skipNameBlurSaveRef.current = true
    setEditingName(false)
    setNameValue('')
  }

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
    <div className="design-result-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <div className="no-print design-actions">
            <button type="button" className="secondary" onClick={handleShare}>
              {shareCopied ? 'Đã sao chép liên kết!' : ' Chia sẻ'}
            </button>
            <button type="button" className="secondary" onClick={handlePublicShare} disabled={publicShareState === 'loading'}>
              {publicShareState === 'copied' && 'Đã sao chép liên kết công khai!'}
              {publicShareState === 'error' && 'Lỗi, thử lại'}
              {(publicShareState === 'idle' || publicShareState === 'loading') && ' Tạo link chia sẻ công khai (xem + góp ý)'}
            </button>
            <button type="button" className="secondary" onClick={() => window.print()}>
              In / Xuất PDF
            </button>
            <button type="button" className="secondary" onClick={() => navigate(`/designs/${job.jobId}/summary`)}>
              Tóm tắt để in
            </button>
            <button type="button" className="secondary" onClick={handleDuplicate} disabled={duplicateState === 'loading'}>
              {duplicateState === 'error' ? 'Lỗi, thử lại' : '⧉ Nhân bản để thử nghiệm'}
            </button>
            <button type="button" className="secondary" onClick={handleToggleReminderForm}>
              Đặt lịch nhắc
            </button>
          </div>
        )}
      </div>

      {job.status === 'COMPLETED' && job.result && showReminderForm && (
        <div className="card no-print" style={{ marginTop: 12 }}>
          <h4 style={{ marginTop: 0 }}>Đặt lịch nhắc việc</h4>
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
              <button type="button" className="secondary no-print" onClick={handleDownloadOriginalPhoto}>
                Tải ảnh gốc
              </button>
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

          <h3 className="no-print" id="room-3d-viewer">Không gian 3D</h3>
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
                    <span className="requirement-item__icon"></span>
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

      <div className="card no-print" style={{ marginTop: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="design-quick-note">Ghi chú nhanh</label>
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

      <div className="card no-print" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="secondary"
          onClick={() => setTechInfoOpen((prev) => !prev)}
          style={{ width: '100%', textAlign: 'left' }}
        >
          {techInfoOpen ? '▾' : '▸'} Thông tin kỹ thuật
        </button>
        {techInfoOpen && (
          <div style={{ marginTop: 12 }}>
            <div className="form-group">
              <label>Mã thiết kế (Job ID)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <code>{job.jobId}</code>
                <button type="button" className="secondary" onClick={handleCopyJobId}>
                  {jobIdCopied ? 'Đã sao chép!' : 'Sao chép'}
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
