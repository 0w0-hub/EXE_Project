// TASK-095: chỉ báo trạng thái autosave nháp cho RoomNew.jsx — hiển thị cạnh khu vực form, im lặng
// (return null) khi chưa có gì để báo (status 'idle', tức chưa gõ gì trong phiên hiện tại).
export default function DraftIndicator({ status }) {
  if (status === 'idle') return null

  return (
    <span className="text-muted" style={{ fontSize: '0.85em', marginLeft: 8 }}>
      {status === 'saving' ? 'Đang lưu...' : '✓ Đã lưu nháp'}
    </span>
  )
}
