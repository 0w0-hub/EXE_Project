// TASK-085: khối hiển thị 403 dùng chung, nhúng vào trang admin khi API trả lỗi quyền truy cập — KHÔNG
// phải route riêng. Route "/admin/*" đã được `AdminRoute` (App.jsx) chặn theo `user.role` phía client;
// đây chỉ là fallback hiển thị khi tầng API vẫn trả 403 (ví dụ quyền bị thu hồi giữa phiên đăng nhập),
// không thay đổi logic RBAC nào.
export default function AccessDenied({ message }) {
  return (
    <div className="card" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <p
        style={{
          margin: '0 0 8px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '2.4rem',
          color: 'var(--color-danger)',
        }}
      >
        403
      </p>
      <h2 style={{ marginTop: 0 }}>Không có quyền truy cập</h2>
      <p className="text-muted">
        {message || 'Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.'}
      </p>
    </div>
  )
}
