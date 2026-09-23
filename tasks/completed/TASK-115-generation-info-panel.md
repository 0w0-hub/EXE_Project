# TASK-115

## Title

Thông tin kỹ thuật của thiết kế (Design Generation Info)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 16 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 10 ngày 2026-09-17 tại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`), ĐÃ THU HẸP ĐÁNG KỂ so với đề xuất gốc. Round này loại 5/6 ý tưởng ChatGPT đề xuất TRƯỚC KHI giao việc vì trùng lặp/premise sai — đã kiểm tra kỹ code trước khi quyết định:
- "Design Version Labels" — trùng ~100% với "Design Naming Assistant" (TASK-106, cột `custom_name` đã có).
- "Fullscreen 3D Workspace" — đã có sẵn từ TASK-025 (`toggleFullscreen`/nút "⛶ Toàn màn hình").
- "Admin User Detail Drawer" — trùng lặp Admin Data Explorer (TASK-104, đã tra cứu đúng thông tin này qua email).
- "Confirm Dialog chuẩn hoá" — kiểm tra `grep window.confirm` xác nhận CHỈ có đúng 1 nơi dùng (`Trash.jsx`) — xây 1 component/hook tái dùng cho đúng 1 điểm gọi là "trừu tượng hoá sớm" (premature abstraction), vi phạm nguyên tắc "3 dòng giống nhau tốt hơn 1 abstraction sớm" của `CLAUDE.md`. Bỏ.
- "Furniture Search/Filter trong Scene" — giá trị thấp so với công sức (danh sách nội thất thực tế thường 4-10 món, đã có đủ công cụ điều hướng: ẩn/hiện TASK-109, chọn nhanh, sắp xếp nhóm TASK-055). Bỏ.

Chỉ còn "Design Read-only Audit Info" — cũng thu hẹp: bỏ field "provider" (mock/replicate) vì HIỆN CHƯA được lưu/expose ở bất kỳ đâu (đã `grep` xác nhận) — thêm sẽ cần migration mới cho giá trị "biết cho vui" thấp, không đáng đánh đổi. Chỉ giữ lại phần dùng ĐÚNG dữ liệu đã có sẵn, không cần backend mới.

Vấn đề thật: khi user cần báo lỗi/hỗ trợ, không có cách nào dễ dàng lấy được Job ID/Room ID của 1 thiết kế cụ thể (phải tự đọc URL hoặc gọi `curl`).

## Scope

- `frontend/src/pages/DesignResult.jsx` — thêm 1 khối nhỏ (thu gọn/expand được, đặt cuối trang, không làm rối các khối chính) "🔧 Thông tin kỹ thuật", CHỈ dùng dữ liệu ĐÃ CÓ SẴN trong state `job`/`room` (đọc kỹ code hiện tại để dùng đúng field, không gọi thêm API mới):
  - Mã thiết kế (Job ID) — kèm nút "📋 Sao chép" (dùng `navigator.clipboard.writeText`, đúng pattern nếu dự án đã có chỗ nào dùng clipboard trước đó, nếu chưa thì viết đơn giản có `try/catch`).
  - Mã phòng (Room ID).
  - Trạng thái (status) — đã hiện ở đầu trang (badge COMPLETED) nhưng lặp lại ở đây cho đầy đủ ngữ cảnh kỹ thuật.
  - Ngày tạo (`createdAt`) + ngày cập nhật gần nhất (`updatedAt`) — định dạng đầy đủ ngày giờ (khác định dạng rút gọn ở nơi khác).
- KHÔNG thêm endpoint mới, KHÔNG thêm field mới vào bất kỳ DTO/entity nào.

## Out of scope

- KHÔNG hiện "AI Provider" (mock/replicate) — chưa có dữ liệu thật để hiện, tránh bịa hoặc hardcode giá trị có thể sai trong tương lai.
- Không đổi `Room3DViewer.jsx`.
- Không thêm reusable `ConfirmDialog`/search-filter cho danh sách nội thất (2 ý tưởng đã loại ở Goal).

## Dependencies

TASK-108 (Print Summary — tham khảo layout tương tự, khác nội dung).

## Affected Services

Frontend only (`DesignResult.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Khối "🔧 Thông tin kỹ thuật" hiện đúng Job ID/Room ID thật khớp URL trang đang xem, đúng ngày tạo/cập nhật thật (đối chiếu với dữ liệu đã biết của job test).
- Bấm "📋 Sao chép" → clipboard chứa đúng Job ID (verify bằng cách đọc lại `navigator.clipboard.readText()` hoặc xác nhận qua UI phản hồi "Đã sao chép").
- Không hồi quy bất kỳ khối nào khác trên trang (before/after, budget, checklist yêu cầu, 3 tab 3D/2D/sơ đồ, nút chia sẻ/in/tóm tắt/nhân bản/đặt lịch nhắc).
- Console sạch lỗi.

## Testing

Tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (khuyến khích — xác nhận đúng Job ID hiện khớp URL, test nút sao chép hoạt động thật). Không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này.

## Coordinator verification

- `npm run build` PASS (frontend agent + coordinator riêng biệt).
- Docker rebuild đầy đủ (`homely_backend`, `homely_frontend`), Playwright regression (`npm run test:e2e`) — 3/3 PASS.
- Verify thật qua Claude-in-Chrome trên job `c54b3649-09d0-4aa4-8624-b858325802c0`:
  - Khối "🔧 Thông tin kỹ thuật" hiện đúng Job ID/Room ID khớp URL, đúng ngày tạo/cập nhật.
  - Không hồi quy các khối khác trên trang (before/after, budget, checklist, 3 tab 3D/2D/sơ đồ, nút chia sẻ/in/tóm tắt/nhân bản/đặt lịch nhắc).
  - Console sạch lỗi (xác nhận lại sau reload sạch, `onlyErrors:true`).
- Nút "📋 Sao chép": `navigator.clipboard.writeText()` bị TREO trong môi trường Claude-in-Chrome tự động (dialog xin quyền clipboard native không tự tắt được) — xác nhận đây là giới hạn công cụ test, KHÔNG PHẢI lỗi app:
  - Screenshot ngay sau khi bấm nút timeout 30s.
  - Kiểm tra DOM qua `javascript_tool` (`document.querySelectorAll('*').length` + tìm đúng 1 node text "Room ID") xác nhận trang vẫn render đúng, không bị crash — ảnh chụp màn hình bị lỗi/vỡ là do lỗi tạm thời của công cụ chụp ảnh, không phải bug thật.
  - Gọi trực tiếp `navigator.clipboard.writeText(...)` qua `javascript_tool` cũng treo 45s — xác nhận nguyên nhân ở tầng trình duyệt/công cụ, không phải logic app.
  - Đối chiếu code: state thông báo "Đã sao chép!" chỉ set trong `.then()` — logic đúng theo review code; agent TASK-115 đã tự thấy thông báo hiện đúng 1 lần trong phiên dev-server riêng lúc dialog quyền không chặn.
  - Ghi nhận là Known Issue công cụ mới trong `tasks/state/current-state.md` (cùng nhóm với gotcha `.disabled`/key-mapping của các round trước).

## Status

COMPLETED
