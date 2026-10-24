# TASK-153

## Title

Xác thực + focus trường lỗi đầu tiên (dùng validation HTML gốc) + Enter chuyển field tiếp theo trong form tạo phòng

## Goal

Gộp 2 ý tưởng từ ChatGPT round 30 (cùng batch TASK-152), đã vét trước qua Explore agent — cả 2 đều CHƯA CÓ, cùng đụng `RoomNew.jsx`:

- "Create Form Field Error Focus" — Đã xác nhận `RoomNew.jsx` KHÔNG có validation JS tuỳ chỉnh nào (chỉ dựa `required` HTML gốc trên đúng 1 trường `roomType` + try/catch quanh gọi API) và form KHÔNG có `noValidate`. Thay vì viết validation JS mới (quy mô lớn hơn nhiều so với "1 file" ChatGPT ước lượng), tận dụng ĐÚNG cơ chế validation HTML5 gốc của trình duyệt (đã tự động focus+scroll tới field lỗi đầu tiên khi submit thất bại `required`/`min` — không cần code JS) — chỉ cần bổ sung thuộc tính `required`/`min` còn thiếu cho các trường bắt buộc khác (chiều rộng, chiều dài) để trình duyệt tự xử lý đúng như ý tưởng đề xuất, KHÔNG viết engine validate riêng.
- "Create Form Enter-to-Advance" — nhấn Enter trong 1 trong 6 ô input dòng đơn (loại phòng, chiều rộng, chiều dài, phong cách, màu ưa thích, nội thất mong muốn, ngân sách) → chuyển focus sang ô kế tiếp thay vì submit sớm ngay (hành vi mặc định trình duyệt hiện tại: Enter trong input dòng đơn trong `<form>` sẽ submit form). KHÔNG áp dụng cho `<textarea>` (yêu cầu tự do — Enter phải xuống dòng bình thường) và KHÔNG áp dụng cho nút submit.

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - **Validation HTML gốc**: thêm `required` cho `widthMeters`/`lengthMeters` (đã là số bắt buộc theo logic hiện có, chỉ thiếu thuộc tính khai báo), `min="1" max="20"` — ĐÃ XÁC NHẬN khớp đúng giới hạn thật ở backend (`CreateRoomRequest.java`/`UpdateRoomRequest.java`: `@DecimalMin(1.0)`/`@DecimalMax(20.0)` cho cả `widthMeters`/`lengthMeters`), không bịa số mới. KHÔNG thêm `required` cho các trường không thật sự bắt buộc (màu/nội thất mong muốn/ngân sách — vốn optional theo logic hiện có, kiểm tra kỹ trước khi thêm).
  - **Enter-to-Advance**: `onKeyDown` chung cho danh sách input dòng đơn (mảng ref theo thứ tự hiển thị) — Enter → `e.preventDefault()` + focus input kế tiếp trong mảng; nếu đang ở input CUỐI CÙNG trong danh sách (trước textarea) → Enter vẫn `preventDefault()` nhưng KHÔNG focus gì thêm (tránh submit sớm ngoài ý muốn, user chủ động bấm nút submit). `<textarea>` và nút submit KHÔNG áp dụng logic này (giữ nguyên hành vi mặc định — xuống dòng/submit).

## Out of scope

- Không viết engine validate JS tuỳ chỉnh mới — CHỈ dùng thuộc tính HTML `required`/`min` gốc.
- Không đổi giới hạn kích thước phòng thật (dùng đúng số đã có ở backend).
- "Account Session Status", "Global Unsaved-Error Recovery Banner" — để dành backlog (xem `current-state.md`).

## Dependencies

`RoomNew.jsx` (form hiện có, không `noValidate`), giới hạn kích thước phòng thật từ backend (TASK-007, kiểm tra trước khi dùng số).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm submit khi chiều rộng/chiều dài còn trống → trình duyệt tự động focus + hiện thông báo validate gốc đúng field đó (không cần code JS thêm, xác nhận qua `document.activeElement` sau khi submit thất bại).
- Focus vào ô chiều rộng → Enter → focus chuyển đúng sang ô kế tiếp theo thứ tự hiển thị (không submit form).
- Focus vào ô CUỐI CÙNG trong danh sách input dòng đơn → Enter → KHÔNG submit form (chỉ `preventDefault`, không làm gì thêm).
- Focus vào `<textarea>` yêu cầu tự do → Enter → xuống dòng bình thường (không bị chặn).
- Không hồi quy: điền đủ toàn bộ trường hợp lệ → submit vẫn hoạt động đúng như cũ (qua click nút submit).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-152.

## Coordinator verification

Dispatch cho 1 agent (`RoomNew.jsx` riêng, song song TASK-152 trên `Projects.jsx`). Agent thêm `required min="1" max="20"` cho width/length + `handleSingleLineEnter(index)` ref-array cho 7 input dòng đơn theo đúng thứ tự hiển thị (0-6, dừng đúng ở "Ngân sách" — không submit sớm), xác nhận đúng các trường còn lại (`style`/`preferredColors`/`desiredFurniture`/`budget`) THẬT SỰ optional trước khi quyết định không thêm `required`. `npm run build` PASS.

**Coordinator tự phát hiện + sửa 1 lỗi thật lúc chạy Playwright regression (không phải lúc code)** — LỖI DO CHÍNH COORDINATOR GÂY RA khi viết task spec: dòng "Xoá thiết lập" của Scope ghi sai "widthMeters/lengthMeters đã là số bắt buộc theo logic hiện có" — THỰC TẾ 2 trường này CỐ Ý optional (form tối thiểu chỉ cần loại phòng + ảnh, đúng comment sẵn có trong `smoke.spec.js`: "tạo phòng mới với form tối thiểu"; `handleSubmit` gửi `null` khi trống; backend Bean Validation `@DecimalMin`/`@DecimalMax` MẶC ĐỊNH bỏ qua giá trị null). Thêm `required` khiến trình duyệt CHẶN submit khi trống — Playwright smoke test (tạo phòng CHỈ điền loại phòng + ảnh, không điền kích thước) timeout chờ điều hướng, 1/3 test FAIL. Xác nhận qua đọc `error-context.md`: snapshot cho thấy spinbutton "Chiều rộng" đang `[active]` — đúng là validation HTML5 gốc tự động focus field trống, PHẢN ÁNH ĐÚNG tính năng vừa thêm nhưng SAI về việc trường này có nên bắt buộc hay không. Sửa bằng cách BỎ `required` (giữ nguyên `min`/`max` để validate đúng khi user CÓ nhập). `npm run build` PASS lại, Docker rebuild lần 2, Playwright lần 2 — 3/3 PASS.

Verify E2E qua Claude in Chrome SAU sửa: dispatch `KeyboardEvent('Enter')` trực tiếp qua JS liên tiếp qua cả 7 input dòng đơn → focus chuyển đúng thứ tự (loại phòng→rộng→dài→phong cách→màu→nội thất→ngân sách), dừng đúng ở "Ngân sách" không submit (`location.pathname` không đổi); `<textarea>` xác nhận Enter KHÔNG bị `preventDefault` (vẫn xuống dòng bình thường); đọc `required`/`min`/`max` trực tiếp trên input width xác nhận đúng `required: false, min: "1", max: "20"`. Console sạch lỗi.

## Status

COMPLETED
