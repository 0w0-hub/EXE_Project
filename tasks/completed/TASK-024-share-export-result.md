# TASK-024

## Title

Chia sẻ liên kết + xuất/in trang Kết quả thiết kế

## Goal

Theo lựa chọn user khi làm rõ "tiếp tục nâng cấp trang thiết kế" — thêm nút chia sẻ link (dùng luôn slug từ TASK-023) và nút xuất/in kết quả, không cần thư viện mới (giữ đúng nguyên tắc dự án tối giản dependency).

## Scope

- `DesignResult.jsx`: thêm 2 nút "🔗 Chia sẻ" (copy `window.location.href` vào clipboard qua `navigator.clipboard.writeText`, hiện "Đã sao chép liên kết!" tạm 2 giây) và "🖨️ In / Xuất PDF" (`window.print()`) — chỉ hiện khi `job.status === 'COMPLETED'`.
- `styles.css`: thêm khối `@media print` — ẩn `.no-print`, `.navbar`, bỏ shadow/border của `.card` khi in. Đánh dấu `no-print` cho: khối nút chia sẻ/in, thanh kéo so sánh (`compare-slider__range`), toàn bộ khối "Không gian 3D" (`Room3DViewer` — canvas WebGL in ra không đáng tin cậy qua các trình duyệt, ẩn hẳn khi in/xuất).

## Out of scope

- Không dùng thư viện xuất PDF/canvas (jsPDF, html2canvas...) — dùng tính năng "In → Lưu dưới dạng PDF" có sẵn của trình duyệt qua `window.print()`, không thêm dependency.
- Không tuỳ biến layout in sâu hơn (vd 2 cột, ngắt trang thủ công) — chỉ ẩn phần không có ý nghĩa khi in.

## Dependencies

TASK-023 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút chia sẻ/in chỉ hiện khi job COMPLETED; đúng class `no-print` áp dụng cho các phần tử dự kiến (xác nhận qua `querySelectorAll('.no-print')`).
- CSS `@media print` tồn tại đúng trong stylesheet đã build (xác nhận qua CSSOM `document.styleSheets`).
- Console sạch lỗi.

## Testing

- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật: 2 nút hiện đúng vị trí (góc phải tiêu đề); `querySelectorAll('.no-print')` trả đúng 3 phần tử (khối nút, thanh range so sánh, khối Room3DViewer).
- Verify `@media print` rule tồn tại đúng qua CSSOM, selector khớp `.no-print, .navbar, body, .card`.
- **Không** click trực tiếp nút "In / Xuất PDF" trong phiên test tự động (mở dialog in gốc của trình duyệt — dialog modal có thể làm treo phiên điều khiển trình duyệt tự động, tương tự `alert()`) — verify gián tiếp qua CSS/class như trên thay vì kích hoạt dialog thật.
- Thử nút "Chia sẻ" qua browser thật: `navigator.clipboard.writeText` bị môi trường test tự động chặn (lỗi "Document is not focused" / yêu cầu cấp quyền clipboard-read khi thử xác minh bằng `readText()` khiến trang treo tạm — đã tránh gọi lại), đây là giới hạn đã biết của môi trường điều khiển trình duyệt tự động (CDP không giữ focus thật + chính sách quyền clipboard), không phải lỗi code — logic `writeText` là API chuẩn, hoạt động bình thường với thao tác click thật của người dùng.

## Status

COMPLETED
