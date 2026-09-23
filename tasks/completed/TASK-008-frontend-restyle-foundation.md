# TASK-008

## Title

Recode giao diện — nền tảng design token (bảng màu Peacock Feather) + trang auth/dashboard

## Goal

Thay toàn bộ hệ màu/font cũ của frontend bằng design token mới khớp bộ mockup Stitch/Figma đã chốt với user (Primary `#4D52B4`, Secondary `#4E9CE8`, Accent `#70D6C5`, Support `#CAE5BC`, Background tint `#E1EDD4`, font Plus Jakarta Sans/Inter), áp dụng cho `styles.css`, `NavBar`, và 3 trang đầu tiên (Login, Register, Dashboard). Thuần styling — không đổi logic/API/route.

## Scope

- `frontend/index.html`: thêm Google Fonts `<link>` (Plus Jakarta Sans + Inter).
- `frontend/src/styles.css`: thêm khối `:root` token (màu, radius, shadow, font) + cập nhật toàn bộ class hiện có (`.card`, `.form-group input/select/textarea` + `:focus`, `button`, `button.secondary`, `.status-badge` + `.status-*`, `.navbar*`, `.error-text`, `.page-loading`, `.color-swatch`, `.viewer-3d-placeholder`) sang token mới + thêm class mới dùng chung cho cả 2 task (`.chip`, `.stat-tile`, `.section-tint`, `.card--warning`, `.table`/`.table-wrap`, `.step-indicator*`, `.avatar-circle`, `.text-muted`).
- `frontend/src/components/NavBar.jsx`: `Link` → `NavLink` (active state), `.avatar-circle` chữ cái đầu tên user, nút đăng xuất dùng `.secondary`.
- `frontend/src/pages/Login.jsx`, `Register.jsx`: bọc `.section-tint` quanh `.card`, giữ nguyên form/logic.
- `frontend/src/pages/Dashboard.jsx`: header/CTA trong `.section-tint`; usage/subscription card → `.stat-tile`; room card thêm ảnh thumbnail thật qua `assetApi.fetchObjectUrl(room.photoAssetId)` (dữ liệu đã có sẵn trong `RoomResponse`, không đổi backend), fallback khi không có ảnh.

## Out of scope

- Các trang còn lại (Templates, Projects, RoomNew, DesignResult, 3 trang admin, Room3DViewer) — sang TASK-009.
- Màu scene Three.js (`Room3DViewer` nội bộ) — không phải CSS, để task riêng nếu cần sau.
- Bất kỳ thay đổi API/DTO backend nào.

## Dependencies

TASK-007 (COMPLETED). Không phụ thuộc AI provider/Replicate.

## Affected Services

Frontend only (`styles.css`, `index.html`, `NavBar.jsx`, `Login.jsx`, `Register.jsx`, `Dashboard.jsx`).

## Acceptance Criteria

- `npm run build` (frontend) PASS, không lỗi.
- Chạy `npm run dev`, xem qua browser: `/login`, `/register`, `/` hiển thị đúng bảng màu/font/bo góc/shadow mới; đăng nhập/đăng ký thật vẫn hoạt động; nav active-link đúng theo route; room card ở Dashboard hiển thị ảnh thật khi phòng có ảnh, fallback hợp lý khi không có.
- Console sạch lỗi (không 404 font, không CSS variable sai).

## Testing

- `npm run build` PASS (Vite, không lỗi/warning JSX).
- E2E thật qua Docker Compose (`docker compose up -d --build`) + browser thật (Claude in Chrome), không dùng mock:
  - `/login`, `/register` (chưa đăng nhập): hiển thị đúng palette Peacock Feather (`section-tint` nền xanh nhạt, card trắng bo góc 16px + shadow, nút Primary indigo bo pill, font Plus Jakarta Sans cho heading), NavBar active-link đúng (`.navbar-nav a.active` in đậm indigo khi ở đúng route).
  - Đăng ký tài khoản thật (`restyle-tester@homely.dev`) qua UI — submit thành công, redirect `/`, `.avatar-circle` hiển thị đúng chữ "R".
  - `/` (Dashboard) đăng nhập: 3 `.stat-tile` (gói/lượt dùng/số phòng) hiển thị đúng dữ liệu thật; room card hiển thị fallback icon 🏠 khi phòng chưa có ảnh (đúng thiết kế — chưa test được ảnh thật vì phòng test không upload ảnh, nhưng code path `assetApi.fetchObjectUrl` dùng lại nguyên kỹ thuật đã verify ở DesignResult/Room3DViewer).
  - Console sạch lỗi (`read_console_messages`, `onlyErrors=true`) trên cả 3 route.
- Không hồi quy: đăng ký/đăng nhập vẫn tạo JWT + redirect đúng như trước khi restyle.

## Status

COMPLETED
