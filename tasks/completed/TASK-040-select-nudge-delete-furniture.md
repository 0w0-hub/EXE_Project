# TASK-040

## Title

Nhấp chọn nội thất trong scene 3D — tinh chỉnh bằng phím mũi tên, xoá bằng Delete

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Các round gần đây (TASK-037→039) chỉ thêm loại đồ mới; round này cân bằng lại bằng 1 cải tiến tương tác 3D thật sự thay vì chỉ thêm số lượng — kéo-thả chuột (có sẵn) khó chính xác tuyệt đối khi cần chỉnh vị trí nhỏ, và xoá nội thất trước đây chỉ làm được qua nút "✕" trong danh sách bên dưới canvas (phải rời mắt khỏi scene 3D).

## Scope

- `Room3DViewer.jsx`:
  - Mỗi proxy mesh nội thất gắn `userData.index` khớp vị trí trong `localFurniture`.
  - Thêm `selectionOutline` (viền màu primary `0x4d52b4`, khác màu viền hover trắng của TASK-035) — hiển thị liên tục cho món đang chọn, không tự ẩn khi rê chuột đi chỗ khác.
  - `onPointerDown` ghi lại toạ độ màn hình lúc nhấn (`pointerDownAt`); `onPointerUp` so khoảng cách di chuyển — nếu dưới 5px (coi là "nhấp", không phải kéo-thả) thì gọi `selectMesh` với món vừa nhấn (hoặc `null` nếu nhấp chỗ trống/tường/sàn) để chọn/bỏ chọn.
  - Thêm `onKeyDown` (window, chỉ xử lý khi chuột đang ở trên canvas — theo dõi qua `pointerenter`/`pointerleave` — tránh chặn nhầm phím ở nơi khác của trang): phím mũi tên dịch chuyển món đang chọn 0.1m/lần theo x/z (kẹp trong biên phòng, giống logic kéo-thả); Delete/Backspace gọi `removeFurniture(idx)` của món đang chọn.
  - Đồng bộ `selectionOutline` sau khi kéo-thả hoặc nhấp đúp xoay nếu món đó đang được chọn.
  - Cleanup effect: gỡ 2 listener mới (`pointerenter`, `keydown`) + reset `selectedFurnitureIndex` về `null` khi scene dựng lại.
  - Thêm state `selectedFurnitureIndex` (React) chỉ để hiển thị UI (badge dòng đang chọn + câu hướng dẫn) — nguồn sự thật vẫn là biến cục bộ `selectedMesh` trong effect.
  - Highlight dòng tương ứng trong "Nội thất trong phòng" bằng class `is-selected`; câu hướng dẫn dưới canvas đổi động khi có món đang chọn.
- `styles.css`: `.room3d-furniture-list li.is-selected` — viền `box-shadow inset` màu primary (không đụng `background` để vẫn phân biệt được khi món vừa `is-custom` vừa `is-selected`).

## Out of scope

- Không lưu vị trí đã tinh chỉnh (giống mọi thao tác kéo-thả/xoay khác trong `Room3DViewer` — chỉ trong phiên xem này).
- Không thêm chọn nhiều món cùng lúc (multi-select) — chỉ 1 món tại 1 thời điểm, đủ dùng cho nhu cầu tinh chỉnh hiện tại.
- Không đổi hành vi nút "✕" trong danh sách (vẫn xoá được cả món AI gốc lẫn tự thêm, không đổi so với trước).

## Dependencies

TASK-034 (double-click xoay 90°), TASK-035 (viền hover, hạ tầng `onPointerMove`/raycasting dùng chung).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nhấp 1 món nội thất → viền màu primary hiện quanh món đó (khác màu viền hover trắng), dòng tương ứng trong danh sách được highlight, câu hướng dẫn đổi đúng tên món.
- Phím mũi tên (khi chuột đang trên canvas) di chuyển đúng món đang chọn, không vượt biên phòng.
- Delete/Backspace xoá đúng món đang chọn, không ảnh hưởng món khác.
- Nhấp vào chỗ trống (tường/sàn/nền) → bỏ chọn.
- Không hồi quy: kéo-thả chuột, nhấp đúp xoay 90°, "Đặt lại bố trí".
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản `task039-tester@homely.dev` vì JWT hết hạn giữa các round, job `Phòng tắm` từ TASK-039):
- Nhấp sofa → viền primary hiện đúng quanh sofa, dòng "Sofa/giường chính" trong danh sách có `box-shadow` (xác nhận qua `document.querySelector('.room3d-furniture-list li.is-selected')`), câu hướng dẫn đổi thành `Đã chọn "Sofa/giường chính" — dùng phím mũi tên...`.
- Hover canvas + nhấn `ArrowLeft` × 15 → sofa dịch chuyển rõ rệt sang trái trong screenshot (xác nhận qua zoom).
- Nhấn `Delete` → sofa biến mất khỏi cả scene lẫn danh sách (`querySelectorAll('.room3d-furniture-list li span')` còn đúng 3 món còn lại).
- Nhấp lại 1 món khác (kệ/tủ) → chọn đúng; nhấp vào vùng sàn trống → `li.is-selected` trả về `null` (bỏ chọn đúng).
- Kéo-thả kệ/tủ bằng chuột (không phải nhấp) → vẫn di chuyển đúng như trước (không hồi quy).
- Nhấp đúp bàn trung tâm → vẫn xoay được, không lỗi console.
- "Đặt lại bố trí" → khôi phục đúng đủ 4 món AI gốc (kể cả sofa vừa xoá bằng Delete).
- Console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác trên.

## Status

COMPLETED
