# TASK-134

## Title

Đổi tên nhanh ngay trên trang kết quả (Quick Rename Editor Header)

## Goal

2 ý tưởng từ ChatGPT round 17 (round hỏi ý tưởng lần 17). Đã vét trước 4 ý tưởng khác cùng batch — loại cả 4 TRƯỚC KHI giao việc:
- "Undo/Redo Toast" (hiện thông báo ngắn sau Undo/Redo) — premise yếu: đọc code xác nhận `Room3DViewer.jsx` ĐÃ có dòng text thường trực `Thao tác gần nhất: {label}` cạnh nút Hoàn tác/Làm lại (không chỉ sau Undo/Redo mà sau MỌI thao tác đổi state) — phạm vi rộng hơn, giá trị cao hơn ý tưởng "toast" hẹp hơn đề xuất. Không làm thêm.
- "Double-click Furniture → Focus" — SAI hoàn toàn: đọc code xác nhận double-click đã được gán cho hành vi "xoay 90°" từ TASK-034/075, là phím tắt đã công bố trong bảng "❓ Phím tắt" — gán lại double-click cho Focus sẽ phá vỡ phím tắt hiện có.
- "Đã lưu Indicator" cho khu vực editor — premise không khớp kiến trúc: `Room3DViewer.jsx` CỐ TÌNH không persist kéo-thả/xoay/màu (quyết định kiến trúc từ TASK-028, xác nhận lại nhiều lần) — không có autosave nào để báo trạng thái "Đã lưu/Đang lưu" cho các thay đổi đó. Dự án ĐÃ có `DraftIndicator.jsx`/`useDraftAutosave.js` riêng cho NGỮ CẢNH KHÁC (nháp form tạo phòng, TASK-095) — áp dụng lại khái niệm này cho editor 3D không có gì để "báo lưu".
- "Back to Projects có cảnh báo nhẹ" — premise không khớp: `DesignResult.jsx` không có nút "Quay lại Projects" riêng trong trang (user rời trang qua link "Dự án của tôi" ở `NavBar.jsx`, dùng chung cho mọi trang) — chặn đúng 1 nút cụ thể như mô tả không khả thi ở quy mô "1-2 file"; làm đúng cần navigation guard cấp router, lớn hơn nhiều so với ước lượng ban đầu.

- **Quick Rename ngay trong Editor Header**: `DesignResult.jsx` hiện chỉ có tiêu đề tĩnh "Kết quả thiết kế" (`<h2>`), KHÔNG hiện `customName` (TASK-106, đã có backend `renameJob`) ở đâu trên trang này — muốn đổi tên phải quay lại `Projects.jsx` mới có ô đổi tên. Cho phép đổi tên ngay tại chỗ, đúng như ChatGPT đề xuất (khác "Design Naming Assistant" TASK-106 — đó là đường tắt thao tác, không sinh tên tự động).

## Scope

- `frontend/src/pages/DesignResult.jsx`:
  - Đọc lại `Projects.jsx` lấy mẫu pattern đổi tên inline đã có (state `editingName`/hàm lưu qua `designApi.renameJob(jobId, customName)`) TRƯỚC khi viết.
  - Thay tiêu đề tĩnh `<h2>Kết quả thiết kế</h2>` bằng khối hiện `job.customName` (hoặc tên gợi ý mặc định nếu chưa đặt, giữ đúng logic hiển thị tên đã có ở `Projects.jsx`) + click để sửa inline (input + Enter lưu/Esc huỷ, đúng UX pattern `Projects.jsx`), gọi `designApi.renameJob`.
  - Đồng bộ lại state `job` sau khi lưu thành công (không cần load lại cả trang).

## Out of scope

- Không đổi backend/API (đã có sẵn từ TASK-106).
- Không đổi cách đổi tên ở `Projects.jsx` (giữ nguyên, chỉ thêm 1 điểm truy cập mới ở `DesignResult.jsx`).
- 4 ý tưởng đã loại ở mục Goal.

## Dependencies

TASK-106 (`customName`/`renameJob` gốc, pattern đổi tên inline ở `Projects.jsx`).

## Affected Services

Frontend only (`DesignResult.jsx`), không đụng `Room3DViewer.jsx`.

## Acceptance Criteria

- `npm run build` PASS.
- Click tiêu đề trên trang kết quả → chuyển thành ô nhập, gõ tên mới, Enter → lưu thành công, tiêu đề cập nhật ngay không cần tải lại trang.
- Esc hoặc để trống → huỷ/xoá đúng theo hành vi `renameJob` đã có (rỗng → xoá tên riêng, quay về tên gợi ý).
- Tải lại trang → tên mới vẫn còn (persist qua backend).
- Không hồi quy: đổi tên ở `Projects.jsx` vẫn hoạt động độc lập.
- Console sạch lỗi.

## Testing

Agent tự viết + tự verify (không đụng `Room3DViewer.jsx`, hợp lệ giao agent). Coordinator gộp rebuild Docker + Playwright TASK-098 regression + verify E2E qua Claude in Chrome sau khi agent xong.

## Coordinator verification

- Agent tự verify chi tiết (xem báo cáo bàn giao): build PASS, live E2E qua Claude in Chrome đầy đủ (Enter lưu, Esc huỷ, xoá trắng → về tên gợi ý, persist qua reload), regression `Projects.jsx` không đổi. Lưu ý fallback tên: `DesignJobResponse` (trang này dùng) không có field `suggestedName` như `DesignJobSummaryResponse` (Projects.jsx dùng) — agent tự phát hiện, dùng `room?.roomType` sẵn có trên trang thay thế (đúng nguồn dữ liệu `suggestedName` vốn cũng suy ra từ), không tạo API mới ngoài scope.
- Coordinator đọc lại diff: `editingName`/`renameJob`/`design-name-input` đúng cách agent mô tả. Ghi nhận `.design-name-input` không có rule CSS riêng trong `styles.css` — kiểm tra xác nhận đây là tình trạng CÓ SẴN TỪ TRƯỚC ở chính `Projects.jsx` (component gốc agent copy theo), không phải hồi quy/lỗi mới do task này gây ra — không cần sửa (ngoài scope, giữ nguyên nhất quán với UI đã có).
- Docker rebuild frontend (gộp cùng lượt TASK-133) + Playwright TASK-098 regression: 3/3 PASS.
- Coordinator tự verify lại độc lập trên job đã tạo (TASK-131/133): click tiêu đề → vào chế độ sửa đúng placeholder "Nhập tên riêng, để trống để dùng tên gợi ý"; gõ "Phòng khách kiểu Modern yêu thích" + Enter → tiêu đề cập nhật ngay không tải lại trang; tải lại trang thật (navigate lại) → tên vẫn giữ nguyên, xác nhận persist qua backend thật. Console sạch lỗi.
- Không phát hiện lỗi app mới.

## Status

COMPLETED
