# TASK-017

## Title

Đồng bộ giao diện Projects (card grid) và Admin — Tất cả thiết kế (filter pill)

## Goal

Sửa 2 điểm còn lệch ngôn ngữ thiết kế so với phần còn lại của app đã recode: `Projects.jsx` vẫn là list phẳng (không phải card grid như Dashboard/Templates), `AdminDesigns.jsx` vẫn dùng `<select>` filter thay vì pill button như Projects/Templates.

## Scope

- `Projects.jsx`: đổi list phẳng sang `.room-grid` grid `.card` (mỗi card: icon theo loại phòng — tái dùng ý tưởng map icon như `RoomNew.jsx`, tên phòng, thời gian tạo, status pill), giữ nguyên tab filter/pagination/logic click-through.
- `AdminDesigns.jsx`: đổi `<select>` lọc trạng thái sang pill buttons (cùng pattern `TABS` như `Projects.jsx`); rút gọn hiển thị Owner ID (8 ký tự đầu + "…") cho dễ đọc trong bảng.
- `styles.css`: thêm `.project-card-icon` (nếu cần), không đổi token/class cốt lõi.

## Out of scope

- Không đổi bảng nào khác, không đổi RBAC/logic filter/phân trang.
- Không thêm ảnh thumbnail cho job (đã xác nhận API không có field ảnh, ngoài phạm vi từ TASK-008).

## Dependencies

TASK-016 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- E2E thật: Projects hiển thị dạng card grid đúng dữ liệu thật, filter/pagination không đổi hành vi; AdminDesigns filter pill hoạt động đúng như select cũ, Owner ID rút gọn nhưng vẫn đúng dữ liệu (kiểm tra qua title/tooltip nếu cần).

## Testing

- `npm run build` PASS.
- E2E thật qua Docker + browser, dữ liệu thật:
  - Projects: card grid hiển thị đúng icon theo loại phòng (kể cả dữ liệu thiếu dấu "Phong khach" vẫn match đúng nhờ bỏ dấu trước khi so khớp), status pill, thời gian; link mỗi card trỏ đúng `/designs/:jobId` (xác nhận qua `find` — href đúng).
  - AdminDesigns: pill filter thay `<select>` — bấm "Lỗi" trả về đúng danh sách rỗng (không có job FAILED trong data thật), bấm "Hoàn thành" trả đúng 15 job COMPLETED; Owner ID rút gọn 8 ký tự + "…", giữ `title` đầy đủ.
  - Console sạch lỗi.

## Status

COMPLETED
