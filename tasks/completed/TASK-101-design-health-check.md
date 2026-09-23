# TASK-101

## Title

Kiểm tra thiết kế trước khi hoàn tất (Project Health Check)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 8 — ý tưởng "Project Health Check" ChatGPT đề xuất mới (hỏi lại ngày 2026-09-17). Vấn đề thật: trang kết quả thiết kế (`DesignResult.jsx`) đã có "checklist yêu cầu" (TASK-015 — chỉ HIỂN THỊ LẠI sở thích user đã nhập, không phải cảnh báo/kiểm tra), nhưng chưa có cảnh báo chủ động khi thiết kế có vấn đề thật (thiếu ảnh phòng gốc, chưa có nội thất nào, vượt ngân sách) trước khi user coi là "xong" (chia sẻ/in/xuất).

## Scope

- Component mới `frontend/src/components/DesignHealthCheck.jsx` (thuần frontend, KHÔNG cần backend — mọi dữ liệu cần thiết đã được `DesignResult.jsx` load sẵn qua state `job`/`room`/`preference`, đọc kỹ code hiện có trước khi viết để dùng đúng field thật, không đoán tên field).
- Các mục kiểm tra (chỉ dùng dữ liệu THẬT đã có, không bịa thêm nghiệp vụ mới):
  - Thiếu ảnh phòng gốc: `room.photoAssetId` rỗng/null.
  - Chưa có nội thất nào trong kết quả: mảng nội thất (đọc đúng field thật trên `job.result`, ví dụ tương tự cách `budget-breakdown` ở dòng ~379 dùng) rỗng.
  - Vượt ngân sách: dùng lại ĐÚNG logic so sánh đã có ở khối "budget-bar" hiện tại (`job.result.estimatedCost > preference.budget`) — không viết lại công thức khác gây sai lệch với khối budget đã hiển thị.
  - Chưa đặt ngân sách: `preference?.budget` rỗng/null/0 (không phải lỗi, chỉ là gợi ý thông tin — style nhẹ hơn, không dùng màu cảnh báo đỏ).
  - Job chưa `COMPLETED` (đang `PROCESSING`/`FAILED`): chỉ hiện 1 dòng trạng thái tương ứng, không hiện các mục kiểm tra khác (vì dữ liệu result chưa đầy đủ/không tồn tại).
- Mỗi mục CÓ vấn đề hiện dòng cảnh báo ngắn + (nếu hợp lý) link/nút điều hướng tới đúng chỗ có thể sửa (ví dụ thiếu ảnh → không có hành động sửa trực tiếp vì ảnh gắn từ lúc tạo phòng, chỉ hiện thông tin; vượt ngân sách → có thể link cuộn tới khối "Live Budget Guard" trong `Room3DViewer` đã có ở TASK-079 nếu khả thi, không bắt buộc).
- Nếu KHÔNG có vấn đề nào (mọi mục đều pass) → hiện 1 dòng xác nhận ngắn gọn tích cực (ví dụ "✓ Thiết kế đã sẵn sàng"), không ẩn hẳn component (khác với TASK-099/TASK-100 vì đây là xác nhận trạng thái, không phải danh sách có thể rỗng).
- Vị trí chèn trong `frontend/src/pages/DesignResult.jsx`: đặt NGAY SAU tiêu đề/thanh hành động đầu trang (chia sẻ/in/duplicate), TRƯỚC khối "Trước/Sau" — đọc lại file thật để xác định đúng vị trí (không phải task nào khác đang sửa file này trong round này, ít rủi ro xung đột, nhưng vẫn phải đọc file mới nhất trước khi lưu theo quy ước chung).

## Out of scope

- Không sửa lại khối "checklist yêu cầu" đã có (TASK-015) — đây là tính năng khác (hiển thị lại input, không phải cảnh báo).
- Không thêm nút "Fix" tự động sửa lỗi (ví dụ tự thêm nội thất) — chỉ cảnh báo + điều hướng, không tự ý thay đổi dữ liệu thiết kế.
- Không đổi logic tính `estimatedCost`/budget hiện có, chỉ ĐỌC LẠI để hiển thị cảnh báo.

## Dependencies

Không phụ thuộc TASK-099/TASK-100 (chạy song song, không đụng chung file `DesignResult.jsx`).

## Affected Services

Frontend only (`DesignResult.jsx` 1 vị trí + 1 component mới).

## Acceptance Criteria

- Job COMPLETED có đủ ảnh + nội thất + trong ngân sách → hiện đúng dòng xác nhận tích cực, không cảnh báo giả.
- Job COMPLETED vượt ngân sách (có thể tạo job test mới với budget thấp, tương tự cách TASK-079 đã test) → hiện đúng cảnh báo vượt ngân sách, số liệu khớp khối budget-bar hiện có (không lệch nhau).
- Job PROCESSING/FAILED (nếu tái tạo được, hoặc review code xác nhận đúng logic) → chỉ hiện dòng trạng thái tương ứng, không crash/không hiện các mục kiểm tra sai ngữ cảnh.
- `npm run build` PASS. Không đổi hành vi các khối khác trên trang (Trước/Sau, budget breakdown, checklist yêu cầu, chia sẻ/in, 3 tab 3D/2D/sơ đồ).

## Testing

- Tự verify qua Docker + browser thật với ít nhất 1 job trong ngân sách + 1 job vượt ngân sách (tạo qua API nếu cần, giống pattern nhiều task trước — `AI_PROVIDER=mock`).
- Không cần Claude-in-Chrome bắt buộc (coordinator sẽ tự verify UI thật ở vòng gộp cuối round), nhưng KHUYẾN KHÍCH tự verify qua browser nếu có kết nối.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ, verify E2E thật qua Claude in Chrome (`task077-tester@example.com`, 2 job COMPLETED khác nhau) — card "🩺 Kiểm tra thiết kế" hiện đúng vị trí (ngay sau thanh hành động, trước "Phương án decor"), đúng cảnh báo thật "⚠️ Thiếu ảnh phòng gốc..." (card đỏ `card--danger`) cho cả 2 job test (phòng thật của tài khoản test đều chưa gắn ảnh — dữ liệu thật, không phải giả lập). Xác nhận đúng ở dark mode (nền đỏ đậm hơn, chữ vẫn đọc rõ, không vỡ layout). Console sạch lỗi. Case "vượt ngân sách"/"mọi thứ ổn" đã được agent tự verify kỹ qua script Node đối chiếu logic thật (giới hạn mock provider không tạo được job COMPLETED tự nhiên vượt ngân sách qua UI, coordinator không verify lại case này qua UI thật vì lý do tương tự). Không phát hiện lỗi mới.
