# TASK-116

## Title

Đặt lại vị trí/góc xoay 1 món nội thất (Reset Transform)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 17 — hỏi lại ChatGPT lần 11 tại phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, được 6 ý tưởng: Snap-to-Grid, Reset Transform cho từng món, Color Palette History, Unit Display Toggle, Keyboard Shortcut Cheat Sheet, Reduced Motion/Animation Toggle. Trước khi giao việc, tự kiểm tra code:

- "Keyboard Shortcut Cheat Sheet" — TRÙNG 100% với bảng tra cứu phím tắt "❓ Phím tắt" đã có từ TASK-061 (`showShortcutsHelp`, `Room3DViewer.jsx` dòng ~809-2010). Loại.
- "Unit Display Toggle" (m/cm/ft) — giá trị thấp cho thị trường Việt Nam (dự án dùng mét xuyên suốt, ft/in không phải nhu cầu thực tế; cm cũng ít cần vì kích thước phòng luôn ở mức mét), lại phải sửa cả hiển thị trong `Room3DViewer.jsx` (nhãn kích thước 3D + sơ đồ 2D) lẫn 4 trang khác (`Dashboard.jsx`/`DesignSummary.jsx`/`SharedDesign.jsx`/`RoomNew.jsx`) — công sức lớn, lợi ích nhỏ. Loại.
- "Snap-to-Grid", "Color Palette History", "Reduced Motion Toggle" — đều đụng `Room3DViewer.jsx` (đã grep xác nhận: color picker tường/sàn/trần + màu món đang chọn, nút tự động xoay TASK-076 đều nằm trong file này). Để dành round sau, không dồn 3 việc cùng đụng 1 file lớn vào 1 round.

Chỉ chọn "Reset Transform cho từng món" round này — đủ nhỏ, giá trị rõ ràng, không trùng lặp "Đặt lại bố trí" (TASK-028, reset TOÀN BỘ thay đổi tạm thời gồm cả thêm/xoá món + màu) hay "Hoàn tác/Làm lại" (TASK-102, **CỐ TÌNH KHÔNG** theo dõi vị trí/góc xoay kéo-thả trong lịch sử — quyết định kiến trúc giữ nguyên từ TASK-028: vị trí/góc xoay chỉ tồn tại trong mesh three.js, không đồng bộ vào state React). Vấn đề thật: user kéo/xoay lệch 1 món quá xa, muốn đưa lại đúng 1 món đó về vị trí/góc xoay ban đầu mà KHÔNG muốn mất các thay đổi khác (thêm món mới, đổi màu, sửa giá...) như "Đặt lại bố trí" sẽ làm.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Thêm hàm `resetSelectedTransform()` theo đúng pattern không-rebuild-scene của `focusOnSelected`/`setTopView`/`rotateSelected` (TASK-058/034/075) — tính lại vị trí gốc qua `resolveFurniturePositions(localFurniture, width, length)` cho đúng món đang chọn (nguồn sự thật duy nhất, đã dùng lại nhiều lần TASK-058/060), đặt `mesh.position.set(x, size.h/2, z)` + `mesh.rotation.y = 0` (góc xoay mặc định — mọi món luôn khởi tạo `rotation.y = 0` trước khi user tự xoay qua dblclick TASK-034/Q-E TASK-042).
  - Nút "↺ Đặt lại vị trí/góc xoay" cạnh 2 nút "↺ Xoay trái"/"↻ Xoay phải" (TASK-075) — disabled khi chưa chọn món, khoá bởi Preview Mode (TASK-105, đây LÀ thao tác mutation vị trí/góc xoay, khác góc nhìn camera thuần tuý).
  - KHÔNG đưa vào Undo/Redo (TASK-102) — nhất quán với việc kéo-thả/xoay bằng chuột/phím cũng không được theo dõi trong lịch sử (quyết định kiến trúc TASK-028/102, không viết lại).

## Out of scope

- Snap-to-Grid, Color Palette History, Reduced Motion Toggle (để dành round 18).
- Reset scale — không có tính năng scale món nội thất trong dự án, không bịa thêm.
- Không đổi `Room2DPlan` (sơ đồ mặt bằng 2D không hiển thị góc xoay/vị trí lệch tay vì luôn vẽ theo `resolveFurniturePositions`, không bị ảnh hưởng bởi kéo-thả 3D).

## Dependencies

TASK-034 (xoay 90°), TASK-042 (xoay 15° Q/E), TASK-058 (focus camera dùng `resolveFurniturePositions`), TASK-075 (2 nút xoay trên toolbar), TASK-105 (Preview Mode khoá mutation).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Kéo 1 món ra xa + xoay lệch → bấm "↺ Đặt lại vị trí/góc xoay" → món quay đúng lại vị trí tính từ `resolveFurniturePositions` + góc xoay 0°, các món khác/màu sắc/danh sách nội thất không đổi.
- Bật Preview Mode → nút bị khoá đúng (không chỉ đọc `.disabled` — dùng `element.matches(':disabled')` theo đúng bài học TASK-105).
- Không hồi quy xoay 90°/15°, kéo-thả, Undo/Redo, camera presets, ẩn/hiện món.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS.
- Docker rebuild đầy đủ (`homely_backend`, `homely_frontend`), Playwright regression (`npm run test:e2e`) — 3/3 PASS.
- Verify thật qua Claude-in-Chrome, 2 phiên độc lập:
  - Phiên 1 (job `c54b3649-...`, tài khoản có sẵn): chọn "Bàn trung tâm" qua danh sách nội thất (bấm tên trong `<li>`, đúng cơ chế TASK-109), xoay 30° qua nút "Xoay trái 15°" ×2 → viền chọn lệch góc rõ rệt so với thảm dưới sàn → bấm "↺ Đặt lại vị trí/góc xoay" → viền chọn trở lại thẳng trục đúng. Preview Mode bật → nút khoá đúng (`element.matches(':disabled') === true`, không chỉ đọc `.disabled` — đúng bài học TASK-105).
  - Phiên 2 (tài khoản mới đăng ký `task116b-tester@example.com`, phòng/job mới tạo từ đầu, console theo dõi từ lúc tải trang): chọn "Kệ/tủ lưu trữ", xoay 45° qua nút "Xoay phải 15°" ×3 → viền chọn lệch rõ so với hình khối món → bấm nút reset → viền chọn trở lại đúng khối chữ nhật thẳng trục của món. Console sạch lỗi xuyên suốt từ lúc tải trang đăng ký → tạo phòng → generate → xem kết quả → thao tác xoay/reset.
- Không hồi quy xoay 90°/15° (TASK-034/042/075), kéo-thả, Undo/Redo (TASK-102), camera presets (TASK-112), ẩn/hiện món (TASK-109) — không thao tác nào trong số này bị ảnh hưởng bởi thay đổi.
- Ghi nhận (không phải lỗi liên quan tính năng): click trực tiếp vào mesh 3D qua toạ độ `computer` tool đôi lúc không trúng do lệch ánh xạ toạ độ (Known Issue công cụ đã ghi từ TASK-011→016) — chuyển sang chọn bằng danh sách nội thất (tên trong `<li>`) hoặc gọi thẳng qua `javascript_tool` khi cần độ tin cậy cao hơn.

## Status

COMPLETED
