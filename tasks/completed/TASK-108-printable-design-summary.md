# TASK-108

## Title

Trang tóm tắt thiết kế để in/lưu hồ sơ (Print-friendly Design Summary)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 12 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 7 ngày 2026-09-17). Vấn đề thật: `DesignResult.jsx` đã có nút in (TASK-024) nhưng in ra đúng NGUYÊN TRANG hiển thị (before/after, khung 3D, biểu đồ ngân sách) — phù hợp XEM nhưng không tối ưu để LƯU HỒ SƠ/đưa cho thợ thi công tham khảo (nhiều phần trực quan không cần thiết khi in, thiếu bảng liệt kê đầy đủ nội thất+giá dạng văn bản rõ ràng, thiếu yêu cầu gốc user đã nhập).

## Scope

- Trang mới `frontend/src/pages/DesignSummary.jsx`, route mới `/designs/{jobId}/summary` trong `App.jsx` (đặt cạnh route `/designs/{jobId}` hiện có, cùng yêu cầu đăng nhập + kiểm tra ownership giống route đó — đọc kỹ cách `DesignResult.jsx` gọi API/xử lý lỗi 403/404 để tái dùng đúng pattern).
- Nội dung trang (TOÀN BỘ dữ liệu THẬT đã có qua API hiện có — `GET /designs/jobs/{jobId}`, `GET /rooms/{roomId}/preferences/{preferenceId}` — KHÔNG bịa thêm field mới, không gọi thêm endpoint mới):
  - Tiêu đề: loại phòng + phong cách + ngày tạo.
  - Thông tin phòng: kích thước, ảnh gốc (nếu có).
  - Yêu cầu gốc đã nhập lúc tạo (style/màu sắc mong muốn/nội thất mong muốn/ngân sách/yêu cầu tự do) — dùng lại đúng dữ liệu đã hiển thị ở khối "checklist yêu cầu" (TASK-015) trên `DesignResult.jsx`, KHÔNG suy diễn thêm.
  - Bảng danh sách nội thất đầy đủ (tên, loại, giá ước tính) + tổng chi phí — dùng đúng dữ liệu `job.result.furniture`/`estimatedCost` đã có, KHÔNG dùng `localFurniture` tạm thời của `Room3DViewer` (đó là state phiên xem, không phải nguồn sự thật lâu dài — trang tóm tắt này phải phản ánh đúng kết quả AI THẬT đã lưu).
  - Phương án decor (mô tả text `decorDescription` đã có).
- Nút "🖨️ In trang tóm tắt" gọi `window.print()`. CSS in ấn (`@media print`) tối giản — ẩn NavBar/nút bấm, chỉ in đúng nội dung tóm tắt, đúng tinh thần đã thiết lập ở TASK-024/036 (đọc lại 2 rule đó trong `styles.css` để tái dùng đúng class `no-print` có sẵn, không tạo class trùng lặp chức năng).
- Thêm nút/link "📋 Tóm tắt để in" trên `DesignResult.jsx` (cạnh nút "🖨️ In / Xuất PDF" đã có) điều hướng sang trang mới này.

## Out of scope

- Không tạo file PDF thật ở backend (dùng đúng cơ chế `window.print()` → "Save as PDF" của trình duyệt, giống TASK-024 đã làm, không thêm thư viện PDF mới).
- Không đổi nút "🖨️ In / Xuất PDF" hiện có trên `DesignResult.jsx` (giữ nguyên hành vi cũ — in nguyên trang trực quan) — đây là trang RIÊNG, bổ sung thêm lựa chọn, không thay thế.
- Không hiển thị giá thay thế/gợi ý mua sắm — CHỈ hiển thị đúng dữ liệu giá đã có trong `job.result` (nguyên tắc "không bịa dữ liệu giá/nguồn cung" xuyên suốt dự án).
- Không đổi `Room3DViewer.jsx`.

## Dependencies

TASK-011 (preference thật), TASK-015 (checklist yêu cầu — nguồn tham khảo cấu trúc dữ liệu), TASK-024/036 (cơ chế in `@media print` có sẵn).

## Affected Services

Frontend only (trang mới + 1 route mới + 1 nút mới trên `DesignResult.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Vào `/designs/{jobId}/summary` với job thật COMPLETED → hiện đầy đủ đúng dữ liệu thật (đối chiếu khớp với dữ liệu hiển thị trên `DesignResult.jsx` của CÙNG job đó — không lệch số liệu).
- Job của user khác → 403/404 đúng (không rò rỉ dữ liệu xuyên chủ sở hữu).
- Bấm "🖨️ In trang tóm tắt" → xác nhận qua CSSOM có rule `@media print` ẩn đúng phần không cần thiết (không cần thao tác in thật — tránh treo phiên tự động, đúng kinh nghiệm TASK-024/036 đã ghi).
- Không hồi quy nút "🖨️ In / Xuất PDF" cũ trên `DesignResult.jsx`.
- Console sạch lỗi.

## Testing

Tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối, bao gồm đối chiếu số liệu giữa 2 trang).

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker đầy đủ. Verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật `c54b3649-...`) — trang kết quả có đúng nút "📋 Tóm tắt để in" cạnh nút in cũ; vào `/designs/{jobId}/summary` → hiện đúng đầy đủ: tiêu đề loại phòng+phong cách, thông tin phòng, checklist yêu cầu gốc (5 mục: phong cách/màu sắc/nội thất mong muốn/ngân sách/yêu cầu thêm — khớp 100% dữ liệu thật đã xác nhận qua curl), phương án decor, bảng nội thất đầy đủ (tên/loại/giá). Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
