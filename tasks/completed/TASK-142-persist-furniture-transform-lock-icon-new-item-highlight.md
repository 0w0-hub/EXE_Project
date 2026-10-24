# TASK-142

## Title

Giữ vị trí/góc xoay nội thất qua rebuild + icon khoá trong danh sách + highlight món mới thêm

## Goal

3 ý tưởng — 1 sửa gốc kiến trúc (do chính coordinator phát hiện ở TASK-141, ChatGPT round 25 độc lập xác nhận lại giá trị) + 2 ý nhỏ liên quan. Đã vét trước 3 ý tưởng khác cùng batch — loại cả 3 TRƯỚC KHI giao việc:
- "Scene Object Count trong Editor" — ĐÃ CÓ: dòng "{N} món · tổng ước tính ..." (TASK-067) đã hiển thị đúng số lượng món ngay trong panel "Nội thất trong phòng" (khu vực editor).
- "Empty Selection State rõ ràng" — ĐÃ CÓ: đọc lại chuỗi text trạng thái nhánh mặc định (chưa chọn món) xác nhận ĐÃ có hướng dẫn rõ ràng "...nhấp 1 lần để chọn rồi dùng phím mũi tên/Delete..." — không hề trống như ChatGPT mô tả.
- "Preserve Selection qua các Toggle" — ĐÃ CÓ 100%: đọc lại code xác nhận khối "TASK-049: tự chọn lại đúng món đã chọn trước khi scene rebuild" chạy KHÔNG ĐIỀU KIỆN sau MỌI lần rebuild (không riêng theo toggle nào) — đã tự xác nhận qua verify TASK-141 (chọn "Bàn trung tâm" vẫn giữ nguyên qua nhiều lần khoá/isolate/toggle khác).

- **Giữ vị trí/góc xoay nội thất qua rebuild** (sửa gốc, ChatGPT round 25 độc lập xác nhận đây là ưu tiên cao nhất "vì sửa lỗi kiến trúc thực tế vừa phát hiện, giá trị cao hơn thêm 1 UI mới"): vị trí/góc xoay chỉnh bằng kéo-thả/phím/nhấp đúp KHÔNG lưu vào state React (TASK-028) — mọi thay đổi CHƯA LƯU bị MẤT SẠCH mỗi khi bấm BẤT KỲ toggle nào kích hoạt rebuild scene (Ẩn nhãn, Buổi tối, Khoá món, Isolate, Lưới sàn...). Camera đã được sửa (TASK-139, `prevCameraStateRef`) — nay áp dụng ĐÚNG KỸ THUẬT TƯƠNG TỰ cho từng món nội thất.
- **Hiển thị trạng thái Khoá trong danh sách**: icon 🔒 ngay trong danh sách "Nội thất trong phòng" cho món đã khoá (TASK-141) — tận dụng `lockedIndices` có sẵn, không thêm cơ chế mới.
- **Highlight món vừa thêm**: sau khi `addFurniture`, món mới được outline nổi bật trong vài giây rồi tự trở về bình thường — giúp nhận ra ngay món vừa xuất hiện trong scene nhiều đồ.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - **Giữ transform qua rebuild** (ĐÚNG PATTERN `prevCameraStateRef`/TASK-139):
    - `const transformOverridesRef = useRef({})` (map `index → {x, z, rotationY}`) + `const prevLocalFurnitureRef = useRef(null)` (tham chiếu mảng `localFurniture` của lần render trước).
    - Đầu effect: `const sameFurniture = prevLocalFurnitureRef.current === localFurniture` — TRUE nghĩa là KHÔNG có thay đổi CẤU TRÚC (thêm/xoá/"Đặt lại bố trí" đều gán mảng MỚI qua `setLocalFurniture`, tự động làm `sameFurniture` thành `false`) — chỉ 1 toggle cosmetic khác vừa đổi, chỉ số các món vẫn khớp đúng, AN TOÀN áp dụng lại override theo index.
    - Trong vòng lặp tạo nội thất: nếu `sameFurniture` và có `transformOverridesRef.current[idx]` → dùng vị trí/góc xoay đã lưu THAY VÌ giá trị tính từ `resolveFurniturePositions`; ngược lại dùng như cũ.
    - Mảng MỚI `meshesForTransformCapture` — push MỌI mesh (kể cả đang ẩn/isolate, khác `draggables` chỉ chứa mesh hiển thị) ngay trong vòng lặp.
    - Trong cleanup của effect (CÙNG CHỖ `prevCameraStateRef` được chụp, TRƯỚC khi mesh bị dispose): duyệt `meshesForTransformCapture`, ghi `transformOverridesRef.current = { [index]: {x, z, rotationY}, ... }`; cập nhật `prevLocalFurnitureRef.current = localFurniture`.
  - **Icon khoá trong danh sách**: trong `<li>` của từng món (danh sách "Nội thất trong phòng"), thêm `{lockedIndices.has(idx) && <span title="Đã khoá vị trí/góc xoay">🔒</span>}` cạnh tên món.
  - **Highlight món vừa thêm**: bridge state `justAddedIndex` (số hoặc `null`). Trong `addFurniture()`: sau khi `setLocalFurniture`, set `justAddedIndex` = index của món vừa thêm (`prev.length` TRƯỚC khi thêm), rồi `setTimeout` ~2 giây sau tự set về `null`. Trong effect dựng scene: món có `idx === justAddedIndex` → dùng màu viền nổi bật riêng (tái dùng cơ chế `hoverOutline`/`selectionOutline` — thêm 1 outline thứ 3 dùng chung `newItemOutline`, hoặc đơn giản hơn: tạm thời tô sáng viền `EdgesGeometry` ngay trên chính mesh đó bằng material phát sáng nhẹ, tự thu hồi khi `justAddedIndex` đổi).

## Out of scope

- Không giữ transform qua việc ĐỔI PHÒNG/thiết kế khác (`localFurniture` tự đổi reference, override tự làm mới — đúng hành vi mong muốn).
- Không giữ transform qua "Đặt lại bố trí" (cố tình — đây là hành động MUỐN xoá sạch mọi tuỳ chỉnh tạm thời, đúng ý nghĩa gốc của nút).
- Không đưa transform override vào Undo/Redo (nhất quán quyết định kiến trúc TASK-028/102/116 — vị trí/góc xoay kéo-thả vẫn KHÔNG theo dõi trong lịch sử, chỉ khác ở chỗ nay SỐNG SÓT qua rebuild thay vì mất ngay).
- 3 ý tưởng đã loại ở mục Goal.

## Dependencies

TASK-139 (`prevCameraStateRef`, kỹ thuật chụp-trong-cleanup tái sử dụng trực tiếp), TASK-141 (`lockedIndices`, tái dùng cho icon khoá), TASK-041 (`addFurniture`, nơi gắn `justAddedIndex`).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Kéo 1 món tới vị trí mới (không lưu), bấm BẤT KỲ toggle nào (vd "Ẩn nhãn") → món GIỮ NGUYÊN vị trí mới, KHÔNG nhảy về vị trí tính toán ban đầu.
- Xoay 1 món (Q/E hoặc nút xoay), bấm toggle khác → góc xoay giữ nguyên.
- Thêm 1 món mới → bấm toggle → món mới KHÔNG bị đẩy về vị trí mặc định khác (dù chưa từng bị kéo, giá trị mặc định = giá trị override ban đầu nên nhất quán).
- Bấm "Đặt lại bố trí" → MỌI vị trí/góc xoay tuỳ chỉnh (kể cả món chưa toggle qua) đều về đúng mặc định ban đầu — không hồi quy hành vi gốc.
- Chuyển sang thiết kế/phòng khác → không có transform "rò rỉ" từ phòng cũ.
- Món đã khoá hiện đúng icon 🔒 trong danh sách "Nội thất trong phòng".
- Thêm 1 món mới → outline nổi bật hiện ngay, tự biến mất sau ~2 giây.
- Không hồi quy: mọi tính năng đã có (kéo-thả, Snap-to-Grid, Alignment Guides, khoảng cách tới tường, khoá/isolate/lưới sàn/highlight sàn TASK-141, camera giữ nguyên TASK-139).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Ưu tiên verify KỸ phần giữ transform (rủi ro cao nhất, đụng lõi tạo mesh) trước khi làm 2 tính năng nhỏ còn lại — đúng bài học TASK-139/141. Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- **Giữ transform qua rebuild** (đúng pattern `prevCameraStateRef`): `transformOverridesRef` (map `index → {x,z,rotationY}`) chụp trong cleanup của effect dựng scene, `prevLocalFurnitureRef` + so sánh `===` xác định `sameFurniture`. Vòng lặp tạo nội thất dùng `savedTransform` khi `sameFurniture` thay vì luôn tính lại từ `resolveFurniturePositions`.
- **2 lỗi thật phát hiện lúc verify (không phải lúc code), cả 2 đều ở nút "Đặt lại bố trí"**:
  1. `setLocalFurniture(furniture)` trong handler reset KHÔNG đảm bảo tạo reference mới khi `localFurniture` chưa từng bị gán lại từ mount (`localFurniture === furniture` prop) — `sameFurniture` vẫn `true` qua reset, giữ nhầm override cũ. Item đã kéo lệch (0.3,0)m/15° KHÔNG về (0,0)m/0° sau khi bấm "Đặt lại bố trí".
  2. Fix đầu tiên (gán thẳng `transformOverridesRef.current = {}` trong `onClick`) KHÔNG hiệu quả — cleanup của effect CŨ chạy SAU click nhưng TRƯỚC effect MỚI, và cleanup luôn chụp lại từ mesh (đang sống, vẫn ở vị trí cũ) — ghi đè ngay lập tức lên chỗ vừa xoá. Sửa đúng bằng cờ `skipTransformCaptureRef`: handler set cờ `true` thay vì đụng thẳng vào map; cleanup kiểm tra cờ — nếu `true` thì `transformOverridesRef.current = {}` + reset cờ về `false`, THAY VÌ chụp từ mesh.
  - Verify live sau fix: kéo+xoay "Bàn trung tâm" → toggle bóng đổ → vị trí/góc xoay GIỮ NGUYÊN (đúng mục đích chính). Bấm "Đặt lại bố trí" → chọn lại món → vị trí `(0,0)m`, góc `0°` (đúng, đã sửa). Re-test toggle-survival lần 2 sau fix (di chuyển khác, toggle khác) → vẫn đúng.
- **Icon khoá trong danh sách**: `{lockedIndices.has(idx) && <span title="Đã khoá vị trí/góc xoay">🔒</span>}` cạnh tên món trong `<li>`. Verify live: khoá "Bàn trung tâm" → icon 🔒 hiện đúng ngay cạnh tên trong danh sách "Nội thất trong phòng".
- **Highlight món vừa thêm**: state `justAddedIndex` set trong `addFurniture()` (= `localFurniture.length` TRƯỚC khi thêm, tránh gọi `setState` lồng trong updater của `setLocalFurniture`), tự `setTimeout` về `null` sau 2s. Mesh `newItemOutline` (màu vàng cam `0xffb020`, khác màu viền chọn/hover) định vị trong vòng lặp tạo nội thất khi `idx === justAddedIndex`. Thêm `justAddedIndex` vào dependency array effect để rebuild đúng lúc hiện/tắt. Verify live: thêm "Gương" → zoom vào scene xác nhận viền vàng cam hiện quanh mesh ngay lập tức; đợi 3s → zoom lại xác nhận viền đã biến mất tự động.
- `npm run build` PASS 2 lần (trước và sau khi thêm 2 tính năng nhỏ). Docker rebuild frontend 2 lần. Playwright TASK-098 regression 3/3 PASS cả 2 lần.
- Verify E2E qua Claude in Chrome: đăng nhập lại (session hết hạn sau rebuild — gặp lại gotcha quen thuộc, lần này còn thêm hiện tượng click toạ độ vào nút "Đăng nhập"/nút "+ thêm đồ" không có tác dụng dù toạ độ đúng — workaround bằng cách set giá trị input qua native setter + dispatch event React nhận được, và bấm nút qua `find` tool lấy ref thay vì toạ độ thô cho nút submit; các nút "+ thêm đồ" trong danh sách vẫn phải bấm qua `document.querySelectorAll('button')` + `.click()` JS trực tiếp mới nhận). Thêm 3 món (Cây cảnh, Thảm, Gương) qua giao diện thật — tổng số món tăng đúng 4→7, viền vàng cam hiện đúng + tự tắt sau ~2-3s, chọn+khoá "Bàn trung tâm" → icon 🔒 hiện đúng trong danh sách.
- Console sạch lỗi (`localhost.*ERROR` pattern, không có kết quả) trong suốt quá trình verify.
- **Chưa live-test riêng** kịch bản "chuyển sang phòng/thiết kế khác không rò rỉ transform" — dựa vào bảo đảm kiến trúc có sẵn (`localFurniture` luôn nhận reference MỚI khi prop `furniture` đổi qua `useEffect` đồng bộ ở dòng ~1037, nên `sameFurniture` tự động `false` đúng lúc đổi phòng) — cùng mức tin cậy đã dùng cho các bảo đảm kiến trúc khác trong session này (vd Preserve Selection qua Toggles ở TASK-141/round 36), không phát sinh rủi ro mới vì không đụng thêm code nào riêng cho việc đổi phòng.

## Status

COMPLETED
