import { useState } from 'react'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

// TASK-104: "Admin Data Explorer" — 2 ô tìm kiếm riêng biệt (email user / job ID) để admin tra cứu
// nhanh xuyên bảng "user này có room/job nào" hoặc "job này của ai", thay vì tự đối chiếu ID bằng
// tay giữa /admin/users và /admin/designs. THUẦN READ-ONLY — không có nút sửa/xoá nào ở trang này.

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—'
}

function shortId(id) {
  return id ? `${id.slice(0, 8)}…` : '—'
}

function JobRow({ job }) {
  return (
    <li className="explorer-job-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <span className={`status-badge status-${job.status}`}>{job.status}</span>
      {job.isFavorite && <span title="Yêu thích">⭐</span>}
      <span style={{ fontSize: '0.8rem' }} title={job.id}>{shortId(job.id)}</span>
      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{formatDate(job.createdAt)}</span>
    </li>
  )
}

function RoomBlock({ entry }) {
  const { room, jobs, totalJobCount } = entry
  const hiddenJobCount = totalJobCount - jobs.length
  return (
    <div className="card" style={{ marginTop: 8, marginLeft: 16 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>
        🏠 {room.roomType || 'Chưa đặt tên loại phòng'}{' '}
        <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.85rem' }} title={room.id}>
          ({shortId(room.id)})
        </span>
      </p>
      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '2px 0 8px' }}>
        Tạo lúc {formatDate(room.createdAt)}
      </p>
      {jobs.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Chưa có thiết kế nào.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </ul>
      )}
      {hiddenJobCount > 0 && (
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
          và {hiddenJobCount} job khác
        </p>
      )}
    </div>
  )
}

export default function AdminDataExplorer() {
  const [email, setEmail] = useState('')
  const [userResult, setUserResult] = useState(null)
  const [userError, setUserError] = useState(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userSearched, setUserSearched] = useState(false)

  const [jobId, setJobId] = useState('')
  const [jobResult, setJobResult] = useState(null)
  const [jobError, setJobError] = useState(null)
  const [jobLoading, setJobLoading] = useState(false)
  const [jobSearched, setJobSearched] = useState(false)

  async function handleUserSearch(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setUserLoading(true)
    setUserError(null)
    setUserResult(null)
    setUserSearched(true)
    try {
      const data = await adminApi.explorerUser(trimmed)
      setUserResult(data)
    } catch (err) {
      setUserError(err)
    } finally {
      setUserLoading(false)
    }
  }

  async function handleJobSearch(e) {
    e.preventDefault()
    const trimmed = jobId.trim()
    if (!trimmed) return
    setJobLoading(true)
    setJobError(null)
    setJobResult(null)
    setJobSearched(true)
    try {
      const data = await adminApi.explorerJob(trimmed)
      setJobResult(data)
    } catch (err) {
      setJobError(err)
    } finally {
      setJobLoading(false)
    }
  }

  // Lỗi 403 hiếm khi xảy ra ở đây vì AdminRoute (App.jsx) đã chặn trước — vẫn xử lý fallback đúng
  // pattern các trang admin khác (AdminDashboard/AdminModeration) phòng khi quyền bị thu hồi giữa phiên.
  if (userError?.status === 403 || jobError?.status === 403) {
    return <AccessDenied />
  }

  return (
    <div>
      <h2>Admin — Tra cứu dữ liệu nhanh</h2>
      <p className="text-muted">
        Tra cứu xuyên bảng: tìm 1 user theo email để xem toàn bộ room/job của họ, hoặc tìm 1 job
        theo ID để biết job đó thuộc về ai. Trang này chỉ đọc dữ liệu — không sửa/xoá gì ở đây.
      </p>

      <div className="room-grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Tìm theo email user</h3>
          <form onSubmit={handleUserSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="vd: user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button type="submit" disabled={userLoading || !email.trim()}>
              {userLoading ? 'Đang tìm...' : 'Tìm'}
            </button>
          </form>

          {userError && userError.status !== 403 && (
            <p className={userError.status === 404 ? 'text-muted' : 'error-text'} style={{ marginTop: 12 }}>
              {userError.status === 404 ? 'Không tìm thấy user với email này.' : userError.message}
            </p>
          )}

          {!userError && userSearched && !userLoading && userResult && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}>
                <strong>{userResult.user.email}</strong>{' '}
                <span className={`status-badge ${userResult.user.role === 'ADMIN' ? 'status-COMPLETED' : ''}`}>
                  {userResult.user.role}
                </span>
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: '2px 0 8px' }}>
                {userResult.user.fullName || 'Chưa đặt tên'} · tham gia {formatDate(userResult.user.createdAt)}
              </p>

              {userResult.rooms.length === 0 ? (
                <p className="text-muted">User này chưa tạo room nào.</p>
              ) : (
                userResult.rooms.map((entry) => <RoomBlock key={entry.room.id} entry={entry} />)
              )}
              {userResult.totalRoomCount - userResult.rooms.length > 0 && (
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 8 }}>
                  và {userResult.totalRoomCount - userResult.rooms.length} room khác
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Tìm theo job ID</h3>
          <form onSubmit={handleJobSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="UUID của design job"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button type="submit" disabled={jobLoading || !jobId.trim()}>
              {jobLoading ? 'Đang tìm...' : 'Tìm'}
            </button>
          </form>

          {jobError && jobError.status !== 403 && (
            <p className={jobError.status === 404 ? 'text-muted' : 'error-text'} style={{ marginTop: 12 }}>
              {jobError.status === 404
                ? 'Không tìm thấy job với ID này.'
                : jobError.status === 400
                  ? 'Job ID không hợp lệ (phải là UUID).'
                  : jobError.message}
            </p>
          )}

          {!jobError && jobSearched && !jobLoading && jobResult && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-badge status-${jobResult.job.status}`}>{jobResult.job.status}</span>
                {jobResult.job.isFavorite && <span title="Yêu thích">⭐</span>}
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                Job {jobResult.job.id} · tạo lúc {formatDate(jobResult.job.createdAt)}
              </p>
              <p style={{ margin: '8px 0 0' }}>
                👤 Chủ sở hữu: <strong>{jobResult.ownerEmail}</strong>
              </p>
              <p style={{ margin: '4px 0 0' }}>
                🏠 Room: {jobResult.room.roomType || 'Chưa đặt tên loại phòng'}{' '}
                <span className="text-muted" style={{ fontSize: '0.8rem' }} title={jobResult.room.id}>
                  ({shortId(jobResult.room.id)})
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
