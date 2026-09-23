# TASK-088

## Title

Chế độ tối (Dark Mode)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 4 — ý tưởng "Dark Mode" ChatGPT đã đề xuất ở round 3 (phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) nhưng chưa chọn làm (ưu tiên 4 ý tưởng khác trước). Toàn bộ `styles.css` đã dùng CSS custom properties nhất quán (`--color-primary`, `--color-bg`, v.v., xem `:root` đầu file) — thuận lợi lớn để thêm theme tối mà không cần đổi logic component nào.

## Scope

- `frontend/src/styles.css`: thêm 1 khối biến CSS override cho theme tối, kích hoạt qua attribute `[data-theme="dark"]` trên `<html>`/`<body>` (KHÔNG dùng `prefers-color-scheme` media query đơn thuần — cần toggle thủ công lưu lại lựa chọn user, không chỉ theo hệ điều hành). Đổi tối thiểu: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-neutral-tint` — giữ nguyên `--color-primary`/`--color-secondary`/`--color-accent`/`--color-danger` (màu thương hiệu không đổi theo theme, chỉ đổi nền/chữ/viền). KHÔNG đụng màu bên trong `Room3DViewer.jsx` (scene 3D, tường/sàn/trần — đã có "Buổi tối"/"Ban ngày" RIÊNG từ TASK-043, khác khái niệm, không liên quan tới theme UI này).
- Component mới `frontend/src/components/ThemeToggle.jsx` — nút bật/tắt (☀️/🌙), đọc/ghi `localStorage` (key `homely_theme`, giá trị `light`/`dark`), áp dụng `document.documentElement.setAttribute('data-theme', ...)` ngay khi component mount (đọc localStorage) và mỗi lần toggle. Mặc định `light` nếu chưa có lựa chọn lưu (KHÔNG tự động theo `prefers-color-scheme` hệ điều hành — giữ đơn giản, user tự chọn).
- **KHÔNG tự sửa `NavBar.jsx`** — coordinator sẽ tự đặt `ThemeToggle` vào vị trí phù hợp trong nav sau khi bạn báo cáo xong (tránh xung đột với agent khác cùng round cũng đang đụng `NavBar.jsx`). Chỉ cần báo rõ đường dẫn export.

## Out of scope

- Không đổi màu bên trong scene 3D (`Room3DViewer.jsx`) — xem lý do ở Scope.
- Không tự động theo `prefers-color-scheme` hệ điều hành.
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`.

## Dependencies

`styles.css` (`:root` block hiện có — toàn bộ design token).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bật dark mode → toàn bộ nền/chữ/viền đổi màu nhất quán trên MỌI trang đã kiểm tra (không chỉ 1 trang) — không có vùng nào "nền trắng chữ trắng" hay ngược lại (tự kiểm tra bằng cách đọc kỹ từng class dùng `--color-*` nào, không cần chạy browser để rà hết, nhưng phải kiểm tra ít nhất `.card`, `.navbar`, `.status-badge`, `button`, `.table`, form input).
- Tải lại trang → giữ đúng lựa chọn theme đã lưu.
- Tắt dark mode → về đúng theme sáng như cũ, không có màu nào "kẹt lại" từ theme tối.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành, kiểm tra KỸ nhiều trang khác nhau ở cả 2 theme (đây là rủi ro chính của task — 1 class nào đó lỡ dùng màu cố định thay vì biến CSS sẽ lộ ra rõ khi đổi theme).

## Status

COMPLETED

## Coordinator verification

Coordinator wire `ThemeToggle` vào `NavBar.jsx` (hiện cho cả 2 trạng thái đăng nhập, đặt đầu `navbar-nav`). Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`):
- Bật dark mode ở Dashboard → toàn bộ nền/thẻ/badge/input đổi màu nhất quán, dễ đọc.
- Chuyển trang (Projects, trang kết quả thiết kế) → theme giữ nguyên dark, mọi thành phần (status pill, card, dropdown chuông + tài khoản, nút, bảng) đều đổi màu đúng, không có vùng "chữ trên nền cùng màu".
- Tải lại trang (`navigate` lại `/`) → giữ đúng lựa chọn dark đã lưu.
- Tắt dark mode → về đúng light mode hoàn toàn, không còn màu nào "kẹt lại".
- **Phát hiện đúng như agent đã tự cảnh báo trước**: tab "Sơ đồ mặt bằng" (`Room2DPlan` trong `Room3DViewer.jsx`, ngoài phạm vi task này) có nền SVG `fill="#fff"` cố định — tạo thành 1 "đảo trắng" bên trong khung tối bao quanh. KHÔNG vỡ/không đọc được (chữ nhãn nội thất vẫn tối trên nền trắng, đọc bình thường) — chỉ là điểm chưa nhất quán thẩm mỹ. Ghi nhận làm known follow-up cho round sau nếu cần (phải sửa trong `Room3DViewer.jsx`).
- Console sạch lỗi.
