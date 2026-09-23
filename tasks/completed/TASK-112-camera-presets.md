# TASK-112

## Title

Thêm góc nhìn nhanh Trước/Bên (3D Camera Presets)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 14 — ý tưởng ChatGPT đề xuất mới (hỏi lại lần 8 ngày 2026-09-17). Đụng trực tiếp `Room3DViewer.jsx` nên coordinator tự làm trực tiếp, KHÔNG giao agent (đúng quy ước đã giữ xuyên suốt dự án). Đã đọc code xác nhận trước khi làm: hiện có "Nhìn từ trên" (TASK-034, top-down), "Góc nhìn đi bộ" (TASK-076, ngang tầm mắt 1.6m), "Đặt lại góc nhìn" (TASK-034, về đúng góc mặc định lúc dựng scene), "Tự động xoay 360°" (TASK-076). CHƯA có góc nhìn "từ phía trước" (nhìn thẳng vào 1 mặt tường, hữu ích để kiểm tra bố trí tường/tranh treo) hay "từ bên" (kiểm tra chiều sâu bố trí nội thất theo trục vuông góc).

## Scope

- `frontend/src/components/Room3DViewer.jsx`: thêm 2 hàm mới `setFrontView()`/`setSideView()`, CÙNG PATTERN với `setTopView()`/`resetView()` đã có (đổi trực tiếp `cameraRef.current`/`controlsRef.current`, gọi `controls.update()`, KHÔNG rebuild scene — không đụng state React nào khác):
  - `setFrontView()`: camera đặt ở giữa 1 cạnh phòng theo trục Z (nhìn dọc theo trục Z vào giữa phòng), độ cao ngang tầm mắt phòng khách thông thường (giữ nguyên logic tính khoảng cách hợp lý theo kích thước phòng, tương tự cách `setTopView` dùng `Math.max(width, length) * 1.4`).
  - `setSideView()`: tương tự nhưng theo trục X (nhìn dọc trục X).
- Thêm 2 nút "↑ Nhìn từ trước"/"→ Nhìn từ bên" trên thanh công cụ 3D, cạnh nút "↑ Nhìn từ trên" đã có (nhóm góc nhìn nhanh lại gần nhau cho dễ tìm).
- Thêm 2 dòng vào bảng "❓ Phím tắt" (TASK-061) cho nhất quán với các nút góc nhìn khác đã có trong bảng đó.

## Out of scope

- Không thêm phím tắt bàn phím riêng cho 2 góc nhìn mới (chỉ nút bấm, giống "Nhìn từ trên"/"Đặt lại góc nhìn" cũng chỉ có nút, không có phím tắt riêng).
- Không đổi logic `resetView`/`setTopView`/`setWalkthroughView`/`toggleAutoRotate` hiện có.
- Không bị khoá bởi Preview Mode (TASK-105) — đây là góc nhìn camera thuần tuý, cùng nhóm với "Nhìn từ trên"/"Đặt lại góc nhìn" vốn KHÔNG bị khoá (đọc lại code TASK-105 xác nhận trước khi thêm nút — nếu 2 nút cũ không nằm trong fieldset nào thì 2 nút mới cũng phải vậy).

## Dependencies

TASK-034 (Nhìn từ trên/Đặt lại góc nhìn — pattern gốc), TASK-076 (Góc nhìn đi bộ/Tự động xoay), TASK-061 (bảng phím tắt), TASK-105 (xác nhận không bị khoá bởi Preview Mode).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "Nhìn từ trước" → camera đổi đúng sang góc nhìn thẳng vào 1 mặt tường, khác rõ rệt với góc mặc định/từ trên.
- Bấm "Nhìn từ bên" → camera đổi đúng sang góc nhìn vuông góc với "từ trước", khác rõ rệt.
- Bấm "Đặt lại góc nhìn" sau đó → về đúng góc mặc định ban đầu (không hồi quy).
- 2 nút mới hoạt động được cả khi đang bật "🔒 Chế độ xem trước" (không bị khoá).
- Console sạch lỗi.

## Testing

Tự thực hiện trực tiếp (không qua agent) do đụng `Room3DViewer.jsx`. Verify: `npm run build` PASS → rebuild Docker (gộp chung 1 lần với TASK-110/111 sau khi cả 2 agent xong) → chạy lại bộ Playwright (TASK-098) làm regression check → verify E2E qua Claude in Chrome bằng screenshot xác nhận góc nhìn đổi đúng trực quan.

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker cùng đợt với TASK-110/111. Verify E2E qua Claude in Chrome (`task077-tester@example.com`, job thật) — bấm "↑ Nhìn từ trước" → camera đổi đúng sang góc nhìn thẳng vào 1 mặt tường (xác nhận qua screenshot, khác rõ rệt góc mặc định); bấm "→ Nhìn từ bên" → đổi đúng sang góc vuông góc, khác rõ rệt với cả 2 góc trước; "Đặt lại góc nhìn" hoạt động đúng sau đó. Bật "🔒 Chế độ xem trước" → xác nhận qua `:matches(':disabled')`: cả 2 nút mới đều KHÔNG bị khoá, đúng thiết kế. Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
