// git add . 
// git commit -m "Mô tả thay đổi" 
// git push origin main
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
