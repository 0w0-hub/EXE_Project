import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicShareApi } from '../services/api'
import RequestError from '../components/RequestError'

const CATEGORY_LABELS = { seating: 'Ghế/sofa', table: 'Bàn', lighting: 'Đèn', storage: 'Tủ/kệ lưu trữ' }
export default function SharedDesign() {
  const { shareToken } = useParams()
  const [share, setShare] = useState(null)
  const [comments, setComments] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentForm, setCommentForm] = useState({ authorName: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState(null)

  function loadShare() {
    setLoading(true)
    setError(null)
    Promise.all([publicShareApi.get(shareToken), publicShareApi.listComments(shareToken)])
      .then(([shareData, commentsData]) => {
        setShare(shareData)
        setComments(commentsData)
      })
      .catch((err) => {
        setError(err.status === 404 ? 'Liên kết chia sẻ không tồn tại hoặc đã bị tắt.' : err.message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadShare()
  }, [shareToken])

  async function refreshComments() {
    try {
      const data = await publicShareApi.listComments(shareToken)
      setComments(data)
    } catch {
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault()
    setCommentError(null)
    setSubmitting(true)
    try {
      await publicShareApi.addComment(shareToken, commentForm)
      setCommentForm({ authorName: '', message: '' })
      await refreshComments()
    } catch (err) {
      setCommentError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p>Đang tải...</p>
  }

  if (error) {
    return (
      <div className="shared-design-page">
        <RequestError message={error} onRetry={loadShare} />
      </div>
    )
  }

  if (!share) {
    return null
  }

  const result = share.result

  return (
    <div className="shared-design-page">
      <h2>Phương án thiết kế được chia sẻ</h2>
      <p className="text-muted">
        {share.roomType || 'Phòng'}
        {share.widthMeters && share.lengthMeters ? ` · ${share.widthMeters}m × ${share.lengthMeters}m` : ''}
      </p>

      {!result && (
        <div className="card">
          <p>Phương án này chưa hoàn tất hoặc chưa có dữ liệu để hiển thị.</p>
        </div>
      )}

      {result && (
        <div className="card">
          {result.resultAssetId ? (
            <img
              src={publicShareApi.assetUrl(shareToken)}
              alt="Ảnh thiết kế AI"
              style={{ width: '100%', borderRadius: 12, marginBottom: 16 }}
            />
          ) : (
            <div className="room-card-photo-placeholder" style={{ marginBottom: 16 }}></div>
          )}

          <h3>Phương án decor</h3>
          <p>{result.decorDescription}</p>

          <h3>Bố trí</h3>
          <p>{result.layoutDescription}</p>

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
                {result.furniture?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{CATEGORY_LABELS[item.category] || item.category}</td>
                    <td>{item.position}</td>
                    <td>{item.estimatedCost?.toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Màu sắc</h3>
          <div>
            {result.colors?.map((color, idx) => (
              <span key={idx} title={`${color.role}: ${color.colorHex}`}>
                <span className="color-swatch" style={{ background: color.colorHex }} />
              </span>
            ))}
          </div>

          <h3>Chi phí dự kiến</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{result.estimatedCost?.toLocaleString('vi-VN')} đ</p>

          <h3>Giải thích của AI</h3>
          <p>{result.aiExplanation}</p>
        </div>
      )}

      <div className="card">
        <h3>Góp ý ({comments.length})</h3>
        <form onSubmit={handleSubmitComment}>
          <div className="form-group">
            <label>Tên (không bắt buộc)</label>
            <input
              type="text"
              value={commentForm.authorName}
              onChange={(e) => setCommentForm({ ...commentForm, authorName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Ý kiến của bạn</label>
            <textarea
              required
              maxLength={500}
              value={commentForm.message}
              onChange={(e) => setCommentForm({ ...commentForm, message: e.target.value })}
            />
          </div>
          {commentError && <p className="error-text">{commentError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </form>

        {comments.length === 0 ? (
          <p className="text-muted" style={{ marginTop: 16 }}>Chưa có góp ý nào.</p>
        ) : (
          <ul style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
            {comments.map((c) => (
              <li key={c.id} className="requirement-item" style={{ alignItems: 'flex-start' }}>
                <span>
                  <strong>{c.authorName || 'Ẩn danh'}</strong>
                  <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.8rem' }}>
                    {new Date(c.createdAt).toLocaleString('vi-VN')}
                  </span>
                  <br />
                  {c.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
