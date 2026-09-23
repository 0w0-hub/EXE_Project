# TASK-114

## Title

Điều khiển camera bằng bàn phím (Keyboard Camera Navigation)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 15 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 9 ngày 2026-09-17). Đụng trực tiếp `Room3DViewer.jsx` nên coordinator tự làm trực tiếp, KHÔNG giao agent (đúng quy ước đã giữ xuyên suốt dự án). Vấn đề thật: camera 3D hiện hoàn toàn phụ thuộc chuột (`OrbitControls` kéo để xoay, cuộn để zoom) — không có cách điều khiển bằng bàn phím.

**QUAN TRỌNG — xung đột phím đã biết cần xử lý**: phím mũi tên (Arrow) hiện ĐÃ được dùng để di chuyển tinh món nội thất ĐANG CHỌN (TASK-040, xem `onKeyDown` trong effect dựng scene). Giải pháp: CHỈ bật điều khiển camera bằng phím mũi tên khi KHÔNG có món nào đang chọn (`selectedMesh` null) — giữ nguyên hành vi cũ khi có món đang chọn (di chuyển món), thêm hành vi mới khi không chọn gì (xoay/pan camera). Không dùng WASD (không cần thiết, tránh thêm phím tắt không nhất quán với các phím đã có).

## Scope

- `frontend/src/components/Room3DViewer.jsx`, trong hàm `onKeyDown` hiện có (đã có sẵn guard `if (!pointerOverCanvas || !selectedMesh || previewMode) return` ở đầu — đọc kỹ lại code THẬT trước khi sửa):
  - Tách thêm 1 nhánh xử lý MỚI: khi `pointerOverCanvas` đúng nhưng `!selectedMesh` (không có món nào đang chọn) và KHÔNG `previewMode` (điều khiển camera cũng là 1 dạng "view", nhưng để nhất quán với các phím tắt khác vốn gate theo `pointerOverCanvas`, không cần disable bởi previewMode — xác nhận lại logic hợp lý nhất khi code, camera luôn được phép điều khiển kể cả preview mode giống các nút góc nhìn khác):
    - `ArrowLeft`/`ArrowRight`: xoay camera quanh phòng (orbit theo trục ngang) — dùng `controls.rotateLeft`/tương đương nếu `OrbitControls` hỗ trợ trực tiếp, hoặc tính lại `camera.position` xoay quanh `controls.target` bằng lượng góc nhỏ cố định.
    - `ArrowUp`/`ArrowDown`: pan camera lên/xuống hoặc tiến/lùi (zoom nhẹ) — chọn hành vi tự nhiên nhất, nhất quán với cảm giác OrbitControls hiện có.
    - `+`/`-` (hoặc `=`/`-`, bàn phím không cần Shift): zoom in/out.
    - `R`: gọi lại `resetView()` đã có (đúng hành vi nút "Đặt lại góc nhìn").
  - KHÔNG đổi bất kỳ hành vi nào của nhánh cũ (khi CÓ `selectedMesh` — di chuyển/xoay/xoá món vẫn y nguyên).
- Thêm dòng vào bảng "❓ Phím tắt" (TASK-061) mô tả rõ: phím mũi tên di chuyển món KHI ĐÃ CHỌN, điều khiển camera KHI CHƯA CHỌN GÌ (client phải hiểu rõ 2 ngữ cảnh khác nhau của cùng phím, tránh nhầm lẫn).

## Out of scope

- Không dùng WASD (chỉ Arrow + zoom +/- + R, đã đủ và nhất quán với các phím hiện có).
- Không đổi hành vi phím mũi tên khi ĐANG CHỌN 1 món (giữ nguyên nhánh cũ TASK-040 100%).
- Không đổi `rotateSelectedRef`/`selectMeshRef`/Undo-Redo/Furniture Visibility.

## Dependencies

TASK-040 (phím mũi tên di chuyển món — nhánh KHÔNG được đổi), TASK-034 (`resetView`), TASK-061 (bảng phím tắt), TASK-112 (Camera Presets, cùng round trước — tham khảo pattern đổi camera trực tiếp).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- KHÔNG chọn món nào, nhấp chuột vào canvas rồi nhấn phím mũi tên → camera xoay/di chuyển đúng, KHÔNG có món nào bị ảnh hưởng (vì không có món nào đang chọn).
- Chọn 1 món rồi nhấn phím mũi tên → món di chuyển đúng như hành vi CŨ (TASK-040), KHÔNG đổi.
- Nhấn `+`/`-` khi chưa chọn gì → camera zoom in/out đúng.
- Nhấn `R` khi chưa chọn gì → camera về đúng góc mặc định (giống bấm nút "Đặt lại góc nhìn").
- Không hồi quy: mọi phím tắt khác đã có (Q/E xoay món, Delete xoá món, Ctrl+Z Undo/Redo, "/" focus tìm kiếm).
- Console sạch lỗi.

## Testing

Tự thực hiện trực tiếp (không qua agent) do đụng `Room3DViewer.jsx`. Verify: `npm run build` PASS → rebuild Docker (gộp chung 1 lần với TASK-113 sau khi agent xong) → chạy lại bộ Playwright (TASK-098) làm regression check → verify E2E qua Claude in Chrome bằng cách gửi sự kiện bàn phím thật (`computer` key action, không phải chỉ JS dispatch) và đọc lại vị trí camera/món qua `document`/state để xác nhận đúng.

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker cùng đợt với TASK-113. Verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật) — nhấp vào nền phòng trống (không chọn món nào) rồi nhấn phím `ArrowLeft` THẬT 6 lần (qua `computer` key action) → camera orbit đúng, xác nhận qua screenshot góc nhìn đổi rõ rệt; nhấn `r` → đúng về lại chính xác góc mặc định ban đầu (khớp pixel-for-pixel với screenshot gốc). Chọn "Sofa/giường chính" từ danh sách rồi nhấn `ArrowLeft` 5 lần → xác nhận đúng MÓN di chuyển (không phải camera) — không hồi quy hành vi cũ TASK-040. Test phím `+`/`-` (zoom): phím do `computer` tool gửi qua CDP KHÔNG tạo ra `KeyboardEvent.key === '+'` trên trang này (vấn đề công cụ, cùng loại lệch ánh xạ phím/toạ độ đã ghi nhận nhiều lần ở Known Issues) — cô lập bằng cách dispatch `KeyboardEvent({key:'+'})` trực tiếp qua JS → xác nhận logic zoom hoạt động ĐÚNG (camera rõ ràng lại gần hơn qua screenshot), kết luận đây là hạn chế công cụ test, không phải lỗi app. "Đặt lại bố trí" sau khi xong để dọn dữ liệu test. Console sạch lỗi xuyên suốt. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi app mới nào.
