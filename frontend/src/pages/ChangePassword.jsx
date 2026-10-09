import { useState } from 'react'
import { authApi } from '../services/api'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.newPassword !== form.confirmNewPassword) {
      setError('Xác nhận mật khẩu mới không khớp')
      return
    }
    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới tối thiểu 6 ký tự')
      return
    }

    setSubmitting(true)
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess('Đổi mật khẩu thành công')
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h2>Đổi mật khẩu</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mật khẩu hiện tại</label>
          <div className="password-input-wrap">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrentPassword((v) => !v)}
              aria-label={showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
              aria-pressed={showCurrentPassword}
            >
              {showCurrentPassword ? '' : ''}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Mật khẩu mới (tối thiểu 6 ký tự)</label>
          <div className="password-input-wrap">
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNewPassword((v) => !v)}
              aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              aria-pressed={showNewPassword}
            >
              {showNewPassword ? '' : ''}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Xác nhận mật khẩu mới</label>
          <div className="password-input-wrap">
            <input
              type={showConfirmNewPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={form.confirmNewPassword}
              onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmNewPassword((v) => !v)}
              aria-label={showConfirmNewPassword ? 'Ẩn xác nhận mật khẩu mới' : 'Hiện xác nhận mật khẩu mới'}
              aria-pressed={showConfirmNewPassword}
            >
              {showConfirmNewPassword ? '' : ''}
            </button>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  )
}
