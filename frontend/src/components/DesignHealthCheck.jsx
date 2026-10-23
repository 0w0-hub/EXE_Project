export default function DesignHealthCheck({ job, room, preference }) {
  if (!job) return null

  if (job.status !== 'COMPLETED') {
    const statusText =
      job.status === 'FAILED'
        ? 'Xử lý thất bại — chưa có kết quả để kiểm tra.'
        : 'Đang xử lý — chưa có kết quả để kiểm tra.'
    return (
      <div className="card card--warning no-print" style={{ marginTop: 12, marginBottom: 16, padding: 16 }}>
        <p style={{ margin: 0 }}> Kiểm tra thiết kế: {statusText}</p>
      </div>
    )
  }

  if (!job.result) return null

  const furniture = job.result.furniture || []
  const problems = []

  if (!room?.photoAssetId) {
    problems.push({
      key: 'photo',
      text: 'Thiếu ảnh phòng gốc — ảnh được gắn từ lúc tạo phòng nên không thể bổ sung tại đây.',
    })
  }

  if (furniture.length === 0) {
    problems.push({
      key: 'furniture',
      text: 'Kết quả chưa có món nội thất nào.',
    })
  }

  const isOverBudget = preference?.budget > 0 && job.result.estimatedCost > preference.budget
  if (isOverBudget) {
    const overAmount = job.result.estimatedCost - preference.budget
    problems.push({
      key: 'budget',
      text: `Vượt ngân sách dự kiến ${overAmount.toLocaleString('vi-VN')} đ.`,
      action: true,
    })
  }

  const noBudgetSet = !(preference?.budget > 0)

  function handleScrollToBudgetGuard() {
    document.getElementById('room-3d-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hasProblems = problems.length > 0

  return (
    <div
      className={`card no-print ${hasProblems ? 'card--danger' : 'card--success'}`}
      style={{ marginTop: 12, marginBottom: 16 }}
    >
      <h4 style={{ marginTop: 0, marginBottom: 8 }}> Kiểm tra thiết kế</h4>

      {!hasProblems && (
        <p style={{ margin: 0, color: 'var(--color-accent-dark)', fontWeight: 600 }}>
           Thiết kế đã sẵn sàng
        </p>
      )}

      {problems.map((problem) => (
        <p key={problem.key} style={{ margin: '4px 0', color: 'var(--color-danger)' }}>
           {problem.text}
          {problem.action && (
            <>
              {' '}
              <button
                type="button"
                className="secondary"
                onClick={handleScrollToBudgetGuard}
                style={{ marginLeft: 4, padding: '2px 10px', fontSize: '0.8rem' }}
              >
                Xem chi tiết ngân sách ↓
              </button>
            </>
          )}
        </p>
      ))}

      {noBudgetSet && (
        <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
          Chưa đặt ngân sách dự kiến — không thể so sánh chi phí kết quả với ngân sách.
        </p>
      )}
    </div>
  )
}
