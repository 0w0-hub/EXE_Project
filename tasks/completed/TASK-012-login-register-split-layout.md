# TASK-012

## Title

Đăng nhập / Đăng ký: bố cục 2 cột giống mockup Figma

## Goal

Làm lại bố cục `Login.jsx`/`Register.jsx` giống mockup (2 cột: form bên trái, ảnh hero + mô tả giá trị sản phẩm bên phải, nút SSO disable), giữ nguyên 100% logic form/auth hiện có.

## Scope

- `Login.jsx`, `Register.jsx`: bố cục 2 cột (`.auth-split`); cột trái giữ đúng form/field/validation/submit hiện có; cột phải: ảnh `hero-living-room.jpg` (Unsplash License, tải trong phiên) + tiêu đề + 2-3 câu mô tả giá trị sản phẩm thật (không dùng tên/trích dẫn khách hàng giả).
- Thêm 2 nút SSO (Google/Apple) ở form, `disabled`, có nhãn "Sắp ra mắt" — chỉ trình bày, không gọi API.
- `styles.css`: thêm class mới `.auth-split`, `.auth-hero`, `.sso-row`, `.sso-btn` (không đổi token/class cũ).
- Responsive: ẩn/thu gọn cột phải ở màn hẹp để không vỡ layout.

## Out of scope

- Không đổi `AuthContext`, không thêm OAuth thật.
- Không đổi validation/API call của form.

## Dependencies

TASK-009 (COMPLETED) — dùng chung token/class đã có.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật: đăng nhập/đăng ký vẫn hoạt động đúng (JWT, redirect); bố cục 2 cột hiển thị đúng ở màn rộng, không vỡ ở màn hẹp; nút SSO không bấm được, không gọi network.

## Testing

- Nguồn ảnh: tìm qua WebSearch trên unsplash.com, chọn ảnh "Modern living room with elegant chandeliers and comfortable seating" của Aalo Lens (Unsplash License — miễn phí, không cần credit), tải `?w=1200&q=70` (~156KB) về `frontend/src/assets/hero-living-room.jpg`.
- `npm run build` PASS (ảnh được Vite bundle vào `dist/assets/`).
- E2E thật qua Docker (rebuild `frontend`) + browser: `/login`, `/register` hiển thị đúng bố cục 2 cột (form trái, ảnh hero + mô tả giá trị sản phẩm phải), nút Google/Apple hiển thị mờ + không bấm được (`disabled`, xác nhận qua accessibility tree); đăng nhập thật (`restyle-tester@homely.dev`) vẫn hoạt động đúng, redirect `/` thành công. Console sạch lỗi.

## Status

COMPLETED
