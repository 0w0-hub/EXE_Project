# TASK-079

## Title

Kiểm soát ngân sách "sống" khi chỉnh sửa nội thất trong phiên xem (Live Budget Guard)

## Goal

Tiếp tục vòng lặp tự động nâng cấp dự án (chưa dừng — xem `[[feedback_autonomous_3d_upgrade_loop]]` trong memory). User yêu cầu dùng Claude in Chrome hỏi ChatGPT ý tưởng nâng cấp rồi tự động thực hiện, làm đến khi user báo dừng. Đã hỏi ChatGPT (phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — chọn ý tưởng "Smart Budget" nhưng THU HẸP phạm vi: bỏ phần "AI đề xuất món thay thế cùng phong cách" (không có dữ liệu nhiều mức giá/nhiều biến thể giá cho cùng 1 category — mỗi category tự thêm chỉ có đúng 1 mức giá cố định trong `CUSTOM_FURNITURE_PRESETS`, không có gì để AI "thay thế" mà không bịa dữ liệu giá giả — vi phạm nguyên tắc không bịa dữ liệu đã giữ xuyên suốt dự án). Thay vào đó làm phần LÕI thật sự còn thiếu, đúng vấn đề ChatGPT nêu: "Budget hiện thường chỉ là input lúc tạo thiết kế, không được kiểm soát trong quá trình chỉnh sửa" — xác nhận đúng: `DesignResult.jsx` có thanh ngân sách (TASK-015) nhưng so `preference.budget` với `job.result.estimatedCost` CỐ ĐỊNH (số AI tính lúc tạo), trong khi `Room3DViewer.jsx` cho thêm/xoá/sửa giá nội thất session-only (TASK-027/028/046) có dòng tổng riêng (TASK-067) nhưng KHÔNG so với ngân sách thật — 2 con số không liên thông.

## Scope

- `frontend/src/pages/DesignResult.jsx`: truyền thêm prop `budget={preference?.budget}` vào `<Room3DViewer />` đã có (dòng ~190).
- `frontend/src/components/Room3DViewer.jsx`:
  - Prop mới `budget` (number, có thể `undefined`/0 nếu preference chưa có ngân sách — xử lý optional, không throw).
  - Ngay cạnh dòng tổng "X món · tổng ước tính Y đ" (TASK-067), khi `budget > 0`:
    - Nếu tổng ≤ budget: dòng trạng thái "✅ Trong ngân sách, còn dư Z đ".
    - Nếu tổng > budget: dòng cảnh báo "⚠️ Vượt ngân sách Z đ" (style khác biệt rõ, có thể tái dùng class `.is-over`/`budget-bar` đã có ở `DesignResult.jsx` hoặc thêm class mới `room3d-budget-*` nếu không hợp style — đọc `styles.css` trước để tái dùng đúng token màu, KHÔNG tạo màu mới ngoài bảng "Peacock Feather"), kèm gợi ý THẬT (không bịa): tìm món ĐẮT NHẤT hiện có trong `localFurniture` — nếu xoá riêng món đó đưa tổng về ≤ budget → hiện "💡 Xoá '[tên món]' (giá thật của món đó) để về đúng ngân sách" + nút bấm gọi thẳng `removeFurniture(index)` đã có sẵn (không viết lại logic xoá); nếu xoá 1 món chưa đủ → tính bằng thuật toán tham lam (sắp giá giảm dần, cộng dồn số món cần xoá tới khi đủ) rồi hiện "💡 Cần bớt khoảng N món giá trị cao nhất để về đúng ngân sách" (không liệt kê tên cả N món nếu N lớn, tránh rối — chỉ nêu số lượng).
  - Cập nhật ngay khi `localFurniture`/`itemColorOverrides` v.v. đổi (đã là state React, tự re-render — không cần thêm effect).

## Out of scope

- Không đề xuất "món thay thế cùng phong cách rẻ hơn" (không có dữ liệu giá nhiều mức — xem lý do ở Goal).
- Không đồng bộ ngược lại biểu đồ phân bổ ngân sách AI gốc ở `DesignResult.jsx` (TASK-026) — biểu đồ đó CỐ TÌNH không đổi theo chỉnh sửa tạm thời (nguyên tắc đã chốt từ TASK-028), chỉ mục mới này ở `Room3DViewer` mới phản ánh phiên đang xem.
- Không sửa `Projects.jsx`, `App.jsx`, backend (đang có agent khác làm song song trong cùng đợt — tránh xung đột).

## Dependencies

TASK-011 (preference thật), TASK-015 (budget bar gốc), TASK-026 (biểu đồ phân bổ), TASK-046 (sửa giá món tự thêm), TASK-067 (dòng tổng số món/chi phí).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Phòng có `preference.budget` thật, tổng nội thất hiện tại ≤ budget → hiện đúng dòng "Trong ngân sách, còn dư ...".
- Thêm nội thất tới khi tổng > budget → dòng cảnh báo hiện đúng số tiền vượt (khớp phép trừ tay).
- Nếu xoá 1 món đắt nhất đủ về trong ngân sách → nút gợi ý hiện đúng tên + giá món đó, bấm vào xoá đúng món, dòng cảnh báo biến mất/đổi thành "Trong ngân sách".
- Phòng không có `preference.budget` (0/null) → không hiện khối này (không lỗi, không hiện "vượt 0 đ" vô nghĩa).
- Không hồi quy dòng tổng "X món · Y đ" gốc (TASK-067), không hồi quy các chức năng khác của `Room3DViewer`.
- Console sạch lỗi.

## Testing

Tự thực hiện (không qua agent riêng) — do đây là phần mở rộng trực tiếp của `Room3DViewer.jsx`, file đã có ngữ cảnh đầy đủ từ 79 task trước, giữ lại cho 1 người/1 luồng làm để tránh xung đột với 2 agent song song đang làm TASK-077/078. Verify: `npm run build` PASS; sau khi 2 agent song song xong, rebuild Docker + verify E2E qua Claude in Chrome CÙNG ĐỢT với TASK-077/078 (dùng chung 1 lần rebuild Docker + 1 phiên browser, tránh rebuild lặp lại 3 lần).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker (`docker compose up -d --build`, gộp chung với TASK-077/078) + verify E2E qua Claude in Chrome — tạo phòng/preference (`budget=10.000.000`)/job mới qua API (`task077-tester@example.com`):
- Trạng thái ban đầu (4 món AI gốc, 8.000.000đ) → hiện đúng "✅ Trong ngân sách, còn dư 2.000.000 đ".
- Thêm "+ Laptop" (15.000.000đ) → tổng 23.000.000đ, hiện đúng "⚠️ Vượt ngân sách 13.000.000 đ" + nút gợi ý "💡 Xoá "Laptop (mới thêm)" (15.000.000 đ) để về đúng ngân sách" (đúng vì laptop là món đắt nhất và tự nó đủ để về trong ngân sách).
- Bấm nút gợi ý → xoá đúng đúng món Laptop, quay lại đúng "✅ Trong ngân sách, còn dư 2.000.000 đ"; nút "↺ Hoàn tác xoá..." (TASK-053) cũng ăn khớp đúng theo xoá vừa xảy ra (không hồi quy).
- Console sạch lỗi xuyên suốt.
- Không phát hiện lỗi mới nào (khác TASK-077/078 vốn có 1 lỗi UI nhỏ mỗi task được phát hiện lúc verify).
