export default function DraftIndicator({ status }) {
  if (status === 'idle') return null

  return (
    <span className="text-muted" style={{ fontSize: '0.85em', marginLeft: 8 }}>
      {status === 'saving' ? 'Đang lưu...' : '✓ Đã lưu nháp'}
    </span>
  )
}
