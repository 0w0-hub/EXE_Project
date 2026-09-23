# TASK-100

## Title

Thiết kế chỉnh sửa gần đây / Tiếp tục thiết kế (Recently Edited / Continue Designing)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 8 — ý tưởng "Recently Edited / Continue Designing" ChatGPT đề xuất mới (hỏi lại ngày 2026-09-17). Vấn đề thật: user có nhiều phòng/thiết kế (xem tài khoản `task077-tester@example.com` với nhiều project), Dashboard hiện chỉ liệt kê PHÒNG (không phải thiết kế/job) dạng lưới không có thứ tự ưu tiên theo thời gian — muốn quay lại đúng thiết kế đang làm gần nhất phải tự lướt tìm.

## Scope

- Kiểm tra kỹ API hiện có trước khi thêm mới: đọc `frontend/src/services/api.js` xem đã có hàm nào liệt kê design job kèm `updatedAt`/`createdAt` chưa (ví dụ `designJobApi`/tương đương nếu có — có thể trang Projects đã dùng 1 endpoint liệt kê job). Nếu ĐÃ có endpoint liệt kê job của user (kèm đủ `id`, `roomId`, `status`, `updatedAt`), CHỈ cần thêm logic sắp xếp/lọc + component mới ở frontend, KHÔNG thêm backend. Nếu CHƯA có, thêm 1 endpoint nhỏ (ví dụ mở rộng `DesignController`/`DesignService` có sẵn — KHÔNG tạo package/bảng mới) trả danh sách tối đa 5 job `status IN (PROCESSING, COMPLETED)` của user, sắp theo `updatedAt` giảm dần, kèm đủ thông tin để render (id, roomType lấy từ room liên kết, status, updatedAt).
- Frontend: component mới `frontend/src/components/RecentDesigns.jsx` (hoặc tên tương đương) — hiển thị 3-5 thẻ nhỏ (loại phòng, trạng thái, thời gian tương đối kiểu "2 giờ trước"/"hôm qua" tính từ `updatedAt` THẬT, không bịa), click vào thẻ điều hướng đúng `/designs/{jobId}` (dùng route jobId thuần, không cần slug — route slug TASK-023 tự hoạt động khi vào đúng jobId qua redirect có sẵn nếu có, không bắt buộc tạo slug ở đây).
- **CHỈ sửa `frontend/src/pages/Dashboard.jsx` ở ĐÚNG 1 VỊ TRÍ**: chèn section mới ngay SAU khối chào mừng + ô tìm kiếm (kết thúc bằng thẻ đóng `</div>` của `.section-tint`, dòng ~113 tại thời điểm viết task này, phải tự đọc lại file thật để xác nhận số dòng chính xác) và TRƯỚC khối `{usage && subscription && (...)}`. KHÔNG sửa khối stat-tile hay bất kỳ chỗ nào khác trong file này (một task khác — TASK-099 — cũng đang sửa file này ở vị trí KHÁC, phía dưới khối stat-tile; đọc lại file trước khi lưu để tránh ghi đè thay đổi của task kia nếu nó xong trước).
- Nếu user chưa có job nào PROCESSING/COMPLETED → ẩn hẳn section này (không hiện khung rỗng).

## Out of scope

- Không đổi lưới danh sách PHÒNG hiện có ở Dashboard (phần dưới cùng) — đây là danh sách JOB/THIẾT KẾ riêng biệt, không thay thế.
- Không thêm phân trang/xem tất cả — chỉ top 3-5, đủ cho mục đích "tiếp tục nhanh".
- Không đổi trang Projects (đã có danh sách đầy đủ + tìm kiếm từ TASK-080).

## Dependencies

Không phụ thuộc TASK-099/TASK-101 (chạy song song) nhưng CÙNG sửa `frontend/src/pages/Dashboard.jsx` với TASK-099 — xem rõ vị trí chèn ở mục Scope để không xung đột.

## Affected Services

Frontend (`Dashboard.jsx` 1 vị trí, 1 component mới) + Backend CHỈ NẾU chưa có endpoint phù hợp (mở rộng file có sẵn, không tạo package/bảng mới).

## Acceptance Criteria

- Tài khoản có nhiều job (`task077-tester@example.com`) → section hiện đúng tối đa 5 job gần nhất theo `updatedAt` thật, đúng thứ tự mới nhất trước; click vào 1 thẻ điều hướng đúng trang kết quả thiết kế đó.
- Tài khoản mới/chưa có job PROCESSING/COMPLETED nào → section ẩn hoàn toàn, không có khung rỗng gây khó chịu.
- `mvn test` PASS (nếu có đổi backend), `npm run build` PASS.
- Không đổi hành vi Projects/danh sách phòng hiện có.

## Testing

- Tự verify qua Docker + browser hoặc `curl` (JWT thật) — xác nhận đúng thứ tự + số lượng + link điều hướng đúng.
- Không cần Claude-in-Chrome bắt buộc (coordinator sẽ tự verify UI thật ở vòng gộp cuối round), nhưng KHUYẾN KHÍCH tự verify qua browser nếu có kết nối vì đây là tính năng điều hướng trực tiếp.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ, verify E2E thật qua Claude in Chrome (`task077-tester@example.com`) — Dashboard hiện đúng section "Tiếp tục thiết kế" ngay dưới khối chào mừng/tìm kiếm, trước khối stat-tile: 5 thẻ đúng thứ tự mới nhất trước ("59 phút trước", "1 giờ trước" ×2, "2 giờ trước" ×2 — thời gian tương đối tính đúng từ `updatedAt` thật), đúng badge "Hoàn thành". Bấm vào 1 thẻ điều hướng đúng `/designs/{jobId}` (xác nhận qua URL thay đổi đúng). Xác nhận đúng ở light/dark mode. Console sạch lỗi. Không phát hiện lỗi mới.
