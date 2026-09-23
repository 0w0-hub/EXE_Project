# TASK-132

## Title

Tăng/giảm cỡ chữ giao diện (Accessibility Font Size Control)

## Goal

Ý tưởng từ ChatGPT round 16 (xem `tasks/active/TASK-131-hide-room-surfaces-catalog-price-hint.md` mục Goal để biết 3 ý tưởng khác cùng batch bị loại và lý do). Dự án chưa có bất kỳ điều khiển cỡ chữ nào (grep xác nhận không có `font-size`/`fontSize` toàn cục nào trong `App.jsx`) — với người dùng phổ thông (không phải dân kỹ thuật, đúng đối tượng chính của Homely) trên nhiều loại màn hình, cỡ chữ cố định có thể quá nhỏ/quá to tuỳ thiết bị.

## Scope

- Component mới `frontend/src/components/FontSizeControl.jsx` — 3 nút "A−" / "A" (đặt lại mặc định) / "A+", ĐÚNG PATTERN `frontend/src/components/ThemeToggle.jsx` (đọc file này làm mẫu TRƯỚC khi viết): đọc/ghi `localStorage` (key mới, ví dụ `homely_font_size`), áp dụng ngay lúc khởi tạo state (tránh FOUC) qua `document.documentElement.setAttribute('data-font-size', ...)`, bọc try/catch an toàn cho lỗi localStorage (private mode/quota).
- 3 mức: `sm` / `md` (mặc định) / `lg` — nút "A−"/"A+" di chuyển giữa 3 mức (không cho vượt quá `sm`/`lg`), nút "A" đặt thẳng về `md`.
- `frontend/src/styles.css`: thêm CSS cho `:root[data-font-size="sm"]`/`:root[data-font-size="lg"]` đổi `font-size` gốc trên `html`/`:root` (vd 87.5%/112.5%, `md` = mặc định 100% hiện tại không cần rule riêng) — dùng đơn vị `rem`/`em` sẵn có trong toàn bộ `styles.css` để hiệu ứng lan toả tự nhiên (không cần sửa từng component).
- `frontend/src/components/NavBar.jsx`: import + render `<FontSizeControl />` cạnh `<ThemeToggle />` đã có.

## Out of scope

- Không đổi giá trị `font-size` cụ thể ở bất kỳ component/CSS class nào khác — chỉ đổi biến gốc trên `html`/`:root`, để toàn bộ `rem` lan toả tự nhiên.
- Không thêm mức "extra large"/"extra small" (chỉ 3 mức đủ dùng, tránh phức tạp hoá).
- Không đụng `Room3DViewer.jsx`/`Dashboard.jsx`/các trang khác — hiệu ứng lan toả qua CSS biến gốc, không cần sửa từng trang.

## Dependencies

TASK-088 (`ThemeToggle.jsx`, pattern tham khảo trực tiếp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "A+" 2 lần → cỡ chữ toàn trang tăng dần tới mức `lg`, bấm thêm không vượt quá `lg`.
- Bấm "A−" → giảm về `md` rồi `sm`, không vượt quá `sm`.
- Bấm "A" → về thẳng `md` bất kể đang ở mức nào.
- Tải lại trang → giữ đúng mức đã chọn (persist qua `localStorage`, giống `ThemeToggle`).
- Không hồi quy: đổi theme sáng/tối (TASK-088) vẫn hoạt động độc lập, layout không vỡ ở cả 3 mức cỡ chữ trên ít nhất 2 trang khác nhau (vd Dashboard, Projects).
- Console sạch lỗi.

## Testing

Agent tự viết + tự verify (không đụng `Room3DViewer.jsx`, hợp lệ giao agent). Coordinator gộp rebuild Docker + Playwright TASK-098 regression + verify E2E qua Claude in Chrome sau khi agent xong.

## Coordinator verification

- Agent tự verify chi tiết (xem báo cáo bàn giao): build PASS, dùng dev server riêng + đọc `data-font-size`/`localStorage`/`getComputedStyle` trực tiếp (né được lệch toạ độ click/screenshot ~9% trong phiên của agent) xác nhận cả 3 mức + kẹp biên + reset + persist qua reload đều đúng, layout không vỡ ở mức `lg` trên Dashboard/Projects (không tràn ngang, đo `scrollWidth === innerWidth`).
- Coordinator đọc lại code sau khi agent xong: `FontSizeControl.jsx` đúng pattern `ThemeToggle.jsx` (lazy-init áp dụng đồng bộ trước paint, try/catch localStorage), CSS chỉ đổi `font-size` gốc trên `:root[data-font-size="sm"/"lg"]`, không đụng file/class nào khác — đúng scope.
- Coordinator tự verify lại độc lập trên tab Docker (job mới, tài khoản mới) sau khi rebuild: bấm "A+" từ mặc định `md` → `lg` ngay (đúng vì chỉ 3 mức), bấm thêm không vượt `lg`; bấm "A−" 3 lần → dừng đúng ở `sm`; bấm "A" → về thẳng `md`. `getComputedStyle(document.documentElement).fontSize` xác nhận đúng 18px (`lg`)/16px (`md`) tương ứng. `localStorage.getItem('homely_font_size')` đúng giá trị.
- Docker rebuild frontend (gộp cùng lượt build với TASK-131) + Playwright TASK-098 regression: 3/3 PASS. Console sạch lỗi trên tab Docker của coordinator.
- Không phát hiện lỗi app mới. Tài khoản test tạm `task132.fonttest@example.com` do agent tạo trong lúc verify (dev DB riêng, vô hại) — không cần dọn vì không ảnh hưởng dữ liệu Docker chính thức.

## Status

COMPLETED
