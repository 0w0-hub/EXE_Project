# TASK-155

## Title

Tóm tắt số trường lỗi + Cuộn về đầu khi có lỗi trong form tạo phòng

## Goal

Gộp 2 ý tưởng từ ChatGPT round 31 (cùng batch TASK-154), đã vét trước qua Explore agent — cả 2 đều CHƯA CÓ, cùng đụng `RoomNew.jsx`:

- "Create Form Invalid Summary" — khi form có NHIỀU trường không hợp lệ (validation HTML5 gốc đã thêm từ TASK-153), hiện 1 dòng tóm tắt "Vui lòng kiểm tra N mục" ở đầu form. VẪN dùng validation HTML5 hiện có (`required`/`min`/`max`), KHÔNG viết engine validate JS mới — chỉ ĐỌC kết quả qua Constraint Validation API gốc của trình duyệt (`form.checkValidity()`/duyệt `form.elements` lọc `:invalid`) lúc submit thất bại.
- "Create Form Back-to-Top on Error" — lỗi chung (`error` state từ catch API, hiện chỉ render `<p className="error-text">{error}</p>` gần cuối form, KHÔNG có `scrollIntoView`/`scrollTo` nào) → tự cuộn tới đúng vị trí lỗi khi xảy ra, đặc biệt hữu ích trên mobile khi lỗi nằm dưới khung nhìn hiện tại.

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - **Tóm tắt lỗi validation**: bắt sự kiện `onInvalid`/kiểm tra `formRef.current.checkValidity()` NGAY TRƯỚC bước xử lý submit hiện có (không thay thế, chỉ đọc thêm) — nếu KHÔNG hợp lệ, đếm số phần tử khớp `formRef.current.querySelectorAll(':invalid')`, hiện dòng "⚠️ Vui lòng kiểm tra N mục" ở ĐẦU form (trên "Loại phòng"), rồi để trình duyệt tự xử lý phần còn lại (focus/scroll field lỗi đầu tiên như TASK-153 đã có). Dòng tóm tắt tự ẩn khi form lại hợp lệ/user đã sửa xong (không cần chính xác tuyệt đối thời gian thực — ẩn khi submit lại thành công hoặc số lượng invalid về 0 là đủ).
  - **Cuộn tới lỗi chung**: khi `error` (state lỗi từ catch API) được set khác `null`, gọi `scrollIntoView({ behavior: 'smooth', block: 'center' })` trên phần tử hiện dòng lỗi đó (dùng `ref`, qua `useEffect` theo dõi `error`).

## Out of scope

- KHÔNG viết engine validate JS tuỳ chỉnh mới — chỉ đọc kết quả Constraint Validation API gốc.
- KHÔNG đụng banner khôi phục bản nháp (`draftBanner`) hay nút "Xoá thiết lập" (TASK-149).
- KHÔNG đổi `required`/`min`/`max` đã có từ TASK-153.

## Dependencies

`RoomNew.jsx` (validation HTML5 từ TASK-153, `handleSubmit`/`error` state hiện có), Constraint Validation API gốc trình duyệt (`checkValidity()`, `:invalid`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Để trống nhiều trường bắt buộc (vd loại phòng chưa chọn) → bấm submit → dòng "⚠️ Vui lòng kiểm tra N mục" hiện đúng số N ở đầu form.
- Điền đủ + hợp lệ toàn bộ → submit thành công như cũ (không hồi quy luồng tạo phòng).
- Gây lỗi API thật (vd tạm ngắt mạng hoặc mock lỗi) → dòng lỗi chung hiện ra → trang tự cuộn tới đúng vị trí dòng lỗi đó.
- Không hồi quy: `required`/`min`/`max` (TASK-153), Enter-to-Advance (TASK-153), banner khôi phục bản nháp, nút "Xoá thiết lập" (TASK-149), sticky mobile submit (TASK-149).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`Dashboard.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-154/156.

## Coordinator verification

Dispatch cho 1 agent (`RoomNew.jsx` riêng, song song TASK-154/156). **Điểm khó nhất giải quyết đúng**: React's `onInvalid` không bubble từ input con lên `<form>`, và khi form có field `:invalid`, sự kiện `submit` bị trình duyệt CHẶN HOÀN TOÀN (không bao giờ tới `handleSubmit`) — nên không thể "check ở đầu handleSubmit" như dự kiến ban đầu. Agent tự phát hiện + xử lý đúng: gắn `addEventListener('invalid', ..., true)` (capture phase) trực tiếp lên DOM `<form>` qua `formRef`, đếm lại `querySelectorAll(':invalid').length` mỗi lần 1 field bắn `invalid` — không gọi `preventDefault()` trên sự kiện đó nên hành vi focus+scroll gốc của trình duyệt (TASK-153) vẫn nguyên vẹn. Tóm tắt CHỈ cập nhật lại khi có LẦN SUBMIT MỚI (không real-time theo từng field sửa) — đúng ý "không cần chính xác tuyệt đối thời gian thực" trong Acceptance Criteria. `npm run build` PASS.

Coordinator verify: build tổng hợp 3 task PASS. Docker rebuild frontend + Playwright TASK-098 (3/3 PASS — **QUAN TRỌNG**: không lặp lại regression round trước, do task này KHÔNG đụng `required`/`min`/`max` đã có, chỉ ĐỌC kết quả). Verify E2E qua Claude in Chrome: bấm submit khi chưa chọn loại phòng → "⚠️ Vui lòng kiểm tra 1 mục" hiện đúng; chọn loại phòng (chưa submit lại) → dòng tóm tắt CÒN NGUYÊN (đúng thiết kế, chỉ cập nhật ở lần submit tiếp theo); bấm submit lại → dòng tóm tắt biến mất ĐÚNG, form submit thành công, điều hướng đúng sang trang kết quả (xác nhận luồng tạo phòng CHÍNH không hồi quy, khác lỗi TASK-153 round trước). Console sạch lỗi.

## Status

COMPLETED
