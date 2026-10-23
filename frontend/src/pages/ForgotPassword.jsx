import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')
  useDocumentTitle('Quên mật khẩu')

  function handleSubmit(event) {
    event.preventDefault()
    setNotice('Yêu cầu đặt lại mật khẩu chưa được kết nối với máy chủ.')
  }

  return (
    <section className="forgot-password-page">
      <div className="card forgot-password-card">
        <div className="forgot-password-icon"><Mail size={23} /></div>
        <p className="plans-eyebrow">HOMELY ACCOUNT</p>
        <h1>Quên mật khẩu?</h1>
        <p className="text-muted">Nhập email tài khoản để bắt đầu khôi phục quyền truy cập.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@email.com" />
          </div>
          <button type="submit" className="forgot-password-submit">Gửi yêu cầu đặt lại mật khẩu</button>
        </form>
        {notice && <p className="forgot-password-notice" role="status">{notice}</p>}
        <Link className="forgot-password-back" to="/login"><ArrowLeft size={16} /> Quay lại đăng nhập</Link>
      </div>
    </section>
  )
}
