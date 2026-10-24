# TASK-069

## Title

Phím tắt "/" focus nhanh ô tìm kiếm loại đồ

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). TASK-065 đã thêm ô tìm kiếm lọc 32+ nút "+ thêm loại đồ" nhưng ghi rõ "Out of scope: chưa thêm phím tắt '/' để focus nhanh — có thể cân nhắc ở round sau nếu cần". Áp dụng đúng quy ước phổ biến ở các web app khác (GitHub, Slack) để bổ sung.

## Scope

- `Room3DViewer.jsx`: thêm `furnitureSearchInputRef` (gắn vào `<input>` tìm kiếm từ TASK-065).
- Thêm 1 `useEffect` riêng (tách khỏi effect dựng scene 3D chính) lắng nghe `keydown` toàn trang: khi phím `/` được nhấn, tab đang là `'3d'`, và KHÔNG đang gõ trong ô input/textarea/contenteditable khác → `preventDefault()` + focus ô tìm kiếm. Cùng tinh thần thận trọng với các phím tắt trước đó (TASK-040 gate theo `pointerOverCanvas`) — tránh chặn nhầm dấu "/" hợp lệ khi user đang gõ ở nơi khác (vd ô sửa giá TASK-046).
- Cập nhật placeholder ô tìm kiếm thêm gợi ý "(phím / để focus nhanh)".

## Out of scope

- Không thêm phím "Esc" để bỏ focus/xoá ô tìm kiếm (có thể cân nhắc round sau).
- Không áp dụng phím tắt này ở tab khác ngoài "3d" (ô tìm kiếm chỉ hiển thị ở tab 3D).

## Dependencies

TASK-065 (ô tìm kiếm gốc), TASK-040 (tiền lệ gate phím tắt theo ngữ cảnh để tránh xung đột).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nhấn `/` khi KHÔNG đang gõ ở đâu → ô tìm kiếm được focus ngay.
- Nhấn `/` trong lúc đang gõ ở 1 ô input khác (vd ô sửa giá) → không bị cướp focus, dấu "/" xử lý bình thường theo input đó.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round):
- Click ra ngoài mọi input (activeElement = `BODY`) → nhấn `/` → JS xác nhận `document.activeElement === ô tìm kiếm` (`true`); gõ tiếp "ban" → xác nhận đúng các nút lọc còn "Bàn"/"Bàn làm việc"/"Máy tính bàn"/"Máy nướng bánh mì".
- Focus vào ô sửa giá của 1 món tự thêm ("Bàn (mới thêm)") → nhấn `/` → JS xác nhận ô sửa giá VẪN giữ focus, ô tìm kiếm KHÔNG được focus (gate hoạt động đúng).
- "Đặt lại bố trí" → khôi phục đúng 4 món AI gốc.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
