# TASK-127

## Title

Camera "Phóng to toàn bộ nội thất" + nút tải ảnh phòng gốc

## Goal

Round 24 — hỏi lại ChatGPT lần 15 tại phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, được 6 ý tưởng: Scene Guides/Alignment Lines, Furniture Duplicate with Offset, Quick "Focus All", Room Image Download, Design Duplicate Shortcut, 3D Viewport Coordinate Indicator. Trước khi giao việc, tự kiểm tra code:

- "Furniture Duplicate with Offset" — TRÙNG 100% với TASK-041 đã có: `duplicateFurniture()` thêm bản sao vào `localFurniture` KHÔNG gán vị trí riêng — vị trí thật tính lại qua `resolveFurniturePositions()` (TASK-037, cải thiện TASK-054), lưới an toàn chống chồng lấn đã tự tách bản sao khỏi bản gốc từ lâu (đúng ghi chú lịch sử TASK-041: "bản sao tự tách khỏi bản gốc nhờ dùng lại lưới an toàn chống chồng lấn"). Loại.
- "Design Duplicate Shortcut" (Ctrl/Cmd+D) — chính ChatGPT ghi điều kiện "chỉ nên làm nếu Round 21 chưa triển khai Duplicate Design" — nhưng "Design Duplicate" đã có từ TASK-093 (rất lâu trước round 21), nút "⧉ Nhân bản để thử nghiệm" đã hoạt động đầy đủ. Thêm phím tắt cho 1 nút bấm sẵn có là giá trị quá thấp so với công sức. Loại.
- "3D Viewport Coordinate Indicator" (hiện X/Y/Z góc viewport) — lệch đối tượng người dùng: Homely là app thiết kế nội thất cho người dùng phổ thông, không phải công cụ CAD/kỹ thuật — toạ độ số thô không có ý nghĩa thực tế với nhóm dùng mục tiêu. Loại.
- "Scene Guides / Alignment Lines" — hợp lệ, giá trị thật, nhưng độ phức tạp cao hơn 2 ý còn lại (cần tính toán căn chỉnh động lúc kéo-thả + vẽ/xoá đường dẫn hướng trong three.js) — để dành round sau làm riêng cho đàng hoàng, không dồn chung với 2 việc nhỏ khác trong cùng 1 lượt.

Chọn 2 ý tưởng nhỏ, an toàn:

**Phần A — "Quick Focus All"**: vấn đề thật — camera hiện có `focusOnSelected` (TASK-058, phóng vào ĐÚNG 1 món đã chọn) nhưng KHÔNG có cách nhanh để xem TOÀN BỘ nội thất trong khung hình cùng lúc — phải tự kéo/zoom camera thủ công khi muốn xem tổng thể bố cục sau khi chỉnh sửa nhiều món.

**Phần B — "Room Image Download"**: vấn đề thật — ảnh phòng GỐC (`beforeUrl`, hiển thị trong khối Trước/Sau TASK-015 + lightbox TASK-124) chỉ XEM được, không có cách tải về máy — khác ảnh AI 2D/chụp scene 3D đều đã có nút tải (TASK-024/033/121).

## Scope

- `frontend/src/components/Room3DViewer.jsx` (Phần A): hàm `focusAll()` — tính bounding box từ TOÀN BỘ vị trí `resolveFurniturePositions(localFurniture, width, length)` (không chỉ 1 món), đặt camera đủ xa để bao trọn (dùng logic tương tự `focusOnSelected` nhưng tính khoảng cách theo kích thước bounding box thay vì 1 món), giữ nguyên `controls.target` ở tâm phòng. Nút "🔭 Xem toàn bộ" đặt trong dropdown "📷 Góc nhìn ▾" (TASK-118, cạnh 5 góc nhìn có sẵn — đúng vị trí logic, cùng nhóm "điều khiển camera thuần tuý", KHÔNG bị khoá Preview Mode).
- `frontend/src/pages/DesignResult.jsx` (Phần B): nút nhỏ "📥 Tải ảnh gốc" cạnh khối Trước/Sau (chỉ hiện khi `beforeUrl` có ảnh thật, đúng điều kiện `{beforeUrl && afterUrl && (...)}`) — dùng `<a>` tạm với `download` + `href={beforeUrl}` (đã là blob object URL có sẵn từ `assetApi.fetchObjectUrl`, không cần gọi thêm API), tên file có ý nghĩa (đúng tinh thần TASK-125 — loại phòng + ngày).

## Out of scope

- Không làm "Scene Guides/Alignment Lines" (để dành round sau).
- Không thêm phím tắt Ctrl/Cmd+D cho Duplicate Design (đã có nút, giá trị thấp).
- Không thêm coordinate indicator.
- Không đụng `focusOnSelected`/toolbar khác ngoài thêm đúng 1 nút mới trong dropdown Góc nhìn.

## Dependencies

TASK-058 (focusOnSelected, mẫu tham khảo), TASK-118 (dropdown Góc nhìn), TASK-015 (khối Trước/Sau gốc), TASK-124 (lightbox ảnh gốc, cùng khu vực Phần B), TASK-125 (quy ước đặt tên file).

## Affected Services

Frontend only (`Room3DViewer.jsx`, `DesignResult.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🔭 Xem toàn bộ" (dropdown Góc nhìn) → camera đổi đúng để nhìn thấy TOÀN BỘ nội thất trong khung hình, không cắt xén món nào ở rìa.
- Bấm "📥 Tải ảnh gốc" → tải đúng file ảnh phòng gốc (không phải ảnh AI), tên file có ý nghĩa.
- Nút tải ảnh gốc KHÔNG hiện khi phòng chưa có ảnh gốc (`beforeUrl` null).
- Không hồi quy: 5 góc nhìn cũ trong dropdown, slider Trước/Sau, lightbox ảnh gốc (TASK-124).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (Phần A đụng `Room3DViewer.jsx`, đúng quy ước không giao agent — gộp luôn Phần B nhỏ cùng lượt cho gọn thay vì tách agent riêng cho 1 thay đổi rất nhỏ). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS, Docker rebuild frontend + Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: bấm "🔭 Xem toàn bộ" (dropdown Góc nhìn) → camera đổi đúng, khung hình gọn hơn hẳn góc nhìn mặc định (zoom sát đúng vùng có 4 món nội thất thay vì hiện cả khoảng trống phòng) — xác nhận khác biệt thật với "Đặt lại góc nhìn" (resetView), không phải tính năng trùng lặp. Chặn thẻ `<a>` tải file (đúng kỹ thuật TASK-121/125) → bấm "📥 Tải ảnh gốc" → tên file đúng `homely-goc-phong-khach-2026-09-17.jpg`.
- Console sạch lỗi.
- Không hồi quy: 5 góc nhìn cũ trong dropdown, slider Trước/Sau, lightbox ảnh gốc (TASK-124).

## Status

COMPLETED
