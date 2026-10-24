# TASK-161

## Title

Tóm tắt rõ trường nào bắt buộc/tuỳ chọn trong form tạo phòng

## Goal

Ý tưởng từ ChatGPT round 33, đã vét trước qua Explore agent, xác nhận premise ĐÚNG: backend `CreateRoomRequest.java` chỉ `roomType` có `@NotBlank`, `widthMeters`/`lengthMeters` chỉ có `@DecimalMin/@DecimalMax` (tuỳ chọn, chỉ validate khi CÓ giá trị) — khớp đúng frontend hiện tại (`RoomNew.jsx`: chỉ input `roomType` có `required`, nhãn "Loại phòng *"; mọi trường khác — kích thước, ảnh, phong cách, màu sắc, nội thất mong muốn, ngân sách, yêu cầu thêm — đều KHÔNG `required`). Hiện KHÔNG có bất kỳ nhãn "Bắt buộc"/"Tuỳ chọn" nào ngoài dấu `*` trần trên đúng 1 nhãn — user không biết rõ những trường còn lại là tuỳ chọn cho tới khi thử submit.

- **Tóm tắt trường tuỳ chọn**: hiện 1 dòng/khối thông tin NGẮN gọn (trước hoặc gần đầu form) liệt kê rõ CHỈ "Loại phòng" là bắt buộc, các trường còn lại đều tuỳ chọn — giúp user yên tâm điền tối thiểu mà không cần thử submit để biết.

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - Thêm 1 dòng/khối nhỏ (`text-muted` hoặc `card` nhẹ, đặt gần đầu form, dưới `<h2>` hoặc trước trường đầu tiên) — nội dung tĩnh, đúng thực tế đã xác nhận: "Chỉ Loại phòng là bắt buộc — mọi thông tin khác đều tuỳ chọn, điền càng nhiều AI càng thiết kế sát ý bạn."
  - KHÔNG cần tính toán động theo trạng thái form — đây là thông tin TĨNH mô tả cấu trúc form (bắt buộc/tuỳ chọn không đổi theo input), không phải validate summary (khác TASK-155 "N mục lỗi" — đó là báo lỗi SAU submit, đây là hướng dẫn TRƯỚC submit).

## Out of scope

- Không đổi `required`/`min`/`max`/validation hiện có (TASK-153/155) — chỉ thêm dòng thông tin tĩnh.
- Không đổi `maxLength`/đếm ký tự (TASK-158) — không liên quan.
- Không phải "Room Form Sticky Section Header" (ý khác cùng batch ChatGPT round 33) — vét trước đã xác nhận PREMISE SAI (form hiện không có `<h3>`/section heading nào để sticky, chỉ có `<h2>` tiêu đề trang + các `.form-group` phẳng) — KHÔNG làm ý đó trong task này, để dành backlog nếu sau này thật sự tái cấu trúc form thành section.

## Dependencies

`RoomNew.jsx` (cấu trúc form hiện có, không đổi), `CreateRoomRequest.java` (đã đọc để xác nhận số liệu thật).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Mở `/rooms/new` → dòng tóm tắt "Chỉ Loại phòng là bắt buộc..." hiện đúng vị trí, đọc rõ ràng.
- Không hồi quy: submit form (tối thiểu chỉ Loại phòng + ảnh vẫn hoạt động đúng như cũ — TASK-153), Enter chuyển field (TASK-153), "N mục lỗi" (TASK-155), đếm ký tự (TASK-158).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`Dashboard.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-160/162.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`/`Dashboard.jsx`. Agent thêm 1 dòng `<p className="text-muted">` tĩnh ngay sau `<h2>`, trước cả banner khôi phục bản nháp — nội dung: "Chỉ **Loại phòng** là bắt buộc — mọi thông tin khác đều tuỳ chọn, điền càng nhiều AI càng thiết kế sát ý bạn." Không đụng `required`/`maxLength`/section heading nào.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS (cùng lượt với TASK-160/162).

Verify E2E qua Claude in Chrome: mở `/rooms/new` → dòng tóm tắt hiện đúng ngay dưới tiêu đề trang, đọc đúng nội dung đã xác nhận. Không hồi quy: đếm ký tự "0/500 ký tự" v.v. (TASK-158) vẫn hiện đúng, `required` chỉ ở "Loại phòng *", bản nháp tự lưu vẫn hoạt động bình thường. Console sạch lỗi.

## Status

COMPLETED
