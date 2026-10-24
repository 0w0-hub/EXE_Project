# TASK-037

## Title

Thêm loại đồ Giường/Bàn làm việc + sửa lỗi chồng lấn thật khi món có chiều sâu lớn

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Thêm 2 loại đồ mới có thể tự thêm ngoài 4 category AI cố định: Giường (phù hợp phòng ngủ) và Bàn làm việc — dùng model CC0 mới từ Kenney Furniture Kit đã cache sẵn trong scratchpad. Trong lúc tự verify, phát hiện + sửa 1 lỗi chồng lấn thật trong `resolveFurniturePositions` (TASK-019/032) mà việc thêm giường (món có chiều sâu 2m, lớn hơn hẳn mọi món trước đó) làm lộ ra.

## Scope

- 4 model `.glb` mới (CC0, xác nhận header `glTF` + tên material qua đọc JSON chunk trước khi dùng — `bedDouble→decor-bed.glb`, `bedSingle→decor-bed-2.glb`, `desk→decor-desk.glb`, `deskCorner→decor-desk-2.glb`) vào `frontend/public/furniture/`, cập nhật `CREDITS.txt`.
- `Room3DViewer.jsx`: thêm `bed`/`desk` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Giường"/"Bàn làm việc"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS` — nút "+ Giường"/"+ Bàn làm việc" tự xuất hiện (UI đã generic hoá từ `CATEGORY_LABELS_VI`, không cần sửa JSX).
- `furnitureLayout.js#furnitureSize`: thêm kích thước `bed` (1.6×0.6×2.0m) và `desk` (1.2×0.75×0.6m).
- **Lỗi thật phát hiện khi verify**: `resolveFurniturePositions` nhóm món theo "hàng" dựa trên toạ độ z heuristic BAN ĐẦU, sau đó dịch các "hàng con" (khi 1 hàng quá đông món, TASK-032) theo `maxDepth` của cả hàng — nhưng bước dịch này không biết tới các HÀNG KHÁC đã tồn tại độc lập. Với món có `d` (chiều sâu) lớn bất thường (giường 2m so với mức phổ biến trước đó ≤1.4m), hàng con bị dịch có thể lấn đúng vào dải z của 1 hàng độc lập khác (tái hiện thật: "Giường" chồng lên "Bàn trung tâm"). Sửa bằng cách thêm 1 vòng lặp "lưới an toàn" cuối cùng (tối đa 6 lần quét) kiểm tra CHỒNG LẤN 2D THẬT giữa mọi cặp món (không chỉ cùng hàng) và đẩy món có index lớn hơn ra xa theo trục z, bù ngược lại món kia nếu bị kẹt mép phòng.

## Out of scope

- Không đổi cơ chế "hàng con" gốc (TASK-032) — chỉ thêm bước an toàn bổ sung sau đó.
- Không cố giải quyết tuyệt đối trường hợp cực đoan phi thực tế (nhồi cả 12 loại đồ tự thêm + 4 loại AI cố định vào phòng 5×5m — tổng diện tích các món đã vượt khả năng chứa vật lý của phòng); phòng ở kích thước thực tế hơn (8×8m) đã xác nhận sạch chồng lấn với đủ 12 loại đồ.

## Dependencies

TASK-036 (COMPLETED, cùng đợt tự động nâng cấp); logic thay đổi trong `resolveFurniturePositions` từ TASK-019/032.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Giường"/"+ Bàn làm việc" xuất hiện trong panel "Nội thất trong phòng", thêm đúng model 3D thật (không phải khối hộp).
- Sơ đồ mặt bằng 2D + scene 3D không còn hiển thị chồng lấn giữa "Giường" và bất kỳ món nào khác trong kịch bản tái hiện lỗi thật (phòng 5×5m, đủ 4 món AI gốc + Giường + Bàn làm việc).
- Không hồi quy kịch bản TASK-032 gốc (6 món đông đúc, khác category).
- "Đặt lại bố trí" xoá đúng cả 2 món mới thêm, không ảnh hưởng danh sách AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (trước khi deploy) verify 4 kịch bản qua `resolveFurniturePositions`/`furnitureSize` thật:
  1. Kịch bản lỗi thật (4 món AI gốc + Giường + Bàn làm việc, phòng 5×5m) — trước fix: 1 cặp chồng lấn ("Bàn trung tâm" × "Giường"); sau fix: 0 cặp.
  2. Kịch bản gốc TASK-032 (6 món đông đúc) — vẫn 0 cặp chồng lấn (không hồi quy).
  3. Kịch bản cực đoan tự tạo (đủ 12 loại đồ tự thêm + AI, phòng 5×5m — vượt khả năng chứa vật lý thực tế) — còn 2 cặp chồng lấn nhỏ, chấp nhận là giới hạn đã biết (không phải kịch bản người dùng thực tế sẽ gặp qua luồng thêm từng món một).
  4. Cùng 12 loại đồ, phòng 8×8m (thực tế hơn) — 0 cặp chồng lấn.
- Verify E2E qua Docker + browser thật: đăng ký + tạo room/preference/job mới qua API (tài khoản JWT cũ hết hạn giữa phiên) vì job đã dùng trước đó (không có ảnh AI thật, phù hợp phòng ngủ) — click "+ Giường" + "+ Bàn làm việc", xác nhận:
  - `read_network_requests` xác nhận `decor-bed-2.glb`/`decor-desk.glb` tải 200.
  - JS đọc trực tiếp `<rect>` trong `svg.room2d-plan` xác nhận 0 cặp chồng lấn hình học thật (so khớp tọa độ x/y/w/h từng cặp).
  - Screenshot xác nhận cả scene 3D lẫn sơ đồ 2D hiển thị giường/bàn làm việc tách biệt rõ ràng, đúng hình dạng model thật (không phải khối hộp).
  - "Đặt lại bố trí" xoá đúng về lại 4 món AI gốc.
  - Console sạch lỗi xuyên suốt.

## Status

COMPLETED
