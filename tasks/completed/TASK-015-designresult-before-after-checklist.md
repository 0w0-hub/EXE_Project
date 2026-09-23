# TASK-015

## Title

Kết quả thiết kế: khối Trước/Sau, thanh ngân sách, checklist yêu cầu (dùng data thật)

## Goal

Thêm 3 khối trực quan vào `DesignResult.jsx` dựa hoàn toàn trên dữ liệu thật đã có (không bịa): so sánh ảnh trước/sau, thanh ngân sách vs chi phí ước tính, checklist yêu cầu đã nhập.

## Scope

- `DesignResult.jsx`: fetch thêm `preference` thật qua `roomApi.getPreference(job.roomId, job.preferenceId)` khi `job.status==='COMPLETED' && job.preferenceId`.
- Khối "Trước / Sau": ảnh gốc (`room.photoAssetId`) + ảnh AI (`job.result.resultAssetId`), thanh `<input type="range">` điều khiển `clip-path` — chỉ hiện khi có đủ cả 2 ảnh.
- Khối "Ngân sách": progress bar `estimatedCost` so với `preference.budget` — chỉ hiện khi `preference?.budget` có giá trị.
- Khối "Yêu cầu đặc thù": liệt kê các field có giá trị thật trong `preference` (`style, preferredColors, desiredFurniture, freeTextRequest`) dạng checklist — ẩn field nào không có giá trị, ẩn cả khối nếu không có field nào.
- `styles.css`: thêm `.compare-slider`, `.budget-bar`, `.requirement-item`.

## Out of scope

- Không đổi bảng nội thất, swatch màu AI, giải thích AI, `Room3DViewer`.

## Dependencies

TASK-011 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật: job có preference đầy đủ (style/budget đã nhập ở TASK-013 test) → hiển thị đúng cả 3 khối với dữ liệu thật; kéo thanh so sánh đổi đúng tỉ lệ hiển thị ảnh trước/sau; không lỗi khi thiếu field.

## Testing

- `npm run build` PASS.
- E2E thật qua Docker + browser, dùng 2 job thật:
  - Job không có ảnh phòng (chỉ có style+budget): khối "Trước/Sau" tự ẩn đúng (không đủ dữ liệu); khối "Yêu cầu đặc thù đã xem xét" hiện đúng 1 dòng "Phong cách mong muốn: Japandi"; thanh ngân sách hiện đúng 20.000.000đ/25.000.000đ (80%, màu accent vì chưa vượt).
  - Job mới có upload ảnh phòng thật: khối "Trước/Sau" hiện đúng 2 ảnh (nhãn "Sau (AI)"/"Trước"), kéo thanh range (test bằng dispatch event JS, xác nhận qua `clip-path` style đổi đúng `inset(0 80% 0 0)` khi range=20) — cơ chế so sánh hoạt động đúng.
  - Console sạch lỗi cả 2 job.
- Ghi chú môi trường: công cụ chụp màn hình CDP bị timeout không ổn định trong phiên (không liên quan tới thay đổi code) — đã dùng `javascript_tool` để xác nhận trực tiếp DOM/style khi ảnh chụp không khả dụng.

## Status

COMPLETED
