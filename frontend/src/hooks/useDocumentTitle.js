import { useEffect } from 'react'

// TASK-120: hook dùng chung để đổi tab title theo trang đang xem — tránh mọi trang cùng hiện
// "Homely — AI Room Design" (index.html) gây khó phân biệt khi mở nhiều tab. Khôi phục lại tiêu đề
// mặc định lúc unmount để không "rò rỉ" tiêu đề cũ sang trang khác khi điều hướng nhanh.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} — Homely`
    return () => {
      document.title = 'Homely — AI Room Design'
    }
  }, [title])
}
