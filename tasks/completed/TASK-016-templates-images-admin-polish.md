# TASK-016

## Title

Thư viện mẫu: ảnh theo phong cách + polish trang Admin

## Goal

Hoàn tất chuỗi nâng độ giống Figma: thêm ảnh đại diện theo phong cách cho `Templates.jsx`, polish 3 trang Admin theo ngôn ngữ thiết kế chung (không có mockup Figma cụ thể cho Admin).

## Scope

- `Templates.jsx`: thêm ảnh đại diện mỗi card, map theo field `style` thật từ API (chứa "japandi"/"scandinavian"/"industrial"/"bohemian"/"minimalist", không phân biệt hoa/thường) sang ảnh tương ứng đã tải (`frontend/src/assets/templates/*.jpg`), fallback `hero-living-room.jpg` nếu không khớp.
- `AdminUsers.jsx`: cột "Vai trò" đổi từ text thường sang pill màu (`.role-badge`, ADMIN = tint Primary, USER = tint neutral).
- `AdminDashboard.jsx`: thêm icon emoji nhỏ trên mỗi `.stat-tile`.
- `styles.css`: thêm `.role-badge`, `.role-badge--ADMIN`, `.role-badge--USER`, `.template-card-photo`.

## Out of scope

- Không đổi bố cục bảng lớn/RBAC của 3 trang admin.
- Không hardcode theo tên cụ thể từng mẫu — map theo `style` để còn đúng khi thêm mẫu mới.

## Dependencies

TASK-009 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật: Templates hiển thị đúng ảnh theo `style` thật từ API cho cả 6 mẫu hiện có; AdminUsers hiển thị pill vai trò đúng màu theo role thật; AdminDashboard hiển thị icon trên stat-tile; không đổi hành vi/RBAC.

## Testing

- Nguồn ảnh (Unsplash License, tất cả free, đã xác nhận qua WebFetch trước khi tải, `?w=800&q=70`): Scandinavian (Clay Banks), Japandi (Daniel Chen), Industrial (Yurii Kosyakevich), Bohemian (Spacejoy), Minimalist (Matúš Gocman) — lưu tại `frontend/src/assets/templates/*.jpg`.
- `npm run build` PASS, tất cả ảnh được Vite bundle đúng.
- E2E thật qua Docker + browser với dữ liệu template thật từ API (6 mẫu: Japandi, Modern Minimalist, Bohemian, Industrial, Scandinavian, Minimalist): mỗi card hiển thị đúng ảnh khớp `style` (map theo từ khoá, không hardcode tên mẫu) — xác nhận bằng mắt qua screenshot, đúng cả 6/6. Tiện thể sửa lỗi hiển thị trùng lặp chip (trước đó hiện cả `category` và `roomType` giống hệt nhau) → chỉ còn 1 chip `roomType`.
- AdminUsers: cột "Vai trò" hiển thị đúng pill màu theo role thật (ADMIN=tint Primary, USER=tint neutral) với dữ liệu user thật.
- AdminDashboard: 3 stat-tile tổng quan hiển thị icon + dữ liệu thật đúng; không đổi hành vi.
- Console sạch lỗi.

## Status

COMPLETED
