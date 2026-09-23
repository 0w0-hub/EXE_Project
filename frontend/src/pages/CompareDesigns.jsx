import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { assetApi, designApi, roomApi } from '../services/api'
import RequestError from '../components/RequestError'

const INITIAL_SIDE = { loading: true, error: null, job: null, room: null, preference: null, imageUrl: null }

function formatVnd(value) {
  return typeof value === 'number' ? `${value.toLocaleString('vi-VN')} đ` : '—'
}

function areaOf(room) {
  if (!room?.widthMeters || !room?.lengthMeters) return null
  return room.widthMeters * room.lengthMeters
}

/**
 * TASK-077: tải 1 vế so sánh (job + room + preference + ảnh AI 2D) song song cho jobId truyền vào.
 * Không đụng DesignResult.jsx — tái tạo lại cùng pattern (assetApi.fetchObjectUrl vì endpoint asset
 * cần auth header, <img src="..."> gọi thẳng không gắn được header) trong trang riêng biệt này.
 */
function useDesignSide(jobId) {
  const [state, setState] = useState(INITIAL_SIDE)
  // TASK-129: đổi giá trị này để useEffect bên dưới chạy lại đúng logic load (dùng cho nút "Thử lại"
  // của RequestError trong CompareColumn) — không viết lại logic fetch riêng.
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!jobId) {
      setState({ ...INITIAL_SIDE, loading: false, error: 'Thiếu jobId trong đường dẫn.' })
      return undefined
    }

    let cancelled = false
    let objectUrl = null
    setState(INITIAL_SIDE)

    async function load() {
      try {
        const job = await designApi.getJob(jobId)
        if (cancelled) return

        if (job.status !== 'COMPLETED' || !job.result) {
          setState({
            loading: false,
            error: `Phương án chưa hoàn thành, không thể so sánh (trạng thái: ${job.status}).`,
            job,
            room: null,
            preference: null,
            imageUrl: null,
          })
          return
        }

        const [room, preference] = await Promise.all([
          job.roomId ? roomApi.get(job.roomId).catch(() => null) : Promise.resolve(null),
          job.roomId && job.preferenceId
            ? roomApi.getPreference(job.roomId, job.preferenceId).catch(() => null)
            : Promise.resolve(null),
        ])
        if (cancelled) return

        let imageUrl = null
        if (job.result.resultAssetId) {
          try {
            imageUrl = await assetApi.fetchObjectUrl(job.result.resultAssetId)
            objectUrl = imageUrl
          } catch {
            imageUrl = null
          }
        }
        if (cancelled) return

        setState({ loading: false, error: null, job, room, preference, imageUrl })
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err.message || 'Không tải được phương án này (jobId không tồn tại hoặc không thuộc về bạn).',
            job: null,
            room: null,
            preference: null,
            imageUrl: null,
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [jobId, reloadToken])

  // TASK-129: expose để CompareColumn truyền vào RequestError onRetry — chỉ tải lại đúng vế này
  // (jobId của cột đang lỗi), không đụng vế còn lại.
  function reload() {
    setReloadToken((t) => t + 1)
  }

  return { ...state, reload }
}

function CompareColumn({ label, side }) {
  if (side.loading) {
    return (
      <div className="card">
        <h3 className="compare-col-title">{label}</h3>
        <p>Đang tải...</p>
      </div>
    )
  }

  if (side.error || !side.job) {
    return (
      <div className="card">
        <h3 className="compare-col-title">{label}</h3>
        {/* TASK-129: RequestError (nút "🔄 Thử lại" thủ công) — gọi lại đúng vế (jobId) đang lỗi qua
            side.reload, không đụng vế còn lại. */}
        <RequestError message={side.error || 'Không tải được phương án này.'} onRetry={side.reload} />
      </div>
    )
  }

  const { job, room, preference, imageUrl } = side
  const furnitureCount = job.result?.furniture?.length || 0
  const area = areaOf(room)

  return (
    <div className="card">
      <h3 className="compare-col-title">
        {label} <span className={`status-badge status-${job.status}`}>{job.status}</span>
      </h3>

      {imageUrl ? (
        <img className="compare-col-img" src={imageUrl} alt={`Ảnh AI thiết kế ${label}`} />
      ) : (
        <div className="room-card-photo-placeholder compare-col-img">🖼️</div>
      )}

      <p>
        <strong>Phong cách:</strong> {preference?.style || '—'}
      </p>

      <p style={{ marginBottom: 4 }}>
        <strong>Màu sắc:</strong>
      </p>
      <div style={{ marginBottom: 12 }}>
        {job.result?.colors?.length > 0 ? (
          job.result.colors.map((color, idx) => (
            <span key={idx} title={`${color.role}: ${color.colorHex}`}>
              <span className="color-swatch" style={{ background: color.colorHex }} />
            </span>
          ))
        ) : (
          <span className="text-muted">—</span>
        )}
      </div>

      <p>
        <strong>Số món nội thất:</strong> {furnitureCount}
      </p>
      <p>
        <strong>Chi phí ước tính:</strong> {formatVnd(job.result?.estimatedCost)}
      </p>
      <p>
        <strong>Diện tích phòng:</strong> {area != null ? `${area.toLocaleString('vi-VN')} m²` : '—'}
      </p>

      <Link to={`/designs/${job.jobId}`}>Xem chi tiết →</Link>
    </div>
  )
}

export default function CompareDesigns() {
  const [searchParams] = useSearchParams()
  const jobIdA = searchParams.get('a')
  const jobIdB = searchParams.get('b')
  const sideA = useDesignSide(jobIdA)
  const sideB = useDesignSide(jobIdB)

  if (!jobIdA || !jobIdB) {
    return (
      <div>
        <h2>So sánh phương án thiết kế</h2>
        <div className="card">
          <p className="error-text">
            Thiếu jobId để so sánh. Vào trang <Link to="/projects">Dự án của tôi</Link>, chọn đúng 2 phương án đã
            hoàn thành rồi bấm nút so sánh.
          </p>
        </div>
      </div>
    )
  }

  const bothReady = !sideA.loading && !sideB.loading && !sideA.error && !sideB.error && sideA.job && sideB.job

  return (
    <div>
      <h2>So sánh phương án thiết kế</h2>

      {bothReady &&
        (() => {
          const furnitureA = sideA.job.result.furniture?.length || 0
          const furnitureB = sideB.job.result.furniture?.length || 0
          const costA = sideA.job.result.estimatedCost || 0
          const costB = sideB.job.result.estimatedCost || 0
          const costDiff = costA - costB
          const areaA = areaOf(sideA.room)
          const areaB = areaOf(sideB.room)

          return (
            <div className="compare-diff-card">
              <h3 style={{ marginTop: 0 }}>Khác biệt</h3>
              <p style={{ margin: '4px 0' }}>
                Phương án A có {furnitureA} món, ước tính {formatVnd(costA)}; Phương án B có {furnitureB} món, ước
                tính {formatVnd(costB)}
                {costDiff !== 0 ? (
                  <>
                    {' '}
                    — Phương án A {costDiff > 0 ? 'đắt hơn' : 'rẻ hơn'} {formatVnd(Math.abs(costDiff))} so với
                    Phương án B
                  </>
                ) : (
                  <> — hai phương án chi phí ước tính bằng nhau</>
                )}
                .
              </p>
              {areaA != null && areaB != null && areaA !== areaB && (
                <p style={{ margin: '4px 0' }}>
                  Diện tích phòng khác nhau: A {areaA.toLocaleString('vi-VN')} m², B {areaB.toLocaleString('vi-VN')}{' '}
                  m² (chênh {Math.abs(areaA - areaB).toLocaleString('vi-VN')} m²).
                </p>
              )}
            </div>
          )
        })()}

      <div className="compare-grid">
        <CompareColumn label="Phương án A" side={sideA} />
        <CompareColumn label="Phương án B" side={sideB} />
      </div>
    </div>
  )
}
