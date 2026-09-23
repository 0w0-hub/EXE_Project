import { useState } from 'react'
import { userExportApi } from '../services/api'

// TASK-087: user tự tải toàn bộ dữ liệu cá nhân (profile + room + design job) về máy dưới dạng
// file JSON để backup/tham khảo ngoài app — pattern Blob/URL.createObjectURL tham khảo
// exportLayout() ở Room3DViewer.jsx (TASK-075), không đụng file đó.
export default function ExportData() {
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  async function handleExport() {
    setError(null)
    setDownloaded(false)
    setDownloading(true)
    try {
      const data = await userExportApi.export()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `homely-du-lieu-ca-nhan-${Date.now()}.json`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      setDownloaded(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2>Xuất dữ liệu của tôi</h2>
      <p className="text-muted">
        Tải toàn bộ dữ liệu cá nhân của bạn trên Homely (thông tin tài khoản, danh sách phòng, lịch sử
        thiết kế) về máy dưới dạng file JSON để backup hoặc tham khảo ngoài ứng dụng. File không bao
        gồm ảnh/model 3D.
      </p>
      {error && <p className="error-text">{error}</p>}
      {downloaded && !error && <p className="success-text">Đã tải xong file dữ liệu.</p>}
      <button type="button" onClick={handleExport} disabled={downloading}>
        {downloading ? 'Đang tải...' : 'Tải dữ liệu của tôi (.json)'}
      </button>
    </div>
  )
}
