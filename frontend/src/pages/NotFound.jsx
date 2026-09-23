import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// TASK-085: trang 404 riêng — coordinator sẽ tự gắn route catch-all `path="*"` vào App.jsx sau khi mọi
// agent trong round này báo cáo xong (tránh xung đột thứ tự route do nhiều agent cùng sửa App.jsx song
// song). Component này chỉ đứng riêng, chưa được import ở đâu.
export default function NotFound() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // TASK-085: ý tưởng gốc (ChatGPT) giả định có route "/dashboard" riêng, nhưng App.jsx hiện mount
  // Dashboard ngay tại "/" (ProtectedRoute tự chuyển "/" sang "/login" khi chưa đăng nhập) — nên điều
  // hướng thẳng "/" khi đã đăng nhập, "/login" khi chưa, thay vì phải đi vòng qua "/" rồi để
  // ProtectedRoute bounce lần nữa.
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
