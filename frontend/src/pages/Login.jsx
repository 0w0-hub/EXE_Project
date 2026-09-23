import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import heroImage from '../assets/hero-living-room.jpg'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const mockAuthEnabled = import.meta.env.VITE_MOCK_AUTH === 'true'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(form)
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
          <h2>Đăng nhập</h2>
          {mockAuthEnabled && <p className="auth-mock-notice">Chế độ xem UI: email và mật khẩu bất kỳ đều được chấp nhận.</p>}

          <div className="sso-row">
            <button type="button" className="sso-btn" disabled title="Sắp ra mắt">
              Google
            </button>
            <button type="button" className="sso-btn" disabled title="Sắp ra mắt">
              Apple
            </button>
          </div>
          <p className="auth-divider">Hoặc tiếp tục với email</p>

          <form onSubmit={handleSubmit}>
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
              <label>Mật khẩu</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p style={{ marginTop: 16 }}>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </div>
      </div>

      <div className="auth-split__hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="auth-split__hero-content">
          <h3>Thiết kế không gian sống mơ ước cùng AI</h3>
          <p>
            Homely phân tích ảnh phòng thực tế của bạn, đề xuất phương án nội thất, màu sắc và bố trí phù hợp
            ngân sách — xem trước bằng ảnh và mô hình 3D chỉ trong vài phút.
          </p>
        </div>
      </div>
    </div>
  )
}
