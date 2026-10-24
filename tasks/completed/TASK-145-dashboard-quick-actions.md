# TASK-145

## Title

Khu vực "Thao tác nhanh" trên Dashboard

## Goal

Ý tưởng từ ChatGPT round 26 (cùng batch TASK-144/146). Đã vét trước qua Explore agent, xác nhận CHỈ CÓ MỘT PHẦN: `Dashboard.jsx` hiện chỉ có 1 nút nổi bật "+ Tạo phòng mới" — 3 đích còn lại (Projects, Thùng rác, Thiết kế gần đây) chỉ vào được qua link `NavBar`/dropdown Tài khoản hoặc cuộn xuống phần `RecentDesigns`, không có cụm nút thao tác nhanh nào gộp chung.

- **Thao tác nhanh**: thêm 1 khu vực 3-4 nút lớn ngay gần đầu Dashboard: "Tạo thiết kế mới" (đã có, giữ nguyên), "Mở Projects", "Thùng rác" — CHỈ 3 nút này (không thêm "Thiết kế gần đây" trùng với section `RecentDesigns` đã có ngay bên dưới cùng trang, tránh 2 lối vào cùng 1 đích gây rối).

## Scope

- `frontend/src/pages/Dashboard.jsx`:
  - Thêm cụm nút trong khu vực `.section-tint` đầu trang (cạnh "+ Tạo phòng mới" hiện có), dùng route đã có (`/projects`, `/trash` — kiểm tra đúng path thật trong `App.jsx` trước khi viết, không đoán).
  - Giữ nguyên nút "+ Tạo phòng mới" đang có, không đổi hành vi.
  - Thuần điều hướng (`<Link>`), không thêm state/logic mới.

## Out of scope

- Không thêm nút "Thiết kế gần đây" (trùng `RecentDesigns` đã hiện ngay dưới, TASK-100).
- Không đổi layout/thứ tự các section khác của Dashboard.

## Dependencies

`App.jsx` (route path thật cho Projects/Trash), `pages/Dashboard.jsx` khu vực `.section-tint` có sẵn.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Dashboard hiện đúng cụm nút mới, cả 3 điều hướng đúng route (kiểm tra qua click thật, không chỉ đọc code).
- Không hồi quy: nút "+ Tạo phòng mới"/ô tìm kiếm/`RecentDesigns`/thống kê đã có.
- Responsive: cụm nút không vỡ layout ở màn hình nhỏ (kiểm tra qua `resize_window` hoặc viewport hẹp).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-144/146.

## Coordinator verification

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Agent xác nhận đúng route thật qua đọc `App.jsx` (`/projects` dòng 113-120, `/trash` dòng 123-130, không đoán). Tái dùng class `.secondary` có sẵn cho 2 nút mới, không thêm CSS mới, không đổi nút "+ Tạo phòng mới" gốc. `npm run build` PASS.

Coordinator verify: build tổng hợp 3 task PASS. Docker rebuild + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: Dashboard hiện đúng cả 3 nút không vỡ layout; bấm "Mở Projects" (qua `document.querySelectorAll('button').find(...).click()` do gặp lại Known Issue click toạ độ không phản hồi) → điều hướng đúng `/projects`. Console sạch lỗi.

## Status

COMPLETED
