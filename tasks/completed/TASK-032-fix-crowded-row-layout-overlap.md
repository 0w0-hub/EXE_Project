# TASK-032

## Title

Sửa lỗi chồng lấn/ẩn nội thất khi 1 "hàng" có quá nhiều món (dàn theo nhiều hàng con)

## Goal

Phát hiện trong lúc test TASK-031: khi user tự thêm nhiều món mới cùng mô tả vị trí "góc phòng"/"sát tường" (Tivi, Móc treo đồ, thêm 1 Ghế/sofa — cộng với các món AI gốc cũng thường rơi vào nhóm này), thuật toán dàn đều 1 hàng (TASK-019) không đủ chỗ trên 1 trục x duy nhất, khiến các món bị ép sát/chồng mép nhau — tái hiện lại đúng loại lỗi đã sửa ở TASK-019 (món nhỏ như Tivi gần như biến mất, bị ô Ghế/sofa vẽ đè lên trong sơ đồ 2D) nhưng ở quy mô lớn hơn (6+ món thay vì 2).

## Root cause

`resolveFurniturePositions` (TASK-019) gom các món có `z` gần nhau thành 1 "hàng" rồi dàn đều theo trục `x` duy nhất dựa theo `span = halfW * 2`. Khi tổng bề rộng các món trong hàng (cộng khoảng cách tối thiểu) vượt quá `span`, thuật toán vẫn cố nhồi tất cả vào 1 hàng, dẫn đến các món bị ép sát/chồng lấn — chấp nhận được với 2-3 món (lệch nhẹ), nhưng rõ rệt và gây mất tác dụng hoàn toàn khi có 6+ món (thường xảy ra hơn từ khi có tính năng tự thêm nội thất — TASK-028/031).

## Scope

`frontend/src/lib/furnitureLayout.js#resolveFurniturePositions`: khi 1 hàng vượt quá `span`, tách thành nhiều **hàng con** (bin-packing đơn giản theo thứ tự `x` gốc) — mỗi hàng con dàn đều trên trục `x` như cũ, hàng con sau lùi dần về phía tâm phòng theo trục `z` (không xuyên tường, dùng đúng hướng dựa trên `row.z <= 0`), cách nhau `maxDepth` (độ sâu lớn nhất trong hàng) + khoảng đệm 0.25m.

## Out of scope

- Không đổi heuristic suy đoán vị trí ban đầu (`resolveFurniturePosition`, dựa theo text tự do) — chỉ đổi bước xử lý chồng lấn sau đó.
- Không giới hạn số lượng món user có thể tự thêm (TASK-028) — xử lý ở tầng layout thay vì chặn ở UI.

## Dependencies

TASK-031 (COMPLETED, phát hiện lỗi trong lúc test).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Kịch bản gốc (4 món AI, thường không quá 2-3 món/hàng) — không đổi hành vi (verify bằng cách hàm vẫn trả kết quả tương đương khi không cần "xuống hàng").
- Kịch bản đông (6+ món cùng hàng) — 0 cặp món chồng lấn hoàn toàn, xác nhận bằng script Node độc lập tính khoảng cách tâm giữa mọi cặp món so với nửa tổng kích thước.
- Verify trực quan qua browser thật: Tivi (từng bị ô Ghế/sofa vẽ đè lên trong sơ đồ 2D) giờ hiển thị rõ ràng, tách biệt, ở cả "Không gian 3D" lẫn "Sơ đồ mặt bằng" (TASK-031).
- Console sạch lỗi.

## Testing

- Viết script Node độc lập gọi thẳng `resolveFurniturePositions` (ESM, không qua build) với kịch bản 6 món (storage/seating/lighting/tv/seating/coatrack, đều mô tả "góc"/"sát tường") trong phòng 5×5m — xác nhận 0 cặp chồng lấn TRƯỚC khi build/deploy (bắt lỗi sớm, không cần chờ browser).
- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`): thêm Tivi + Móc treo đồ + 1 Ghế/sofa (tổng 7 món) → zoom xác nhận cả 7 món tách biệt rõ ràng trong "Không gian 3D" (trước đây Tivi gần như lọt thỏm giữa 2 sofa); chuyển sang "Sơ đồ mặt bằng" xác nhận tương tự — cả 7 ô màu tách biệt, không ô nào bị đè hoàn toàn (trước khi sửa, ô Tivi bị ô Ghế/sofa mới thêm vẽ đè gần như hoàn toàn).
- "Đặt lại bố trí" sau khi thêm nhiều món → khôi phục đúng 4 món gốc (trong lúc test phát hiện 1 lỗi PHƯƠNG PHÁP TEST của chính mình — bấm nút reset trong khi đang ở tab "Sơ đồ mặt bằng", nơi nút này không tồn tại trong DOM — không phải bug app, xác nhận lại bằng cách chuyển về tab "Không gian 3D" trước khi bấm, hoạt động đúng 7→4 món).
- `read_console_messages(onlyErrors=true)` sạch lỗi xuyên suốt.

## Status

COMPLETED
