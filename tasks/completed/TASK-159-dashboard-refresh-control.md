# TASK-159

## Title

Nút "Làm mới dữ liệu" thủ công trên Dashboard

## Goal

Ý tưởng từ ChatGPT round 32 (cùng batch TASK-157/158), đã vét trước qua Explore agent, xác nhận CHƯA CÓ: `Dashboard.jsx` chỉ gọi `loadRooms()` 1 lần lúc mount (`useEffect` deps rỗng), không có hành động làm mới thủ công nào — chỉ có "Thử lại" khi LỖI (`RequestError`), không có refresh chủ động khi mọi thứ vẫn đang bình thường.

- **Làm mới dữ liệu**: thêm nút "🔄 Làm mới" gọi lại ĐÚNG hàm `loadRooms()` hiện có (không tạo endpoint mới), có trạng thái loading ngắn trong lúc request (disable nút + đổi text/icon), dùng đúng API `/dashboard` fetch hiện có.

## Scope

- `frontend/src/pages/Dashboard.jsx`:
  - Thêm nút "🔄 Làm mới" cạnh cụm nút "+ Tạo phòng mới"/"Mở Projects"/"Thùng rác" (TASK-145) trong khối `.section-tint`.
  - Bấm → gọi lại `loadRooms()` (hàm hiện có, dòng ~28-36) → trong lúc đang chạy, disable nút + đổi label tạm thời (vd "🔄 Đang làm mới…") → khôi phục label gốc khi xong (thành công hoặc lỗi).
  - Tái dùng đúng luồng lỗi hiện có (`RequestError`/state lỗi hiện tại) nếu request thất bại — không cần logic lỗi riêng mới cho nút này.

## Out of scope

- Không tạo API/endpoint mới — dùng đúng `loadRooms()`/luồng fetch hiện có.
- Không thêm auto-refresh định kỳ (chỉ thủ công theo yêu cầu ChatGPT).

## Dependencies

`Dashboard.jsx` (`loadRooms()` hiện có, khối nút `.section-tint` từ TASK-145).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🔄 Làm mới" → nút chuyển trạng thái loading ngắn → dữ liệu Dashboard tải lại đúng (kiểm tra qua network request thật tới đúng endpoint đã dùng lúc mount).
- Trong lúc đang loading, bấm lại nút KHÔNG gửi thêm request chồng lấn (nút đã disable).
- Không hồi quy: nút "+ Tạo phòng mới"/"Mở Projects"/"Thùng rác" (TASK-145), lời chào theo trạng thái (TASK-156), `RecentDesigns`, thống kê.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-157/158.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`/`RoomNew.jsx`. Agent thêm `refreshing` state + `handleRefresh()` gọi lại đúng `loadRooms()` hiện có (đổi `loadRooms()` để `return` promise chain thay vì bắn đi không chờ, để `handleRefresh` biết lúc nào xong), nút "🔄 Làm mới" disable + đổi label "🔄 Đang làm mới…" trong lúc chờ.

`npm run build` PASS. Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.

Verify E2E qua Claude in Chrome (tài khoản test, `/`):
- Nút "🔄 Làm mới" hiện đúng label ban đầu, đúng vị trí cạnh cụm nút TASK-145.
- Lấy sample state ngay sau click + polling 50ms không bắt được trạng thái loading (do request local quá nhanh) — dùng `MutationObserver` bắt chính xác: nút chuyển `disabled=true` + label "🔄 Đang làm mới…" tại ~11ms sau click, quay lại `disabled=false` + "🔄 Làm mới" tại ~33ms. Xác nhận trạng thái loading có xảy ra thật, chỉ rất ngắn (đúng như spec "loading ngắn").
- Xác nhận request mạng thật: đúng 1 GET `/api/v1/rooms` (cùng endpoint dùng lúc mount) bắn ra mỗi lần bấm — kiểm qua `read_network_requests`.
- Test chống chồng lấn request đúng cách: 3 click đồng bộ liên tiếp trong CÙNG 1 tick (trước khi React re-render kịp) bắn ra request cho mỗi click — đây là giới hạn vật lý không thể tránh của React (DOM `disabled` chỉ cập nhật sau re-render, không đồng bộ ngay khi gọi `setState`), KHÔNG phải bug vì không con người nào bấm 2 lần cách nhau 0ms thật. Test lại đúng ngữ cảnh thật: dùng `MutationObserver` chờ tới khi `disabled` THẬT SỰ là `true` trong DOM rồi mới bấm lần 2 → xác nhận click bị chặn hoàn toàn (button `disabled` khiến trình duyệt không bắn sự kiện click), qua `read_network_requests` xác nhận đúng CHỈ 1 request duy nhất bắn ra dù bấm thêm 2 lần trong lúc đang loading thật.
- Không hồi quy: "+ Tạo phòng mới"/"Mở Projects"/"Thùng rác" (TASK-145) vẫn hiện đúng vị trí; lời chào theo trạng thái (TASK-156) không đổi; `RecentDesigns`/thống kê không bị ảnh hưởng.
- Console sạch lỗi trên cả 3 trang Dashboard/Projects/RoomNew sau khi test xong (reload từng trang, kiểm tra không có log lỗi nào từ lúc load).

## Status

COMPLETED
