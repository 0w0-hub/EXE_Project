# TASK-092

## Title

Mẫu cấu hình phòng nhanh do user tự lưu (Room Preference Presets — thuần client-side)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 5 — ý tưởng "Room Preference Presets"/"Room Setup Presets" ChatGPT đề xuất. Khác với `Templates.jsx` đã có (mẫu CỐ ĐỊNH do dự án định nghĩa sẵn, TASK-016), đây là preset DO CHÍNH USER TỰ LƯU LẠI từ lần nhập trước để tái sử dụng nhanh — 2 khái niệm khác nhau, không thay thế nhau.

## Scope

- Đọc `frontend/src/pages/RoomNew.jsx` toàn bộ trước khi sửa — nắm rõ cấu trúc state form hiện có (loại phòng, kích thước, phong cách, màu sắc, nội thất mong muốn, ngân sách, text tự do — xem `docs/project/requirements.md` nếu cần đối chiếu input đầy đủ).
- Thêm vào `RoomNew.jsx` (hoặc tách component mới `frontend/src/components/RoomPresetBar.jsx` nếu thấy gọn hơn — tự quyết định):
  - Nút "💾 Lưu làm mẫu" — lưu TOÀN BỘ giá trị form hiện tại (không phải chỉ 1 vài field) vào `localStorage` (key `homely_room_presets`, mảng JSON, mỗi preset có `id`, `name` do user đặt, và snapshot các field form), hỏi tên preset qua `prompt()` đơn giản (dự án đã dùng `prompt()`/`confirm()` gốc trình duyệt ở đâu chưa — kiểm tra trước; nếu chưa từng dùng, `prompt()` vẫn chấp nhận được cho MVP, không cần tự xây modal riêng).
  - Dải chip hiển thị các preset đã lưu (tên preset) — bấm vào 1 preset để ĐIỀN LẠI toàn bộ form theo đúng giá trị đã lưu (không mất khả năng tự sửa lại sau khi điền, giống hành vi chip chọn nhanh phong cách đã có ở TASK-013).
  - Nút xoá riêng từng preset (nhỏ, cạnh mỗi chip).
  - Không có preset nào → không hiện dải chip (không hiện khối rỗng gây rối).

## Out of scope

- Không lưu preset lên backend/tài khoản (thuần `localStorage`, chỉ tồn tại trên trình duyệt hiện tại — nếu cần đồng bộ nhiều thiết bị, để dành task riêng sau).
- Không đụng `Templates.jsx` (mẫu preset CỐ ĐỊNH của dự án, khác khái niệm — xem Goal).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`.

## Dependencies

`RoomNew.jsx` (form hiện có), TASK-013 (pattern chip chọn nhanh đã có).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Điền form với vài giá trị cụ thể → bấm "Lưu làm mẫu" → đặt tên → chip mới xuất hiện.
- Xoá trắng form (hoặc rời trang rồi quay lại) → bấm vào chip preset → toàn bộ field điền lại đúng như lúc lưu.
- Xoá 1 preset → chip biến mất, các preset khác không đổi.
- Tải lại trang (F5 thật) → preset đã lưu vẫn còn (xác nhận `localStorage` hoạt động đúng, không phải state React tạm thời).
- Không hồi quy luồng tạo phòng/generate thiết kế hiện có.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật (`task077-tester@example.com`). Lưu ý kỹ thuật: component dùng `window.prompt()` thật — Claude-in-Chrome tránh trigger dialog JS gốc (có thể treo phiên điều khiển), nên verify bằng cách ghi đè `window.prompt = () => 'Mau test E2E'` qua JS trước khi bấm nút (kỹ thuật test tiêu chuẩn, không phải hành vi app khác biệt):
- Điền `Chiều rộng = 3.5`, chọn "Phòng khách" → bấm "💾 Lưu làm mẫu" → chip "Mau test E2E" xuất hiện ngay.
- Xoá trắng ô chiều rộng → bấm vào chip (áp dụng preset) → ô chiều rộng điền lại đúng "3,5" (định dạng số theo locale, cùng giá trị 3.5 đã lưu).
- Bấm nút xoá (×) trên chip → chip biến mất, không còn dải preset nào (đúng hành vi "không hiện khối rỗng").
- Console sạch lỗi.
- Không phát hiện lỗi mới nào.
