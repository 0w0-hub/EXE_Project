# TASK-043

## Title

Chế độ ánh sáng Ban ngày/Buổi tối cho không gian 3D

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Các round gần đây (TASK-040→042) tập trung vào tương tác (chọn/xoay/nhân đôi); round này cải thiện chất lượng hình ảnh/không khí tổng thể của scene 3D — không gian luôn hiển thị 1 kiểu ánh sáng "ban ngày" cố định dù đẹp (TASK-021) nhưng thiếu biến thể. Thêm nút chuyển đổi mô phỏng buổi tối (đèn vàng ấm) cho cảm nhận không gian đa dạng hơn khi xem trước thiết kế.

## Scope

- `Room3DViewer.jsx`: thêm state `lightingMode` ('day' mặc định | 'evening'), thêm vào dependency array của effect dựng scene (rebuild toàn bộ khi đổi, giống cách `colorOverrides` hoạt động).
  - `EVENING_BACKGROUND = '#2E2A4D'` (nền tím than hoàng hôn, dùng lại `makeBackgroundTexture` có sẵn — tự tạo gradient sáng dần lên trên).
  - `HemisphereLight`: buổi tối đổi màu bầu trời tím nhạt (`0x6b6ea8`) + giảm cường độ (0.35 so với 0.7).
  - `DirectionalLight` chính (đổ bóng): buổi tối đổi màu cam ấm (`0xffb37a`) + giảm cường độ (0.55 so với 1.4) — mô phỏng đèn trong nhà thay vì ánh sáng ban ngày qua cửa sổ.
  - `DirectionalLight` phụ (fill): buổi tối đổi màu tím nhạt + giảm cường độ.
  - `renderer.toneMappingExposure`: giảm nhẹ (0.85 so với 1.05) cho cảm giác tối hơn tổng thể.
  - Nút "🌙 Buổi tối"/"☀️ Ban ngày" mới trong hàng nút công cụ (cạnh "Toàn màn hình"), toggle qua `setLightingMode`.

## Out of scope

- Không đụng màu tường/sàn/trần AI thật hay `colorOverrides` (TASK-020) — 2 hệ thống độc lập, buổi tối vẫn giữ đúng màu vật liệu, chỉ đổi ánh sáng chiếu lên.
- Không thêm đèn điểm mô phỏng đèn bàn/đèn sàn thật đang bật sáng — chỉ đổi ánh sáng toàn cục (đơn giản, đủ hiệu quả hình ảnh, tránh rủi ro hiệu năng/độ phức tạp không cần thiết).
- Không lưu lựa chọn giữa các lần xem (giống mọi override khác trong `Room3DViewer` — reset về 'day' khi rebuild trang).

## Dependencies

TASK-021 (đổ bóng + tone mapping ACES — nền tảng ánh sáng được điều chỉnh ở đây).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🌙 Buổi tối" → nền đổi màu tím than, tường/nội thất nhuốm ánh vàng ấm rõ rệt, nút đổi thành "☀️ Ban ngày".
- Bấm lại "☀️ Ban ngày" → khôi phục đúng ánh sáng/nền ban đầu.
- Không hồi quy: danh sách nội thất, màu tường/sàn/trần override, tab 2D/plan.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản đã có vì JWT hết hạn giữa round, job "Phòng tắm"):
- Bấm "🌙 Buổi tối" → screenshot xác nhận nền tím than + tường/nội thất nhuốm vàng ấm rõ rệt so với ảnh chụp trước đó (nền xanh nhạt, ánh sáng trung tính); nút đổi đúng thành "☀️ Ban ngày".
- Bấm lại "☀️ Ban ngày" → screenshot xác nhận khôi phục đúng về trạng thái ban đầu.
- `querySelectorAll('.room3d-furniture-list li span:first-child')` xác nhận danh sách 4 món không đổi qua 2 lần toggle (rebuild scene không ảnh hưởng state nội thất).
- Console sạch lỗi xuyên suốt cả 2 lần chuyển đổi.

## Status

COMPLETED
