import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'


export default function NotFound() {
  const { user } = useAuth()
  const navigate = useNavigate()


  const homeTarget = user ? '/' : '/login'

  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '3rem',
            color: 'var(--color-primary)',
          }}
        >
          404
        </p>
        <h2 style={{ marginTop: 0 }}>Không tìm thấy trang</h2>
        <p className="text-muted">
          Trang bạn đang tìm không tồn tại, đã bị xoá, hoặc đường dẫn không chính xác.
        </p>
        <button type="button" onClick={() => navigate(homeTarget)} style={{ marginTop: 8 }}>
          Về trang chủ
        </button>
      </div>
    </div>
  )
}
