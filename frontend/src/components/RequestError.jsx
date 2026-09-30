// TASK-113: component tái dùng cho lỗi gọi API có nút thử lại thủ công (KHÔNG tự động retry — xem
// Out of scope). Style dùng lại đúng .card/.error-text đã có trong styles.css, không thêm màu/token
// mới. Dùng ở đúng 2 nơi theo scope: Projects.jsx, Dashboard.jsx (KHÔNG áp dụng cho DesignResult.jsx
// — luồng polling đó đã có xử lý PENDING/PROCESSING/FAILED riêng, ngoài phạm vi).
export default function RequestError({ message, onRetry }) {
  return (
    <div className="card">
      <p className="error-text" style={{ margin: 0 }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="secondary" style={{ marginTop: 12 }} onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  )
}
