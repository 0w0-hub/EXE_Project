# TASK-077

## Title

So sánh song song 2 phương án thiết kế (Compare Designs)

## Goal

Tiếp tục vòng lặp tự động nâng cấp dự án (chưa dừng — xem `[[feedback_autonomous_3d_upgrade_loop]]` trong memory). User yêu cầu dùng Claude in Chrome hỏi ChatGPT ý tưởng nâng cấp rồi tự động thực hiện bằng nhiều agent, làm đến khi user báo dừng. Đã hỏi ChatGPT (phiên hội thoại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) 6 ý tưởng nâng cấp — chọn ý tưởng "Compare Designs" vì độ phức tạp Trung bình, thuần frontend, không phụ thuộc AI/API trả phí, giải quyết vấn đề thật: user tạo nhiều phương án (nhiều job cho cùng 1 phòng hoặc nhiều phòng) nhưng chưa có cách xem 2 phương án cạnh nhau để quyết định.

## Scope

- Trang mới `frontend/src/pages/CompareDesigns.jsx`, route `/compare?a={jobId1}&b={jobId2}` (query param, không phải path param — vì đây là view tổng hợp 2 job, không thuộc về 1 job cụ thể).
  - Gọi lại đúng API đã có (`designApi`/tương đương trong `frontend/src/services/api.js` — đọc file này trước để biết đúng tên hàm/endpoint, KHÔNG bịa endpoint mới) để lấy `DesignJobResponse` của cả 2 `jobId` song song.
  - Hiển thị 2 cột cạnh nhau (responsive: xuống 1 cột trên mobile theo quy ước `@media (max-width: 640px)` đã có ở `styles.css`, xem TASK-073): ảnh AI 2D mỗi bên (dùng `assetApi.fetchObjectUrl` như `DesignResult.jsx` đang làm — ảnh cần auth header, không dùng `<img src=".../assets/...">` trực tiếp), phong cách, màu sắc, số món nội thất, chi phí ước tính, diện tích phòng.
  - 1 khối tóm tắt khác biệt tính THUẦN CLIENT-SIDE (không gọi AI mới) — vd "Phương án A có N món, ước tính X đ; Phương án B có M món, ước tính Y đ — rẻ hơn/đắt hơn Z đ", so sánh diện tích phòng nếu khác nhau.
  - Nếu thiếu 1 trong 2 `jobId` (query param rỗng/job không tồn tại/không thuộc user) → thông báo lỗi rõ ràng, không crash trắng trang.
- `Projects.jsx`: thêm checkbox "Chọn để so sánh" trên mỗi thẻ project (card grid có sẵn từ TASK-017), giới hạn tối đa 2 lựa chọn cùng lúc (chọn thêm cái thứ 3 thì bỏ chọn cái đầu tiên hoặc disable — tự quyết định UX hợp lý, ghi rõ trong task testing), nút nổi "So sánh N/2 phương án đã chọn" chỉ bật khi đã chọn đủ 2, điều hướng sang `/compare?a=...&b=...`.
- `App.jsx`: thêm route mới, đặt cạnh route `/designs/...` hiện có — đọc file trước để theo đúng cấu trúc `<Route>` hiện tại (kể cả việc có `ProtectedRoute` wrapper hay không, theo đúng các route khác đã yêu cầu đăng nhập).

## Out of scope

- Không so sánh > 2 phương án cùng lúc.
- Không gọi AI để tự sinh nhận xét so sánh (đúng như ý tưởng gốc ghi "AI tự tóm tắt" nhưng dự án hiện KHÔNG có key Replicate thật — làm tóm tắt thuần rule-based/arithmetic từ dữ liệu đã có, không bịa AI call).
- Không sửa `Room3DViewer.jsx` hay `DesignResult.jsx` (route riêng biệt, tái sử dụng cách gọi API/asset đã có, không đụng file đó — tránh xung đột với các thay đổi khác đang làm song song trong cùng đợt nâng cấp này).
- Không đổi backend (chỉ dùng API đã có sẵn).

## Dependencies

TASK-011 (endpoint preference), `DesignResult.jsx` (pattern tải ảnh AI qua `assetApi.fetchObjectUrl`), TASK-017 (Projects card grid).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Từ trang Projects, chọn đúng 2 project (job đã COMPLETED) → bấm nút so sánh → điều hướng đúng URL `/compare?a=...&b=...`.
- Trang so sánh hiển thị đúng dữ liệu THẬT của cả 2 job (không phải dữ liệu giả/hard-code) cạnh nhau.
- Khối tóm tắt khác biệt tính đúng theo số liệu thật (kiểm chứng bằng phép trừ tay so với số hiển thị).
- Thiếu/sai jobId trong URL → thông báo lỗi, không crash trắng trang (kiểm tra bằng cách tự sửa query param thành UUID không tồn tại).
- Console sạch lỗi.

## Testing

Tự verify tối thiểu bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/rebuild Docker (agent điều phối sẽ gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ đợt nâng cấp này sau khi các agent song song hoàn thành, tránh xung đột port/container khi nhiều agent cùng thao tác Docker). Nếu cần dữ liệu thật để tự kiểm tra logic (vd đọc response mẫu), dùng `curl` gọi thẳng backend đang chạy sẵn ở `http://localhost:8080` (đã có tài khoản test `task076-tester@example.com`, hoặc tự đăng ký tài khoản mới qua API).

## Status

COMPLETED

## Coordinator verification (sau khi agent implement xong)

Rebuild Docker (`docker compose up -d --build`, gộp chung với TASK-078/079) + verify E2E qua Claude in Chrome:
- Dùng đúng 2 job thật agent đã tạo sẵn (`task077-tester@example.com`) — mở `/compare?a=f0909968-...&b=bda0d4a5-...`: hiển thị đúng 2 cột, khối "Khác biệt" tính đúng "đắt hơn 8.000.000 đ" (16tr vs 8tr) + "chênh 8 m²" (20m² vs 12m²) — khớp phép trừ tay.
- Test case bằng nhau: so sánh 2 job cùng chi phí 8.000.000đ → hiện đúng "hai phương án chi phí ước tính bằng nhau" (không rơi vào nhánh "đắt hơn/rẻ hơn" sai).
- Test lỗi: 1 jobId là UUID không tồn tại → cột đó hiện "Design job not found" (message thật từ API), cột còn lại vẫn render bình thường, không crash trắng trang.
- Luồng chọn từ Projects: tick 2 checkbox "Chọn để so sánh" → nút nổi "So sánh 2/2 phương án đã chọn" hiện đúng, bấm điều hướng đúng `/compare?a=...&b=...`.
- Console sạch lỗi (`read_console_messages`, `onlyErrors: true`) qua toàn bộ chuỗi thao tác trên.
- **Phát hiện + sửa 1 lỗi thật lúc verify**: `.compare-col-img` (CSS mới, `display: block`) đứng SAU `.room-card-photo-placeholder` (`display: flex`) trong `styles.css` — khi job không có `resultAssetId` (mock provider), 2 class cùng gắn 1 div khiến `display: block` thắng (thứ tự trong file, cùng độ đặc hiệu), icon 🖼️ bị dạt lên góc trên-trái thay vì căn giữa khung ảnh. Sửa bằng selector kết hợp `.room-card-photo-placeholder.compare-col-img { display: flex; ... }` (độ đặc hiệu cao hơn, không cần đổi thứ tự 2 rule gốc) — verify lại bằng zoom screenshot xác nhận icon đã căn giữa đúng.
