# TASK-124

## Title

Menu chuột phải cho nội thất (Furniture Context Menu)

## Goal

Round 21 — ý tưởng còn dư từ batch ChatGPT round 20 (`https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, xem `tasks/completed/TASK-122-pin-design-to-top.md` để biết đầy đủ 6 ý tưởng gốc). "Collapsible Panels trong Editor" (ý tưởng còn lại cùng đợt) để dành tiếp — cả 2 đụng `Room3DViewer.jsx`/khu vực editor, ChatGPT khuyến cáo không giao cùng lúc, chỉ chọn 1 cho round này.

Vấn đề thật: mọi thao tác trên 1 món nội thất đang chọn (nhân đôi, xoá, ẩn/hiện, đặt lại vị trí, phóng to) đều đã có sẵn nhưng nằm rải rác ở 2 nơi khác nhau — thanh công cụ phía trên canvas (TASK-118: chỉ hiện khi đã chọn) VÀ danh sách "Nội thất trong phòng" bên dưới (nút ⧉/✕ cạnh mỗi item, TASK-041/053). Chuột phải TRỰC TIẾP lên món trong scene 3D để có menu nhanh là lối tắt hợp lý, ĐÚNG tinh thần thao tác 3D tự nhiên (giống mọi phần mềm 3D khác), KHÔNG thêm hành vi mới — chỉ thêm 1 CÁCH TRUY CẬP mới cho các hành động đã có.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Thêm listener `contextmenu` trên canvas (`renderer.domElement`) — `preventDefault()` để chặn menu chuột phải mặc định của trình duyệt.
  - Raycast tại vị trí chuột phải (dùng lại đúng cơ chế `toPointer`/`raycaster.intersectObjects(draggables)` đã có ở `onPointerDown`) — nếu trúng 1 món: chọn món đó (dùng lại `selectMesh`) VÀ mở menu ngữ cảnh tại đúng toạ độ con trỏ; nếu không trúng món nào: không mở menu (giữ hành vi mặc định, không chặn menu chuột phải ở vùng trống).
  - Menu hiện 5 mục, TÁI SỬ DỤNG NGUYÊN các hàm đã có (không viết logic mới): "⧉ Nhân bản" (`duplicateFurniture`), "✕ Xoá" (`removeFurniture`), "👁️/🙈 Ẩn/Hiện" (`toggleVisibility`, nhãn đổi theo `hiddenIndices` hiện tại), "↺ Đặt lại vị trí/góc xoay" (`resetSelectedTransform`), "🔍 Phóng to" (`focusOnSelected`).
  - Đóng menu khi: chọn 1 mục (thực hiện hành động rồi đóng), click ra ngoài, phím Esc (dùng `useEscapeKey` đã import từ TASK-118), hoặc mở menu chuột phải khác.
  - Khoá bởi Preview Mode (TASK-105) — CHỈ với 3 mục mutation thật (Nhân bản/Xoá/Đặt lại vị trí), giữ nguyên hoạt động cho Ẩn-Hiện (tiện ích xem, TASK-109 đã xác định không bị khoá) và Phóng to (thuần camera).

## Out of scope

- Không thêm hành động MỚI vào menu (chỉ tái sử dụng 5 hành động đã có) — không phải lúc thêm tính năng mới, chỉ thêm lối tắt truy cập.
- Không đụng danh sách "Nội thất trong phòng"/nút ⧉/✕ hiện có (giữ nguyên, đây chỉ là CÁCH THỨ 2 để gọi cùng hành động).
- Không đụng thanh công cụ trên canvas (TASK-118) — không đổi bất kỳ nút nào ở đó.
- Không hỗ trợ menu chuột phải trên tab "Sơ đồ mặt bằng"/"Ảnh AI (2D)" (chỉ tab "Không gian 3D").

## Dependencies

TASK-041/053 (nhân bản/xoá gốc), TASK-058 (focusOnSelected), TASK-105 (Preview Mode khoá mutation), TASK-109 (ẩn/hiện, KHÔNG bị khoá Preview Mode), TASK-116 (resetSelectedTransform), TASK-118 (dropdown pattern + `useEscapeKey` đã import).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Chuột phải lên 1 món nội thất trong scene 3D → không hiện menu mặc định trình duyệt, hiện đúng menu 5 mục tại vị trí con trỏ, món đó được chọn (viền chọn hiện đúng).
- Bấm từng mục → đúng hành động tương ứng xảy ra (verify tối thiểu 2-3 mục, không cần cả 5 nếu logic tái dùng y hệt nút đã verify trước đó).
- Chuột phải lên vùng trống (không phải món nào) → không hiện menu ngữ cảnh, không chặn hành vi khác.
- Preview Mode bật → 3 mục mutation bị khoá đúng (disabled hoặc ẩn rõ ràng), Ẩn/Hiện + Phóng to vẫn hoạt động.
- Không hồi quy: nút ⧉/✕ trong danh sách nội thất, thanh công cụ TASK-118, kéo-thả, chọn bằng click trái.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (dùng `computer` action `right_click` nếu khả dụng, hoặc dispatch `contextmenu` event thật qua `ref` từ `find` nếu right-click qua toạ độ không đáng tin cậy trong phiên — xem Known Issues công cụ).

## Coordinator verification

- `npm run build` PASS, Docker rebuild frontend + Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: `computer` action `right_click` qua toạ độ bị lệch (known tool quirk, TASK-011→016/116/117) — chuyển sang dispatch `MouseEvent('contextmenu', {bubbles:true, button:2})` thật tại toạ độ canvas tính chính xác (dùng "🔍 Phóng to món đã chọn" có sẵn để canh giữa món trước khi bấm chuột phải, đảm bảo trúng đúng mesh). Xác nhận: menu mở đúng 5 mục tại đúng vị trí món đã chọn (viền chọn hiện đúng); bấm "🙈 Ẩn tạm" → món ẩn đúng (opacity 0.5, icon đổi), menu tự đóng; bật lại qua nút mắt trong danh sách → hiện lại đúng; bật Preview Mode → mở lại menu → 3 mục mutation (Nhân bản/Xoá/Đặt lại vị trí) đúng `disabled`, Ẩn tạm/Phóng to vẫn bật.
- Console sạch lỗi.
- Không hồi quy: danh sách nội thất/nút ⧉/✕, thanh công cụ TASK-118, chọn bằng click trái vẫn hoạt động đúng.

## Status

COMPLETED
