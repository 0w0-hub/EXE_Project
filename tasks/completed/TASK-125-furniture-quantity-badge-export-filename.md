# TASK-125

## Title

Huy hiệu số lượng nội thất theo loại + đặt tên file khi tải ảnh 3D

## Goal

Round 22 — hỏi lại ChatGPT lần 14 tại phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, được 6 ý tưởng: Recently Used Furniture, Duplicate Detection trong Scene, Furniture Quantity Badge, Focus Mode cho 3D, Export Filename tự động, Confirm cho thao tác phá huỷ. Trước khi giao việc, tự đối chiếu với code:

- "Duplicate Detection trong Scene" — premise YẾU: phòng thật hoàn toàn có thể có nhiều món CÙNG loại một cách CÓ CHỦ Ý (vd phòng khách có 2-3 ghế, phòng ngủ có 2 tủ đầu giường — đúng cách nhiều loại đồ đã thiết kế từ TASK-045 trở đi). Cảnh báo "trùng loại" sẽ báo nhầm liên tục cho use case bình thường, gây phiền hơn giúp ích. Loại.
- "Confirm cho thao tác phá huỷ" (reset toàn bộ layout) — premise YẾU: hành động "Đặt lại bố trí" ĐÃ nằm trong Undo/Redo (TASK-102, xác nhận `pushHistory('Đặt lại bố trí')` đã gọi đúng chỗ) — không phải thao tác KHÔNG THỂ hoàn tác như ChatGPT mô tả, Ctrl+Z khôi phục ngay được. Thêm confirm dialog cho hành động ĐÃ có lưới an toàn Undo là dư thừa. Loại.
- "Focus Mode cho 3D" — TRÙNG khái niệm với "Collapsible Panels trong Editor" (round 20, còn dư trong backlog) — cả 2 cùng nhắm tới mục tiêu "tăng diện tích xem 3D bằng cách ẩn tạm panel phụ". Để dành làm 1 lần cho đàng hoàng ở round sau (không vội làm 1 bản rút gọn rồi phải sửa lại).
- "Recently Used Furniture" — hợp lệ, nhưng độ ưu tiên thấp hơn 2 ý tưởng còn lại (catalog hiện đã có ô tìm kiếm TASK-065 + nhóm theo phòng TASK-055, đủ dùng cho phần lớn trường hợp) — để dành round sau.

Chọn 2 ý tưởng nhỏ, an toàn, cùng đụng `Room3DViewer.jsx` nên coordinator tự làm 1 lượt (không giao agent):

**Phần A — "Furniture Quantity Badge"**: vấn đề thật — dòng tóm tắt "X món · tổng ước tính Y đ" (TASK-067) chỉ cho biết TỔNG số món, không cho biết PHÂN BỔ theo loại (vd đang có 3 ghế nhưng chỉ 1 đèn) — phải đếm thủ công qua danh sách bên dưới.

**Phần B — "Export Filename tự động"**: vấn đề thật — `captureScreenshot()` (TASK-033, mở rộng TASK-121) hiện đặt tên file CỐ ĐỊNH dạng `homely-3d-{timestamp}.png` — không có ý nghĩa gì khi user tải nhiều ảnh của nhiều phòng khác nhau, phải tự đổi tên sau khi tải.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - Phần A: hàm nhỏ `categoryLabel(category)` — tái dùng dữ liệu ĐÃ CÓ trong `CUSTOM_FURNITURE_PRESETS[category]?.name` (bỏ hậu tố " (mới thêm)"), fallback về chính `category` nếu không có preset khớp — KHÔNG tạo dictionary nhãn mới trùng lặp dữ liệu đã có. Tính `categoryCounts` từ `localFurniture` (đếm theo `item.category`), render thành các badge nhỏ (vd "Ghế/sofa ×3") ngay dưới dòng tóm tắt "X món · tổng ước tính" (TASK-067) — chỉ hiện khi có ít nhất 1 loại xuất hiện ≥ 2 lần (đúng đúng giá trị cốt lõi ChatGPT nêu: "giúp kiểm tra nhanh bố cục" khi có nhiều món cùng loại, tránh rối mắt khi mọi loại đều chỉ có 1 món).
  - Phần B: sửa `captureScreenshot(multiplier)` (TASK-121) — đổi `link.download` từ `homely-3d-{Date.now()}.png` sang tên có ý nghĩa dựa trên dữ liệu ĐÃ CÓ SẴN trong props (`room?.roomType`, ngày hiện tại) — vd `homely-{roomType-khong-dau}-{yyyy-mm-dd}.png`. Xử lý an toàn khi `room?.roomType` rỗng (fallback về "phong").

## Out of scope

- Không thêm "Recently Used Furniture"/"Focus Mode"/"Duplicate Detection"/"Confirm dialog" (đã loại hoặc để dành round sau — xem Goal).
- Không đổi cấu trúc dữ liệu `localFurniture`/`category` — chỉ đọc, không ghi thêm field mới.
- Không đụng `DesignResult.jsx`/backend.

## Dependencies

TASK-067 (dòng tóm tắt gốc), TASK-033/121 (captureScreenshot gốc + mở rộng multiplier).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Phòng có ≥2 món cùng loại → hiện đúng badge số lượng loại đó; phòng mọi loại chỉ có 1 món → không hiện badge nào (không rối mắt).
- Thêm/xoá món qua bất kỳ cách nào (nút, menu chuột phải TASK-124) → badge cập nhật đúng ngay.
- Tải ảnh (bất kỳ độ phân giải nào, TASK-121) → tên file tải về có ý nghĩa (chứa loại phòng + ngày), không còn dạng `homely-3d-{số}.png`.
- Không hồi quy dòng tóm tắt gốc/nút tải ảnh/bất kỳ chức năng nào khác.
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (đọc `link.download`/`href` qua kỹ thuật chặn thẻ `<a>` đã dùng ở TASK-121 để xác nhận tên file thật, không cần tải file thật xuống máy).

## Coordinator verification

- `npm run build` PASS, Docker rebuild frontend + Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: thêm 2 món "Ghế/sofa" (đã có sẵn "Sofa/giường chính" cùng category `seating`) → badge "Ghế/sofa ×3" hiện đúng ngay dưới dòng tóm tắt; Hoàn tác 2 lần → badge tự ẩn đúng (mọi loại về lại 1 món). Chặn thẻ `<a>` tải file (đúng kỹ thuật TASK-121) → xác nhận tên file "Tải ảnh (Chuẩn)" đúng dạng `homely-phong-khach-2026-09-17.png` (loại phòng + ngày thật, không còn timestamp vô nghĩa).
- Console sạch lỗi.
- Không hồi quy: dòng tóm tắt gốc (TASK-067), nút tải ảnh 3 mức độ phân giải (TASK-121), Undo/Redo.

## Status

COMPLETED
