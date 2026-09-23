import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import heroImage from '../assets/hero-living-room.jpg'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const mockAuthEnabled = import.meta.env.VITE_MOCK_AUTH === 'true'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-split__form">
        <div className="card" style={{ maxWidth: 420, width: '100%' }}>
          <h2>Tạo tài khoản</h2>
          {mockAuthEnabled && <p className="auth-mock-notice">Chế độ xem UI: thông tin đăng ký chỉ được lưu trong trình duyệt.</p>}

          <div className="sso-row">
            <button type="button" className="sso-btn" disabled title="Sắp ra mắt">
              Google
            </button>
            <button type="button" className="sso-btn" disabled title="Sắp ra mắt">
              Apple
            </button>
          </div>
          <p className="auth-divider">Hoặc đăng ký bằng email</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Đăng ký'}
            </button>
          </form>
          <p style={{ marginTop: 16 }}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>

      <div className="auth-split__hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="auth-split__hero-content">
          <h3>Bắt đầu hành trình cải tạo không gian sống</h3>
          <p>
            Upload ảnh phòng hiện tại, cho AI biết phong cách và ngân sách mong muốn — Homely lo phần còn
            lại: từ ý tưởng decor tới danh sách nội thất và chi phí dự kiến.
          </p>
        </div>
      </div>
    </div>
  )
}
