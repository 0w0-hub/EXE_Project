# TASK-102

## Title

Hoàn tác/Làm lại đa cấp cho chỉnh sửa nội thất (Undo/Redo History Panel)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 9 — ý tưởng CUỐI CÙNG còn lại từ round 5 chưa dùng: "Undo/Redo History Panel". Đúng theo quy ước đã thiết lập xuyên suốt dự án (xem `tasks/active/current-task.md` mọi round trước), task này đụng trực tiếp `Room3DViewer.jsx` (file lớn/phức tạp nhất, 100+ task tích luỹ) nên coordinator tự làm trực tiếp, KHÔNG giao agent.

Vấn đề thật: `Room3DViewer.jsx` đã có "Hoàn tác xoá" 1 cấp (TASK-053, chỉ hoàn tác được đúng 1 lần xoá gần nhất, mất tác dụng ngay khi có thao tác khác chen vào) trong khi đã tích luỹ RẤT NHIỀU thao tác đổi trạng thái khác qua nhiều task (thêm TASK-027, nhân đôi TASK-041, sửa giá TASK-046, đổi màu tường/sàn/trần TASK-020, đổi màu riêng từng món TASK-049, xoá hàng loạt món tự thêm TASK-071, tải bố trí JSON TASK-075, đặt lại bố trí) mà không có cách nào hoàn tác được.

## Scope

- `frontend/src/components/Room3DViewer.jsx` — thay thế cơ chế `lastRemoved`/`undoRemove` (1 cấp, chỉ xoá) bằng ngăn xếp `history`/`redoStack` đa cấp (tối đa 20 bước, không giới hạn cứng gây tràn bộ nhớ với phiên xem dài):
  - Snapshot gồm `localFurniture` + `itemColorOverrides` + `colorOverrides` (đúng 3 phần state đổi được qua UI trong session).
  - `pushHistory(label)` gọi TRƯỚC mỗi thao tác đổi state, xoá `redoStack` (ngữ nghĩa chuẩn: thao tác mới sau khi hoàn tác sẽ bỏ nhánh redo cũ).
  - Gắn `pushHistory` vào toàn bộ điểm mutate hiện có: `addFurniture`, `removeFurniture`, `duplicateFurniture`, `removeAllCustom`, `updateFurnitureCost`, `importLayout`, nút đổi/đặt lại màu tường-sàn-trần (`colorOverrides`), nút đổi/đặt lại màu riêng món đang chọn (`itemColorOverrides`), nút "Đặt lại bố trí".
  - 2 nút "↶ Hoàn tác"/"↷ Làm lại" thay cho nút "↺ Hoàn tác xoá..." cũ — disabled đúng khi ngăn xếp tương ứng rỗng, `title` hiện tên thao tác sắp hoàn tác/làm lại, dòng phụ "Thao tác gần nhất: ..." hiện label thao tác trên cùng ngăn xếp history.
  - Phím tắt Ctrl/Cmd+Z (Hoàn tác), Ctrl/Cmd+Shift+Z hoặc Ctrl/Cmd+Y (Làm lại) — gộp chung effect với phím "/" có sẵn (TASK-069, cùng kiểu gate: chỉ ở tab 3D, không chặn nhầm khi đang gõ trong ô input khác).
  - Xoá sạch `history`/`redoStack` khi prop `furniture` đổi (chuyển sang job/phòng khác — lịch sử cũ không còn ý nghĩa).
  - Thêm 2 dòng vào bảng "❓ Phím tắt" (TASK-061) cho nhất quán.

## Out of scope

- KHÔNG bao gồm kéo-thả bằng chuột hay xoay bằng phím mũi tên/Q-E/nhấp đúp — vị trí và góc xoay của mesh chỉ tồn tại trực tiếp trong three.js (`mesh.position`/`mesh.rotation`), CHƯA TỪNG được đồng bộ vào state React ở bất kỳ task nào trước đây (quyết định kiến trúc giữ nguyên từ TASK-028: "kéo-thả nội thất... state cục bộ, không đồng bộ lên bảng chi phí trang cha"). Đưa việc này vào phạm vi Undo/Redo sẽ cần viết lại kiến trúc đồng bộ vị trí 2 chiều — rủi ro cao cho file lớn nhất/nhạy cảm nhất dự án, vượt quy mô hợp lý của 1 round.
- Không sửa "Đặt lại bố trí" để reset thêm `colorOverrides` (giữ đúng hành vi cũ đã verify nhiều lần — 1 comment cũ ở TASK-071 mô tả sai hành vi này, nhưng sửa lại KHÔNG thuộc phạm vi task Undo/Redo, để dành nếu cần task riêng).
- Không persist lịch sử qua reload trang (đúng tinh thần "session-only" đã thống nhất từ TASK-028/075).

## Dependencies

TASK-020 (màu tường/sàn/trần), TASK-027/028 (thêm/xoá nội thất), TASK-041 (nhân đôi), TASK-046 (sửa giá), TASK-049 (màu riêng món), TASK-053 (hoàn tác xoá — bị thay thế), TASK-061 (bảng phím tắt), TASK-069 (phím tắt "/"), TASK-071 (xoá hàng loạt), TASK-075 (import/export JSON).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Thêm 1 món → nút "↶ Hoàn tác" bật đúng (title đúng tên thao tác), "↷ Làm lại" tắt đúng; bấm Hoàn tác → về đúng số món/tổng giá trước đó; bấm Làm lại → về đúng số món/tổng giá sau khi thêm.
- Phím Ctrl+Z hoạt động tương đương nút Hoàn tác.
- Thực hiện 1 thao tác MỚI sau khi hoàn tác → nhánh Làm lại cũ bị xoá đúng (nút "Làm lại" tắt lại, không phục hồi nhầm thao tác đã bị bỏ).
- Đổi màu tường → nhãn "Hoàn tác: Đổi màu tường" hiện đúng; bấm "Đặt lại bố trí" → tự đẩy vào lịch sử, hoàn tác được luôn cả hành động reset.
- Đổi job/phòng khác (prop `furniture` đổi) → lịch sử cũ bị xoá sạch, không còn hoàn tác nhầm sang job khác.
- Không hồi quy: cảnh báo Live Budget Guard (TASK-079), dòng tổng "X món · Y đ" (TASK-067), bảng phím tắt (TASK-061), phím "/" tìm kiếm (TASK-069), mọi tab 3D/2D/sơ đồ.
- Console sạch lỗi.

## Testing

Tự thực hiện trực tiếp (không qua agent) do đụng `Room3DViewer.jsx`. Verify: `npm run build` PASS → rebuild Docker (`docker compose build frontend` + recreate) → chạy lại bộ Playwright (TASK-098) làm regression check → verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật) cho từng thao tác trong Acceptance Criteria, đọc trực tiếp state qua `document.querySelector` (đáng tin cậy hơn chỉ dựa vào ảnh chụp màn hình, theo đúng kinh nghiệm Known Issues đã ghi nhận về lệch toạ độ click).

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker (`docker compose build frontend` + recreate container). Chạy lại bộ Playwright TASK-098 làm regression check — 3/3 PASS, không hồi quy. Verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật `c54b3649-...`):
- Bấm "+ Ghế/sofa" (qua `button.click()` JS vì click toạ độ bị lệch trong phiên này — vấn đề công cụ đã biết, xem Known Issues) → đúng "5 món · tổng ước tính 16.000.000 đ", nút "↶ Hoàn tác" hiện đúng title "Hoàn tác: Thêm "Ghế/sofa"", "↷ Làm lại" đúng disabled.
- Bấm "↶ Hoàn tác" (qua JS) → đúng quay về "4 món · tổng ước tính 8.000.000 đ".
- Bấm "↷ Làm lại" (qua JS) → đúng quay lại "5 món · 16.000.000 đ".
- Phím `Ctrl+Z` (qua `computer` key action thật, không phải JS) → đúng quay về "4 món · 8.000.000 đ" — xác nhận phím tắt hoạt động thật, không chỉ nút bấm.
- Bấm "+ Bàn" (thao tác mới sau khi hoàn tác) → đúng "5 món · 12.000.000 đ" (đúng giá Bàn, không phải Ghế/sofa cũ) + xác nhận `redoBtn.disabled === true` — nhánh Làm lại cũ bị xoá đúng, không phục hồi nhầm.
- Bấm swatch màu tường đầu tiên → nút Hoàn tác đúng title "Hoàn tác: Đổi màu tường".
- Bấm "Đặt lại bố trí" → đúng về "4 món · 8.000.000 đ" (đúng 4 món AI gốc), nút Hoàn tác đúng title "Hoàn tác: Đặt lại bố trí" — xác nhận cả hành động reset cũng được đưa vào lịch sử.
- Console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác (kiểm tra `onlyErrors` sau mỗi bước).
- Không phát hiện lỗi mới nào.
