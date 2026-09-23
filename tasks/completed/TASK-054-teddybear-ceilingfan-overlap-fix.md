# TASK-054

## Title

Thêm Gấu bông/Quạt trần + sửa lỗi thật trong lưới an toàn chống chồng lấn (đẩy đối xứng)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Thêm 2 loại đồ mới (Gấu bông — phòng trẻ em, Quạt trần — hình dáng cánh quạt hoàn toàn mới). Trong lúc tự verify, phát hiện lỗi thật đáng kể trong thuật toán chống chồng lấn (`resolveFurniturePositions`, TASK-032/037): thêm bất kỳ 1 món thứ 5 nào vào phòng ở mức RỘNG TỐI THIỂU (1.5m, đúng `MIN_ROOM_METERS`) có thể làm 2 món AI GỐC KHÔNG LIÊN QUAN đè lên nhau — một trạng thái phòng hoàn toàn hợp lệ (user có thể tự kéo-resize phòng xuống mức tối thiểu).

## Scope

- 2 model `.glb` mới (CC0 Kenney, xác nhận header `glTF` + tên material trước khi dùng — `fur`/`wood`/`metalDark` (bear, "fur" không khớp nhánh nào trong `enhanceMaterial()`, giữ nguyên màu gốc, không lỗi) và `metalLight`/`lamp`/`wood` (ceilingFan, đều khớp)):
  - `bear.glb` → `decor-teddybear.glb`
  - `ceilingFan.glb` → `decor-ceilingfan.glb`
- `Room3DViewer.jsx`: thêm `teddybear`/`ceilingfan` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI` ("Gấu bông"/"Quạt trần"), `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`.
- `furnitureLayout.js#furnitureSize`: thêm kích thước `teddybear` (0.35×0.4×0.3m) và `ceilingfan` (0.9×0.3×0.9m — neo sàn đơn giản hoá như mọi model gắn trần/tường khác từ TASK-018).
- **Lỗi thật phát hiện + sửa** trong `resolveFurniturePositions` (`furnitureLayout.js`): lưới an toàn cuối cùng (TASK-037) đẩy CHỈ 1 BÊN (`b`) ra xa theo trục z rồi mới bù `a` nếu `b` bị kẹp mép phòng — cách này hội tụ kém khi 1 món vướng ràng buộc chồng lấn với NHIỀU món khác cùng lúc (2 ràng buộc xung đột có thể đẩy qua đẩy lại giữa các pass, không hội tụ dù tăng lên 40 pass). Sửa bằng cách đẩy ĐỐI XỨNG cả 2 bên (mỗi bên nửa khoảng cách cần thiết), dồn phần thiếu sang bên còn lại nếu 1 bên bị kẹp mép phòng. Tăng số pass từ 6 lên 10 (không phải nguyên nhân chính nhưng an toàn hơn).

## Out of scope

- Không thêm category AI thật — vẫn là loại đồ USER TỰ THÊM.
- Không giải quyết tuyệt đối mọi trường hợp cực đoan (phòng rất nhỏ + rất nhiều món cùng lúc vẫn có thể còn sót — xem kết quả stress test bên dưới) — chấp nhận là giới hạn vật lý, không phải luồng người dùng thông thường.

## Dependencies

TASK-037 (lưới an toàn chống chồng lấn ban đầu, nay được cải thiện thêm), TASK-039 (kịch bản "món dài" tương tự đã dùng để verify TASK-037 trước đây).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nút "+ Gấu bông"/"+ Quạt trần" xuất hiện, thêm đúng model 3D thật.
- **Quan trọng**: phòng ở mức rộng tối thiểu (1.5m) + 5-6 món (bao gồm món AI gốc lẫn tự thêm) không còn chồng lấn — kịch bản lỗi thật đã tái hiện y hệt trong môi trường thật (browser) trước khi sửa.
- Không hồi quy mọi kịch bản chống chồng lấn đã verify trước đó (TASK-032/037/039 và stress test 12 loại đồ).
- Console sạch lỗi.

## Testing

- **Phát hiện lỗi**: verify E2E qua Docker + browser thật trên phòng có kích thước bất thường sót lại từ round test trước (1.5×5.0m, phát hiện qua `GET /api/v1/rooms/{id}`) — thêm "Gấu bông" + "Quạt trần" vào 4 món AI gốc → JS đọc trực tiếp toạ độ `<rect>` trong `svg.room2d-plan` phát hiện 1 cặp chồng lấn thật giữa "Đèn sàn/đèn trang trí" và "Sofa/giường chính" (2 món KHÔNG liên quan đến 2 món vừa thêm).
- **Tái hiện + cô lập nguyên nhân** bằng script Node độc lập (dùng đúng dữ liệu category/position text/thứ tự thật của job qua API, tránh lặp lại sai lầm giả định thứ tự cố định ở TASK-047):
  - Xác nhận với ĐÚNG 4 món AI gốc trong phòng 1.5×5.0m: 0 chồng lấn.
  - Xác nhận CHỈ CẦN THÊM 1 món bất kỳ (gấu bông HOẶC quạt trần, độc lập nhau) vào cùng phòng: đều gây ra 1 cặp chồng lấn giữa 2 món khác — xác nhận đây là lỗi thuật toán tổng quát, không phải do riêng 2 model mới.
  - Test tăng số pass lên 40 (giữ nguyên logic đẩy 1 bên cũ): vẫn còn 1 cặp chồng lấn → xác nhận là lỗi HỘI TỤ (dao động giữa 2 ràng buộc xung đột), không phải thiếu số vòng lặp.
- **Sửa + verify lại** bằng đẩy đối xứng: script Node xác nhận 0 chồng lấn cho toàn bộ các kịch bản đã biết (kịch bản lỗi thật 1.5×5m, TASK-032/037/039 gốc, 12 loại đồ 8×8m) — **và bất ngờ giải quyết luôn** kịch bản cực đoan 12 loại đồ trong phòng 5×5m mà TASK-037 từng chấp nhận là giới hạn đã biết (còn 2 cặp chồng lấn) — nay 0 cặp.
- **Stress test ngẫu nhiên** (script Node, không phải phòng/kịch bản đã biết trước): 300 kịch bản phòng 4-10m + 2-7 món ngẫu nhiên → 0/300 có chồng lấn (khớp mức sử dụng thực tế); 300 kịch bản mở rộng gồm cả phòng rất nhỏ (1.5-10m) + nhiều món hơn (2-9) → 28/300 vẫn còn chồng lấn (đa số là phòng rất nhỏ 1.7-4m kết hợp 7-9 món — kịch bản chật chội cực đoan, chấp nhận là giới hạn vật lý).
- Verify E2E qua Docker + browser thật (tài khoản mới vì tài khoản cũ hết lượt tạo thiết kế FREE trong tháng) — tạo lại đúng phòng 1.5×5.0m, thêm Gấu bông + Quạt trần → JS đọc trực tiếp toạ độ `<rect>` xác nhận 6 món, **0 cặp chồng lấn** (đã sửa); screenshot xác nhận cả 2D lẫn 3D hiển thị đúng, không đè lên nhau; console sạch lỗi.

## Status

COMPLETED
