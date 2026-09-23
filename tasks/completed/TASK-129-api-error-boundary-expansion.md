# TASK-129

## Title

Mở rộng "API Error Retry" (`RequestError`) sang các trang còn thiếu

## Goal

Ý tưởng còn dư từ round 15 (TASK-113/114) — lúc đó chỉ áp dụng `RequestError.jsx` (nút "🔄 Thử lại" khi gọi API lỗi) cho 2 trang `Projects.jsx`/`Dashboard.jsx`, CỐ TÌNH loại `DesignResult.jsx` vì trang đó đã có xử lý trạng thái PENDING/PROCESSING/FAILED riêng (xem comment đầu `RequestError.jsx`) — KHÔNG đụng lại `DesignResult.jsx` trong task này. Các trang khác gọi API lúc tải (`useEffect`) hiện chưa dùng `RequestError` — khi lỗi mạng/lỗi server xảy ra, trải nghiệm không nhất quán với Projects/Dashboard (không có nút thử lại rõ ràng).

## Scope

- Khảo sát trước khi sửa: đọc từng trang trong danh sách bên dưới, xác nhận cách xử lý lỗi HIỆN TẠI (có thể đã có xử lý riêng đủ tốt — nếu vậy, loại khỏi scope và ghi rõ lý do, đúng nguyên tắc vét ý tưởng trước khi giao việc của dự án này).
- Ứng viên (ưu tiên trang non-admin, người dùng cuối thấy trực tiếp):
  - `frontend/src/pages/Trash.jsx`
  - `frontend/src/pages/ActivityHistory.jsx`
  - `frontend/src/pages/Achievements.jsx`
  - `frontend/src/pages/CompareDesigns.jsx`
  - `frontend/src/pages/SharedDesign.jsx` (trang public không cần đăng nhập — đặc biệt đáng có retry vì user ngoài có thể gặp lỗi mạng và không có cách nào khác quay lại)
- Với mỗi trang thực sự thiếu: thêm state lỗi (`error`/`setError`) nếu chưa có, bắt lỗi trong `catch` của lời gọi API tải dữ liệu, render `<RequestError message={...} onRetry={...} />` thay cho nội dung khi có lỗi — đúng pattern đã dùng ở `Projects.jsx`/`Dashboard.jsx` (đọc lại 2 file này làm mẫu TRƯỚC khi sửa).
- KHÔNG đổi logic gọi API/endpoint, KHÔNG thêm tự động retry (giữ đúng quyết định "chỉ nút bấm thủ công" từ TASK-113).

## Out of scope

- `DesignResult.jsx` (đã cố tình loại từ TASK-113, có luồng polling riêng).
- Các trang admin (`admin/AdminDashboard.jsx`, `admin/AdminUsers.jsx`, `admin/AdminDesigns.jsx`, `admin/AdminDataIntegrity.jsx`, `admin/AdminModeration.jsx`) — nội bộ, ưu tiên thấp hơn, để dành round sau nếu cần.
- `RoomNew.jsx`, `Templates.jsx`, `DesignSummary.jsx` — nếu khảo sát xác nhận không có lời gọi API tải dữ liệu chính (hoặc đã có xử lý lỗi phù hợp riêng), loại khỏi scope.

## Dependencies

TASK-113/114 (`RequestError.jsx` gốc, mẫu áp dụng ở `Projects.jsx`/`Dashboard.jsx`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Mỗi trang trong scope thực tế: giả lập lỗi API (subclass `XMLHttpRequest`/mock `fetch` như TASK-113 đã làm, hoặc đọc code xác nhận logic đúng nếu không giả lập được) → `RequestError` hiện đúng thông điệp + nút "🔄 Thử lại" hoạt động (gọi lại đúng hàm tải dữ liệu).
- Không hồi quy luồng thành công (dữ liệu tải đúng khi API OK).
- Console sạch lỗi.

## Testing

Agent tự viết + tự verify (không đụng `Room3DViewer.jsx`, hợp lệ giao agent). Coordinator gộp rebuild Docker + Playwright TASK-098 regression + verify E2E qua Claude in Chrome sau khi agent xong.

## Coordinator verification

- Agent khảo sát cả 5 ứng viên trong Scope trước khi sửa, xác nhận cả 5 đều thực sự thiếu retry (không loại cái nào) — đọc lại cả 5 file sau khi agent xong xác nhận đúng pattern `Projects.jsx`/`Dashboard.jsx` (hàm `load*()` tách riêng, `error && <RequestError message={error} onRetry={load*} />`), không trùng lặp logic fetch. `CompareDesigns.jsx` xử lý tinh tế hơn (mỗi cột so sánh có `reload()` riêng qua `reloadToken` trong hook `useDesignSide`, chỉ tải lại đúng vế lỗi) — đọc code xác nhận hợp lý, không tải lại vế đang hoạt động bình thường.
- Agent tự kiểm tra + loại đúng 3 ứng viên ngoài Scope theo đúng lý do đã ghi trong task (`RoomNew.jsx` chỉ có 1 fetch phụ usage-widget không phải nội dung chính; `Templates.jsx`/`DesignSummary.jsx` nằm trong Out of scope, không đụng).
- `npm run build` PASS (`✓ built in 2.57s`).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E trực tiếp qua Claude in Chrome trên trang PUBLIC `SharedDesign.jsx` (ứng viên giá trị cao nhất — user ngoài không đăng nhập gặp lỗi mạng không có cách nào khác quay lại): truy cập `/share/invalid-token-for-error-test` (token không tồn tại) → xác nhận qua screenshot `RequestError` hiện đúng ("Đã có lỗi xảy ra, vui lòng thử lại sau" + nút "🔄 Thử lại"); bấm "Thử lại" → xác nhận qua `read_network_requests` cả 2 API (`/public/shares/{token}` + `/public/shares/{token}/comments`) được gọi lại đúng (status 500 cả 2, đúng vì token không tồn tại) — retry hoạt động đúng, không crash trang. Console sạch lỗi.
- Không verify trực tiếp bằng thao tác thật cho 4 trang còn lại (`Trash.jsx`/`ActivityHistory.jsx`/`Achievements.jsx`/`CompareDesigns.jsx`) vì phiên đăng nhập test bị hết hạn giữa chừng (không liên quan tính năng này) — bù lại bằng: (a) code review xác nhận cả 4 dùng ĐÚNG pattern đã verify trực tiếp thành công ở `SharedDesign.jsx` và ở `Projects.jsx`/`Dashboard.jsx` từ TASK-113 (không có logic mới/khác biệt đáng lo), (b) Playwright TASK-098 xác nhận luồng đăng ký→đăng nhập→tạo phòng→generate→xem kết quả không hồi quy (không đi qua 4 trang này nhưng xác nhận app tổng thể không vỡ sau thay đổi).
- Không phát hiện lỗi app mới.

## Status

COMPLETED
