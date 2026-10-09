import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { assetApi, designApi, roomApi } from '../services/api'

export default function DesignSummary() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [room, setRoom] = useState(null)
  const [preference, setPreference] = useState(null)
  const [beforeUrl, setBeforeUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    designApi.getJob(jobId).then((data) => {
      if (!cancelled) setJob(data)
    }).catch((err) => {
      if (!cancelled) setError(err.message)
    })
    return () => {
      cancelled = true
    }
  }, [jobId])

  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.roomId) return
    let cancelled = false
    roomApi.get(job.roomId).then((data) => {
      if (!cancelled) setRoom(data)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [job?.status, job?.roomId])

  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.roomId || !job.preferenceId) return
    let cancelled = false
    roomApi.getPreference(job.roomId, job.preferenceId).then((data) => {
      if (!cancelled) setPreference(data)
    }).catch(() => {})
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

  if (error) {
    return <p className="error-text">{error}</p>
  }

  if (!job) {
    return <p>Đang tải...</p>
  }

  if (job.status !== 'COMPLETED' || !job.result) {
    return (
      <div className="card">
        <p>Thiết kế này chưa hoàn tất, chưa có dữ liệu để tóm tắt.</p>
        <Link to={`/designs/${jobId}`}>Xem trạng thái thiết kế</Link>
      </div>
    )
  }

  const requirementItems = [
    preference?.style && { label: 'Phong cách mong muốn', value: preference.style },
    preference?.preferredColors && { label: 'Màu sắc mong muốn', value: preference.preferredColors },
    preference?.desiredFurniture && { label: 'Nội thất mong muốn', value: preference.desiredFurniture },
    preference?.budget > 0 && { label: 'Ngân sách dự kiến', value: `${preference.budget.toLocaleString('vi-VN')} đ` },
    preference?.freeTextRequest && { label: 'Yêu cầu thêm', value: preference.freeTextRequest },
  ].filter(Boolean)

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Link to={`/designs/${jobId}`}>← Quay lại trang kết quả</Link>
        <button type="button" className="secondary" onClick={() => window.print()}>
          In trang tóm tắt
        </button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>
          Tóm tắt thiết kế{room?.roomType ? ` — ${room.roomType}` : ''}
          {preference?.style ? ` (${preference.style})` : ''}
        </h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Ngày tạo: {new Date(job.createdAt).toLocaleDateString('vi-VN')}
        </p>

        <h3>Thông tin phòng</h3>
        {room ? (
          <p>
            Loại phòng: {room.roomType || 'Không rõ'} — Kích thước:{' '}
            {room.widthMeters && room.lengthMeters ? `${room.widthMeters}m x ${room.lengthMeters}m` : 'Chưa cập nhật'}
          </p>
        ) : (
          <p className="text-muted">Không có dữ liệu phòng.</p>
        )}
        {beforeUrl && (
          <img src={beforeUrl} alt="Ảnh phòng gốc" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)' }} />
        )}

        {requirementItems.length > 0 && (
          <>
            <h3>Yêu cầu gốc đã nhập</h3>
            {requirementItems.map((item) => (
              <div className="requirement-item" key={item.label}>
                <span className="requirement-item__icon"></span>
                <span><strong>{item.label}:</strong> {item.value}</span>
              </div>
            ))}
          </>
        )}

        <h3>Phương án decor</h3>
        <p>{job.result.decorDescription}</p>

        <h3>Danh sách nội thất</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Loại</th>
                <th>Chi phí ước tính</th>
              </tr>
            </thead>
            <tbody>
              {job.result.furniture?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.estimatedCost?.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          Tổng chi phí ước tính: {job.result.estimatedCost?.toLocaleString('vi-VN')} đ
        </p>
      </div>
    </div>
  )
}
