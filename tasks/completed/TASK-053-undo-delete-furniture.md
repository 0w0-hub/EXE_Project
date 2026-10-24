# TASK-053

## Title

Hoàn tác xoá nội thất (1 cấp)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Từ TASK-040, xoá nội thất có thể thực hiện nhanh bằng phím Delete (ngoài nút "✕" có sẵn từ TASK-028) — dễ xoá nhầm hơn trước. Thêm khả năng hoàn tác ngay lập tức làm lưới an toàn.

## Scope

- `Room3DViewer.jsx`: thêm state `lastRemoved` (`{ item, index } | null`) — lưu lại đúng 1 lần xoá gần nhất.
  - `removeFurniture(index)`: lưu `{ item: localFurniture[index], index }` vào `lastRemoved` trước khi xoá.
  - `undoRemove()`: chèn lại `lastRemoved.item` đúng vào `lastRemoved.index` cũ (dùng `splice`), rồi xoá `lastRemoved`.
  - `addFurniture`/`duplicateFurniture`/"Đặt lại bố trí": chủ động xoá `lastRemoved` (đặt `null`) vì các thao tác này có thể làm dịch chỉ số, khiến "hoàn tác" chèn nhầm vị trí nếu vẫn giữ index cũ — chỉ giữ "hoàn tác" hợp lệ ngay sau ĐÚNG 1 lần xoá, chưa có gì xen vào.
  - UI: nút "↺ Hoàn tác xoá "{tên món}"" chỉ hiện khi `lastRemoved` khác `null`, đặt ngay dưới danh sách nội thất.

## Out of scope

- Không phải lịch sử hoàn tác nhiều cấp (undo stack) — chỉ nhớ đúng 1 lần xoá gần nhất, đủ dùng cho tình huống "lỡ tay bấm nhầm" phổ biến nhất.
- Không khôi phục lại màu riêng (`itemColorOverrides`, TASK-049) nếu món đã nhuộm màu trước khi xoá — chấp nhận giới hạn nhỏ này để giữ logic đơn giản (màu theo index, index đã bị dồn lại khi xoá).
- Không thêm phím tắt Ctrl+Z — dùng nút bấm để tránh xung đột với phím tắt trình duyệt/hệ thống ở nơi khác trên trang, và tăng tính khám phá (discoverability) hơn phím tắt ẩn.

## Dependencies

TASK-028 (xoá cơ bản), TASK-040 (xoá bằng phím Delete — lý do chính khiến cần lưới an toàn này).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Xoá 1 món (qua nút "✕" hoặc phím Delete) → nút "↺ Hoàn tác xoá ..." hiện ra với đúng tên món.
- Bấm "Hoàn tác" → món quay lại ĐÚNG vị trí cũ trong danh sách, nút hoàn tác biến mất.
- Xoá 1 món rồi thêm/nhân đôi 1 món khác (không hoàn tác) → nút hoàn tác tự ẩn (tránh chèn nhầm chỗ do chỉ số đã dịch).
- "Đặt lại bố trí" xoá luôn trạng thái hoàn tác đang chờ.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (job "Phòng khách" có sẵn, thứ tự thật: Kệ/tủ[0]/Đèn[1]/Bàn[2]/Sofa[3]):
- Xoá "Sofa/giường chính" (index 3, cuối danh sách) → xác nhận danh sách còn 3 món; nút "↺ Hoàn tác xoá "Sofa/giường chính"" xuất hiện.
- Bấm "Hoàn tác" → xác nhận danh sách có lại đúng 4 món, "Sofa/giường chính" trở về đúng vị trí cuối (index 3) như trước khi xoá; nút hoàn tác biến mất.
- Xoá "Bàn trung tâm" rồi bấm "+ Đèn" (không hoàn tác) → xác nhận nút hoàn tác KHÔNG còn hiển thị (đã tự xoá do thêm món mới).
- "Đặt lại bố trí" → khôi phục đúng 4 món AI gốc.
- Console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác.

## Status

COMPLETED
