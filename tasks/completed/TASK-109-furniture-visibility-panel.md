# TASK-109

## Title

Ẩn/hiện + chọn nhanh nội thất từ danh sách (Furniture Visibility / Scene Organization)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 13 — dùng ý tưởng còn dư từ round 12 (hỏi ChatGPT lần 7). Đụng trực tiếp `Room3DViewer.jsx` nên coordinator tự làm trực tiếp, KHÔNG giao agent (đúng quy ước đã giữ xuyên suốt dự án, ví dụ TASK-079/102/105).

Vấn đề thật (đã đọc code xác nhận trước khi làm): danh sách "Nội thất trong phòng" đã tồn tại (hiện tên/giá/nút xoá/nhân đôi) nhưng KHÔNG có cách nhấp vào 1 dòng trong danh sách để chọn món đó trong scene 3D (chỉ chọn được bằng cách nhấp trực tiếp vào mesh trong scene) — bất tiện khi phòng có nhiều món chồng lấn/khó nhấp trúng. Cũng không có cách tạm ẩn 1 món khỏi tầm nhìn để dễ thao tác với các món khác (ví dụ ẩn đèn trần để nhìn rõ sofa bên dưới) mà không phải XOÁ hẳn.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State mới `hiddenIndices` (`Set<number>`, mặc định rỗng) — chỉ số các món đang bị ẩn TẠM trong phiên xem (KHÔNG phải xoá, không đổi `localFurniture`/chi phí/danh sách).
  - Hàm `toggleVisibility(index)` — thêm/bỏ `index` khỏi `hiddenIndices`.
  - Trong vòng lặp dựng mesh (`localFurniture.forEach`): món có `hiddenIndices.has(idx)` → `mesh.visible = false`, KHÔNG thêm vào `draggables` (không raycasting/kéo-thả/click-select được trong scene khi đang ẩn), KHÔNG tạo label nổi.
  - Thêm `hiddenIndices` vào dependency của effect dựng scene chính (nhất quán với `showLabels`/`previewMode` đã làm).
  - Ref mới `selectMeshRef` (cùng pattern `rotateSelectedRef` đã có) — cho phép chọn 1 món bằng index TỪ NGOÀI closure three.js (gọi từ danh sách React), kể cả khi món đó đang ẩn (không có mesh thật để raycast) — trường hợp ẩn thì chỉ cập nhật state `selectedFurnitureIndex`/`selectedIndexRef` trực tiếp, không có viền chọn 3D (vì không có mesh để vẽ viền).
  - Danh sách "Nội thất trong phòng" (`<ul className="room3d-furniture-list">`): thêm nút 👁️/🙈 (ẩn/hiện) ĐẦU mỗi dòng, bấm vào TÊN món (không phải nút hành động khác) gọi `selectMeshRef.current(idx)` để chọn. Dòng đang ẩn hiện mờ đi (CSS `opacity`) để phân biệt trực quan.
  - Reset `hiddenIndices` về rỗng khi prop `furniture` đổi (job/phòng khác) và khi bấm "Đặt lại bố trí" (cùng nhóm state phiên xem tạm thời khác như `itemColorOverrides`).

## Out of scope

- KHÔNG đưa vào ngăn xếp Hoàn tác/Làm lại (TASK-102) — ẩn/hiện là trạng thái XEM thuần tuý (giống chọn tab/góc nhìn), không phải thao tác đổi DỮ LIỆU, nhất quán với việc vị trí kéo-thả/góc xoay cũng không nằm trong lịch sử.
- KHÔNG chặn ẩn/hiện khi đang ở "🔒 Chế độ xem trước" (TASK-105) — đây là tiện ích XEM, không phải chỉnh sửa, giữ hoạt động được cả trong preview mode (giống góc nhìn/tab/ngày-đêm).
- KHÔNG đổi cách tính "X món · tổng Y đ" — món ẩn vẫn tính đủ vào tổng (ẩn không phải xoá).
- Không đổi `removeFurniture`/`duplicateFurniture`/sửa giá cho món đang ẩn (vẫn hoạt động bình thường qua danh sách).

## Dependencies

TASK-040 (chọn bằng click 3D — cơ chế `selectMesh` gốc), TASK-063 (ẩn/hiện toàn bộ nhãn — khác ý tưởng này: TASK-063 ẩn nhãn CỦA MỌI món, task này ẩn CHÍNH món đó khỏi scene), TASK-075 (`rotateSelectedRef` — pattern tham khảo cho `selectMeshRef`), TASK-102 (Undo/Redo — xác nhận rõ KHÔNG áp dụng), TASK-105 (Preview Mode — xác nhận rõ KHÔNG bị khoá).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bấm 👁️ trên 1 dòng trong danh sách → món biến mất khỏi scene 3D ngay (cả mesh lẫn nhãn), dòng trong danh sách hiện mờ đi, nút đổi thành 🙈; KHÔNG đổi số món/tổng chi phí hiển thị.
- Bấm 🙈 lại → món hiện lại đúng vị trí/màu cũ (không bị reset màu/vị trí đã chỉnh).
- Bấm vào TÊN 1 món (đang hiện) trong danh sách → chọn đúng món đó trong scene (viền chọn hiện đúng, đồng bộ với `selectedFurnitureIndex`).
- Bấm vào TÊN 1 món ĐANG ẨN trong danh sách → chọn được (bảng màu/dòng trạng thái "Đã chọn..." hiện đúng tên món) dù không có viền 3D để vẽ (không lỗi, không crash).
- Bật "🔒 Chế độ xem trước" (TASK-105) → nút 👁️/🙈 vẫn bấm được bình thường (không bị khoá).
- Đặt lại bố trí → mọi món hiện lại đầy đủ (`hiddenIndices` về rỗng).
- Không hồi quy: xoá/nhân đôi/sửa giá món qua danh sách, chọn bằng click 3D trực tiếp, Undo/Redo (TASK-102), Preview Mode (TASK-105), tab 2D/sơ đồ mặt bằng.
- Console sạch lỗi.

## Testing

Tự thực hiện trực tiếp (không qua agent) do đụng `Room3DViewer.jsx`. Verify: `npm run build` PASS → rebuild Docker → chạy lại bộ Playwright (TASK-098) làm regression check → verify E2E qua Claude in Chrome, đọc trực tiếp DOM/style qua `document.querySelector` để xác nhận mesh thật sự không render (không chỉ suy luận từ ảnh chụp).

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker đầy đủ. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật) — 4 nút 👁️ đúng hiện trên 4 dòng; bấm 1 nút → đổi đúng thành 🙈, dòng mờ đi, số món/tổng chi phí giữ nguyên "4 món · 8.000.000 đ" (không đổi). Bấm vào TÊN 1 món đang hiện → chọn đúng (`li.is-selected` khớp). Bấm vào TÊN món ĐANG ẨN → chọn được, dòng trạng thái hiện đúng tên, không crash. **Phát hiện + tự sửa 1 vấn đề thiết kế trong lúc code** (trước khi verify, không phải bug đã lọt ra ngoài): fieldset `disabled={previewMode}` bọc trọn cả `<ul>` (kế thừa từ TASK-105) sẽ khoá luôn cả nút 👁️/🙈 khi bật Preview Mode, trái với Out of scope đã ghi "KHÔNG chặn ẩn/hiện khi đang xem trước" — tách lại thành: 1 fieldset trước `<ul>` (khối gợi ý ngân sách), 1 fieldset nhỏ NGAY TRONG mỗi `<li>` chỉ bọc đúng 3 control mutation thật (ô giá/⧉/✕), 1 fieldset sau `</ul>` (Hoàn tác/Làm lại/tìm kiếm/thêm loại đồ) — nút 👁️/🙈 và tên món nằm ngoài mọi fieldset. Verify lại đúng: bật "🔒 Chế độ xem trước" → nút 👁️/🙈 vẫn bấm được và có tác dụng thật (đổi icon + ẩn mesh), trong khi nút ✕ (xoá) đúng vẫn bị khoá (`:disabled` = true). Tắt Preview Mode + "Đặt lại bố trí" → toàn bộ 4 nút về đúng 👁️. Console sạch lỗi xuyên suốt. Không phát hiện lỗi mới nào khác.
