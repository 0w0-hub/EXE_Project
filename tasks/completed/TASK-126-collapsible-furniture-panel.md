# TASK-126

## Title

Thu gọn/mở panel "Nội thất trong phòng" để tăng diện tích xem 3D

## Goal

Ý tưởng còn dư từ round 20 ("Collapsible Panels trong Editor") — bị hoãn 2 lần vì "Focus Mode cho 3D" (round 22) trùng khái niệm nhưng cả 2 đều đụng `Room3DViewer.jsx`/khu vực editor, không nên dồn cùng lúc với ý tưởng khác trong cùng round. Giờ làm riêng 1 lượt cho đàng hoàng.

Vấn đề thật: panel "Nội thất trong phòng" (danh sách món + catalog thêm loại đồ, đã tích luỹ 30+ category qua nhiều round) LUÔN hiện toàn bộ bên dưới khung 3D — trên màn hình laptop/thấp, user phải cuộn nhiều để thấy hết cả khung 3D lẫn panel. Cho phép thu gọn panel này tạm thời để khung 3D "thoáng" hơn khi cần tập trung xem, không cuộn qua catalog dài.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State mới `furniturePanelOpen` (mặc định `true` — giữ nguyên hành vi hiện tại cho ai chưa từng đổi), đọc/ghi `localStorage` key `homely_furniture_panel_open` (đúng pattern `viewMode`/TASK-119, lazy initializer đọc lúc khởi tạo state).
  - Đổi `<h4>Nội thất trong phòng</h4>` (dòng ~2280) thành 1 `<button>` bấm được (giữ nguyên style tiêu đề, thêm mũi tên ▾/▸ theo trạng thái, `aria-expanded`) để bật/tắt `furniturePanelOpen`.
  - Bọc TOÀN BỘ nội dung còn lại của `<div className="room3d-furniture-panel">` (từ ngay sau `<h4>`/nút mới cho đến hết, dòng ~2286-2510: 2 fieldset + danh sách + catalog) trong 1 `<div>` MỚI có `style={{ display: furniturePanelOpen ? undefined : 'none' }}` — KHÔNG sửa/di chuyển bất kỳ dòng nào bên trong, chỉ thêm 1 cặp thẻ bọc ở đầu/cuối (đã xác định chính xác vị trí đóng bằng script đếm thẻ cân bằng, tránh đếm nhầm thủ công trên file lớn).

## Out of scope

- Không đụng khung 3D/canvas/toolbar (TASK-118) — chỉ panel danh sách nội thất bên dưới.
- Không đụng khối màu tường/sàn/trần (nằm NGOÀI `room3d-furniture-panel`, phía trên).
- Không ẩn nội dung khi collapsed — chỉ `display: none` (giữ nguyên state/DOM, không mount lại khi mở lại, tránh mất trạng thái tạm như đang gõ dở ô tìm kiếm).

## Dependencies

TASK-055/065 (catalog nhóm theo phòng + tìm kiếm — nội dung bên trong panel, không đổi), TASK-119 (pattern localStorage cho UI state).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Mặc định panel mở như cũ (không hồi quy).
- Bấm tiêu đề "▾ Nội thất trong phòng" → thu gọn, khung 3D phía trên không đổi, panel biến mất khỏi luồng hiển thị (không chiếm khoảng trắng).
- Bấm lại "▸ Nội thất trong phòng" → mở lại đúng, mọi trạng thái bên trong (vd đang gõ ô tìm kiếm, đã chọn món) vẫn còn nguyên (không bị reset vì DOM không unmount).
- Tải lại trang → giữ đúng lựa chọn đã thu gọn/mở trước đó.
- Không hồi quy: toàn bộ chức năng bên trong panel (thêm/xoá/nhân đôi/sửa giá/tìm kiếm/badge số lượng TASK-125) khi đang mở.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- Vị trí đóng thẻ `</div>` xác định bằng script Node đếm thẻ cân bằng (không đếm thủ công trên file lớn) — xác nhận đúng qua `npm run build` PASS ngay lần đầu (Babel/Vite sẽ báo lỗi cú pháp rõ ràng nếu đặt sai vị trí).
- Docker rebuild frontend + Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: mặc định mở đúng (`aria-expanded="true"`); gõ "ban" vào ô tìm kiếm rồi bấm thu gọn → panel biến mất (`display:none`), mở lại → ô tìm kiếm vẫn giữ nguyên giá trị "ban" (xác nhận KHÔNG unmount, chỉ ẩn/hiện qua CSS); bấm thu gọn rồi tải lại trang → giữ đúng trạng thái thu gọn qua `localStorage`.
- Console sạch lỗi.
- Không hồi quy: catalog thêm loại đồ/danh sách nội thất/badge số lượng (TASK-125) hoạt động đúng khi mở.

## Status

COMPLETED
