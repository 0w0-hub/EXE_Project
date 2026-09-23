# TASK-118

## Title

Dọn dẹp thanh công cụ 3D (giảm số nút hiển thị)

## Goal

Phản hồi TRỰC TIẾP từ user (2026-09-17, giữa phiên round 18 của vòng lặp tự động): *"Một vấn đề tôi đang thấy: trên màn hình 3D có quá nhiều nút. Bạn hãy xem đề xuất của chatgpt thế nào và chỉnh sửa sao cho phù hợp"*.

Đúng — sau 18 round tích luỹ tính năng (TASK-004→117), thanh công cụ trên `Room3DViewer.jsx` có **17 nút** xếp hàng ngang/wrap: 5 nút góc nhìn camera (Nhìn từ trên/trước/bên, Góc nhìn đi bộ, Đặt lại góc nhìn), 5 nút thao tác món đang chọn (Tự động xoay 360°, Phóng to, Xoay trái/phải 15°, Đặt lại vị trí/góc xoay — TASK-116), và 7 tiện ích chung (Tải ảnh, Toàn màn hình, Buổi tối/Ban ngày, Phím tắt, Chế độ xem trước, Ẩn/hiện nhãn, Snap — TASK-117).

Hỏi ChatGPT (cùng phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) đề xuất cách tổ chức lại. ChatGPT đưa 4 phương án (dropdown gộp nhóm / 3 nhóm rõ ràng không dropdown / ẩn nút ít dùng vào "⋯" / chỉ hiện nhóm "món đang chọn" khi có selection) kèm đánh đổi từng cách, khuyến nghị triển khai theo thứ tự từng bước.

## Approach

Kết hợp 2 phương án có lợi nhất, không đánh đổi thêm click cho thao tác thường dùng:

1. **Gộp 5 nút góc nhìn camera vào dropdown "📷 Góc nhìn ▾"** — các góc nhìn không phải thao tác lặp lại liên tục trong 1 phiên xem (chọn 1 góc rồi thường giữ nguyên), gộp lại giảm 5→1 nút mà không mất chức năng.
2. **CHỈ hiện 4 nút thao tác món đang chọn khi ĐÃ chọn 1 món** (`selectedFurnitureIndex != null`) — trước đó 4 nút này LUÔN hiện nhưng `disabled` + báo "Nhấp chọn 1 món trong scene trước" khi chưa chọn, nên ẩn hẳn không mất chức năng gì, chỉ đỡ chiếm chỗ ở trạng thái mặc định (chưa chọn món nào — trạng thái phổ biến nhất khi mới mở trang).
3. **Gộp 2 tiện ích ít dùng (Tải ảnh, Phím tắt) vào dropdown "⋯ Thêm ▾"**.
4. Giữ nguyên hiển thị trực tiếp (không gộp): Tự động xoay 360° (toggle hay dùng), Toàn màn hình, Buổi tối/Ban ngày, Chế độ xem trước (an toàn quan trọng), Ẩn/hiện nhãn, Snap (TASK-117, còn mới — giữ hiện để user biết tồn tại).

Kết quả: **8 nút** khi chưa chọn món (từ 17), **12 nút khi đã chọn 1 món** (vẫn giảm đáng kể so với 17, và chỉ hiện khi thực sự cần).

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Import `useEscapeKey` (hook có sẵn từ TASK-090, dùng ở `NavBar.jsx`).
  - State mới `showCameraMenu`/`showMoreMenu` + `cameraMenuRef`/`moreMenuRef`, 1 `useEffect` click-outside dùng chung (cùng pattern `AccountMenu`/`NotificationBell` ở `NavBar.jsx`, TASK-082/083) + `useEscapeKey` cho mỗi dropdown.
  - Dropdown "📷 Góc nhìn ▾" chứa 5 nút camera cũ (mỗi nút tự đóng dropdown sau khi bấm).
  - Nhóm 4 nút "món đang chọn" bọc trong `{selectedFurnitureIndex != null && (...)}`.
  - Dropdown "⋯ Thêm ▾" chứa "Tải ảnh"/"Phím tắt".
- `frontend/src/styles.css`: class `.room3d-dropdown`/`.room3d-dropdown__menu` (mượn nguyên pattern `.account-menu`/`.account-menu__dropdown` đã có, đổi tiền tố cho nhất quán với `room3d-*`).

## Out of scope

- Không đổi hành vi/logic của bất kỳ nút nào — chỉ đổi CÁCH TRUY CẬP (gộp dropdown/ẩn có điều kiện), đúng tinh thần "không xoá chức năng nào" ChatGPT nhấn mạnh.
- Không làm bước 5 ChatGPT đề xuất thêm (tối ưu sâu hơn nữa, ví dụ gộp cả nhóm tiện ích) — 8/12 nút đã giảm đáng kể so với 17, đủ để giải quyết đúng phàn nàn của user; có thể tinh chỉnh thêm sau nếu user vẫn thấy rối.

## Affected Services

Frontend only (`Room3DViewer.jsx`, `styles.css`).

## Acceptance Criteria

- `npm run build` PASS.
- Khi chưa chọn món: thanh công cụ chỉ còn 8 nút/dropdown (Góc nhìn▾, Tự động xoay, Toàn màn hình, Buổi tối, Chế độ xem trước, Ẩn nhãn, Snap, ⋯Thêm▾).
- Bấm "📷 Góc nhìn ▾" → hiện đúng 5 lựa chọn góc nhìn cũ, bấm 1 lựa chọn → camera đổi đúng + dropdown tự đóng.
- Chọn 1 món nội thất → 4 nút thao tác món (Phóng to/Xoay trái/Xoay phải/Đặt lại vị trí) xuất hiện thêm, hoạt động đúng như cũ.
- Bấm "⋯ Thêm ▾" → hiện "Tải ảnh"/"Phím tắt", cả 2 hoạt động đúng như cũ.
- Không hồi quy: mọi nút cũ vẫn hoạt động đúng chức năng (chỉ đổi vị trí/cách hiện), Preview Mode vẫn khoá đúng 2 nút xoay/reset.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild (frontend) + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (kiểm tra cả 2 trạng thái: chưa chọn món / đã chọn món, cả 2 dropdown mở đúng và đóng đúng sau khi bấm 1 mục).

## Coordinator verification

- `npm run build` PASS.
- Docker rebuild + recreate `homely_frontend`, Playwright regression (`npm run test:e2e`) — 3/3 PASS.
- Verify E2E qua Claude-in-Chrome: trạng thái mặc định (chưa chọn món) đúng 8 nút/dropdown hiển thị qua 2 hàng gọn thay vì 4-5 hàng dàn trải cũ (xác nhận qua screenshot). Bấm "Góc nhìn ▾" → dropdown hiện đúng 5 lựa chọn → bấm "Nhìn từ trên" → dropdown tự đóng đúng (xác nhận qua `javascript_tool` kiểm tra DOM, nút "Đặt lại góc nhìn" không còn trong cây DOM sau khi đóng). Chọn 1 món qua danh sách nội thất → xác nhận nút "Phóng to món đã chọn" xuất hiện đúng (trước: không có trong DOM, sau: có). Bấm "⋯ Thêm ▾" → hiện đúng "Tải ảnh"/"Phím tắt" → bấm "Phím tắt" → bảng tra cứu phím tắt (`.room3d-shortcuts-help`) hiện đúng.
- Console sạch lỗi — xác nhận qua tab mới (tab cũ dùng lại để mở ChatGPT bị dính lỗi console tồn đọng từ chatgpt.com, không liên quan app, đã loại trừ bằng cách mở tab mới sạch để kiểm tra lại).
- Không phát hiện lỗi app mới.

## Status

COMPLETED
