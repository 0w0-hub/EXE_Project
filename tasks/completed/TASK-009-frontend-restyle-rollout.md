# TASK-009

## Title

Recode giao diện — áp dụng design token cho các trang còn lại + admin + wrapper 3D viewer

## Goal

Áp dụng hệ design token/class đã tạo ở TASK-008 cho toàn bộ các trang còn lại, hoàn tất việc recode giao diện web theo bảng màu Peacock Feather. Thuần styling — không đổi logic/API/route.

## Scope

- `frontend/src/pages/Templates.jsx`: filter buttons dùng class có sẵn; category/roomType → `.chip`; muted text → `.text-muted`.
- `frontend/src/pages/Projects.jsx`: status tabs/pagination dùng class có sẵn; muted timestamp → `.text-muted`.
- `frontend/src/pages/RoomNew.jsx`: thêm `.step-indicator` hiển thị state `step` có sẵn; banner giới hạn gói → `.card--warning`; muted hint → `.text-muted`.
- `frontend/src/pages/DesignResult.jsx`: bảng nội thất → `.table`/`.table-wrap`.
- `frontend/src/components/Room3DViewer.jsx`: chỉ phần wrapper (border mount-div, caption, nút tab/reset) — không đụng code Three.js dựng scene.
- `frontend/src/pages/admin/AdminDashboard.jsx`: stat card + card theo trạng thái → `.stat-tile`.
- `frontend/src/pages/admin/AdminUsers.jsx`, `AdminDesigns.jsx`: bảng → `.table`/`.table-wrap`.

## Out of scope

- Tạo token/class mới ngoài những gì đã có ở TASK-008.
- Màu scene Three.js (vật liệu tường/sàn/background trong `Room3DViewer` dựng bằng JS).
- Thumbnail ảnh cho Projects/AdminDesigns (DTO `DesignJobSummaryResponse` không có trường ảnh — cần sửa backend nếu muốn, ngoài phạm vi).
- Bất kỳ thay đổi API/DTO backend nào.

## Dependencies

TASK-008 (phải hoàn thành/merge trước — dùng chung token/class `styles.css`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- 7 route còn lại (`/templates`, `/projects`, `/rooms/new`, `/designs/:jobId`, `/admin`, `/admin/users`, `/admin/designs`) hiển thị đúng ngôn ngữ thiết kế mới.
- Toàn bộ hành vi cũ giữ nguyên: filter/tab, phân trang, luồng tạo phòng 4 bước, 3D viewer (orbit, kéo-thả, resize tường, reset, chuyển tab 2D/3D), RBAC admin.

## Testing

- `npm run build` PASS.
- E2E thật qua Docker Compose (container `homely-frontend` rebuild từ source) + browser thật (Claude in Chrome), tài khoản thật `restyle-tester@homely.dev`:
  - `/templates`: chip category/roomType hiển thị đúng, filter buttons dùng đúng class primary/secondary.
  - `/projects`: status pill "COMPLETED" đúng màu accent-tint/accent-dark; hover row.
  - `/rooms/new` → submit form thật (Phòng khách, 5×4m) → tạo room thật qua API thật → redirect `/designs/:jobId`.
  - `/designs/:jobId`: badge PENDING → COMPLETED đúng theo polling thật; `Room3DViewer` render scene 3D (box fallback, mock provider), tab "Không gian 3D"/"Ảnh AI (2D)" chuyển đúng, `.viewer-3d-placeholder` fallback đúng style khi chưa có ảnh AI; bảng nội thất dùng `.table`/`.table-wrap` hiển thị đúng 4 món + chi phí; color swatches, chi phí dự kiến, giải thích AI hiển thị đúng.
  - Promote user thật lên ADMIN qua SQL (`UPDATE users SET role='ADMIN'`) + đăng xuất/đăng nhập lại (JWT role claim cần re-login, đúng hành vi đã biết từ trước) → xác nhận trước khi re-login `/admin` trả đúng lỗi 403 "Bạn không có quyền..." (RBAC không bị ảnh hưởng bởi việc đổi CSS), sau khi re-login vào được cả 3 trang admin.
  - `/admin`: 3 stat-tile tổng quan + 4 stat-tile theo trạng thái (PENDING/PROCESSING/COMPLETED/FAILED) hiển thị đúng cả 4 màu pill đã mapping, dữ liệu thật (11 user, 8 phòng, 13 thiết kế tại thời điểm test).
  - `/admin/users`, `/admin/designs`: bảng `.table`/`.table-wrap` hiển thị đúng dữ liệu thật, filter trạng thái ở AdminDesigns hoạt động.
  - Console sạch lỗi trên toàn bộ route đã test.
- Không hồi quy: luồng tạo phòng → generate → poll → xem kết quả hoạt động đúng như trước; RBAC admin không đổi hành vi.

## Status

COMPLETED
