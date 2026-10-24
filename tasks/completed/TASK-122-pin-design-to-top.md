# TASK-122

## Title

Ghim thiết kế lên đầu danh sách "Dự án của tôi"

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 20 — hỏi lại ChatGPT lần 13 tại phiên `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`, được 6 ý tưởng: Duplicate Design, Pin Room/Design lên đầu, Quick Notes cho Design, Furniture Context Menu, Image Lightbox cho ảnh phòng, Collapsible Panels trong Editor. Trước khi giao việc, tự kiểm tra code:

- "Duplicate Design" — TRÙNG 100% với tính năng đã có từ TASK-093 (`DesignResult.jsx` đã có nút "⧉ Nhân bản để thử nghiệm" gọi `DesignService.duplicateJob`, đã grep xác nhận). Loại.
- "Furniture Context Menu" (right-click) và "Collapsible Panels trong Editor" — CẢ HAI đụng `Room3DViewer.jsx`/khu vực editor (chính ChatGPT cũng lưu ý "cùng khu vực editor nên không nên giao 2 agent sửa cùng lúc"). Để dành round sau, round này ưu tiên 3 ý tưởng không đụng `Room3DViewer.jsx` để giao song song an toàn, không cần coordinator tự làm riêng phần nào.

Chọn "Pin Room/Design lên đầu" — vấn đề thật: `Projects.jsx` đã có "Yêu thích" (TASK-103, lọc) + sắp xếp theo ngày/loại phòng (TASK-106), nhưng KHÔNG có cách ưu tiên hiển thị 1-2 thiết kế cụ thể lên đầu danh sách bất kể đang lọc/sắp xếp thế nào (khác "Yêu thích" — yêu thích là gắn nhãn lâu dài, ghim là ưu tiên vị trí hiển thị tạm thời trong phiên làm việc hiện tại).

## Scope

- `frontend/src/pages/Projects.jsx`: thêm state `pinnedIds` (`Set<string>` các `jobId`, đọc/ghi `localStorage` key mới `homely_pinned_designs` — THUẦN CLIENT-SIDE, không cần backend/migration, đúng đề xuất gốc "có thể localStorage nếu chưa muốn đổi DB").
- Thêm 1 nút nhỏ trên mỗi item (cả 2 chế độ `.room-grid` VÀ `.room-list` từ TASK-119 — sửa cả 2 khối JSX) để ghim/bỏ ghim (vd icon "📌"/"📍", đổi trạng thái rõ ràng khi đã ghim).
- Khi render `filteredItems`: các item có `jobId` nằm trong `pinnedIds` LUÔN hiện lên đầu (sort ổn định — trong nhóm ghim giữ nguyên thứ tự tương đối theo sort hiện tại, trong nhóm không ghim cũng vậy) — áp dụng SAU khi đã filter/sort theo tiêu chí hiện có (không thay thế logic sort cũ, chỉ thêm 1 bước sắp xếp lại theo pin lên trên cùng).
- Item bị filter ra (không khớp tab trạng thái/tìm kiếm/yêu thích) thì KHÔNG hiện dù đã ghim — ghim chỉ ảnh hưởng THỨ TỰ, không phải là 1 filter riêng.

## Out of scope

- Không đổi backend/DB — hoàn toàn client-side (khác với "Yêu thích" TASK-103 vốn lưu server).
- Không đồng bộ trạng thái ghim giữa nhiều thiết bị/trình duyệt (đúng bản chất `localStorage`, đã nêu rõ trong đề xuất gốc).
- Không đụng `Dashboard.jsx`/`Room3DViewer.jsx`.

## Dependencies

TASK-017 (card grid gốc), TASK-103 (yêu thích — khác khái niệm), TASK-106 (sắp xếp), TASK-119 (chế độ list — cần sửa cả 2 chế độ hiển thị).

## Affected Services

Frontend only (`Projects.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Ghim 1 thiết kế đang ở giữa danh sách → thiết kế đó nhảy lên đầu ngay (cả chế độ Lưới lẫn Danh sách).
- Bỏ ghim → về lại đúng vị trí theo sort hiện tại (không còn ưu tiên).
- Đổi filter/sort trong khi đã ghim → thiết kế ghim vẫn giữ đúng ở đầu (trong số các item còn khớp filter).
- Tải lại trang → giữ đúng trạng thái ghim đã chọn trước đó.
- Không hồi quy: filter tab trạng thái/tìm kiếm/yêu thích/sort/đổi tên/xoá/so sánh vẫn hoạt động đúng như cũ.
- Console sạch lỗi.

## Testing

Agent tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (khuyến khích). Không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này.

## Coordinator verification

- Agent báo cáo: chỉ sửa đúng `Projects.jsx`, không đụng logic filter/sort/search/favorite/rename/xoá cũ, `npm run build` PASS.
- Coordinator: build lại toàn bộ (gộp cùng TASK-123) PASS, Docker rebuild backend+frontend, Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: nút "📌 Ghi lên đầu danh sách" hiển thị đúng ở cả 2 chế độ Lưới/Danh sách, bấm ghim → đổi đúng thành "📍" (`aria-pressed="true"`) + ghi đúng vào `localStorage` (`homely_pinned_designs`); tải lại trang → giữ đúng trạng thái ghim.
- Console sạch lỗi.

## Status

COMPLETED
