# TASK-147

## Title

Menu ngữ cảnh cho Project (gộp nút hành động) + "Mở nhanh" project vừa truy cập

## Goal

2 ý tưởng từ ChatGPT round 27 (hỏi lần 4 trong cùng phiên chat, vẫn ưu tiên ngoài phạm vi 3D theo yêu cầu chủ động của coordinator). Đã vét trước qua Explore agent, xác nhận 4/6 ý còn lại KHÔNG dùng được — loại TRƯỚC KHI giao việc:

- "Project Empty Search State" — ĐÃ CÓ (gần như đầy đủ): `Projects.jsx` đã phân biệt rõ `noDesignsAtAll` và `noFilterMatch` (dòng ~395-396/470-486), có nút "Xoá bộ lọc" gọi `resetFilters()`. Chỉ khác đúng chữ "Không tìm thấy thiết kế" đề xuất (chữ thật hiện là câu dài hơn) — không đủ khác biệt để làm task riêng, loại.
- "Create Design Step Indicator" (bản đề xuất: wizard nhiều trang cho form tạo phòng) — `RoomNew.jsx` ĐÃ CÓ 1 step indicator (`STEP_ORDER`/`STEP_TITLES`, dòng ~213-252) nhưng dùng để hiện TIẾN TRÌNH GỌI API SAU KHI submit (tạo phòng→tải ảnh→lưu preference→generate), không phải điều hướng nhiều trang TRƯỚC khi submit như đề xuất. Biến toàn bộ form 1 trang thành wizard nhiều bước là thay đổi kiến trúc lớn hơn nhiều so với 1 round bình thường — để dành backlog.
- "Project Card Metadata Badges" — PHẦN LỚN ĐÃ CÓ/KHÔNG KHẢ THI: "trạng thái" đã hiện qua status pill (`status-${job.status}`); "số thiết kế" theo Project KHÔNG khả thi mà không bịa dữ liệu — `DesignJobSummaryResponse` không có field đếm, và thực tế mỗi Project hiện là 1 DesignJob (1:1 với Room), endpoint `listJobsForRoom` chỉ dùng nội bộ cho Admin Data Explorer, chưa expose cho user; chỉ còn đúng "ngày cập nhật" (`updatedAt`) là gap thật (card hiện chỉ hiện `createdAt`, `updatedAt` chỉ có trong popup hover TASK-144) — quá nhỏ để làm task riêng, loại (có thể gộp vào task khác sau nếu cần).
- "Create Design Draft Recovery" — ĐÃ CÓ ĐẦY ĐỦ 100%: `RoomNew.jsx` (dòng ~118-139/229-237) đã có banner "Bạn có bản nháp chưa hoàn thành từ lần trước." + 2 nút "Khôi phục"/"Bỏ qua" — đúng y hệt UX đề xuất, không phải khôi phục âm thầm như ChatGPT tưởng.

2 ý còn lại — dùng ngay, đều đụng `Projects.jsx`, gộp 1 task:

- **Project Context Menu**: gộp các nút hành động sẵn có (Mở/Đổi tên/Sao chép/Ẩn-Pin/Xoá) của mỗi project thành 1 menu ngữ cảnh gọn ("⋮"), thay vì luôn hiện hết các icon riêng lẻ như hiện tại (Projects.jsx dòng ~508-571 grid, ~657-731 list) — cải thiện UX, tận dụng action đã có, KHÔNG thêm hành vi mới.
- **Recent Projects Shortcut**: hàng "Mở nhanh" trên đầu trang Projects, lưu vài project VỪA TRUY CẬP (click mở) gần nhất qua `localStorage` — khác hẳn `RecentDesigns` (server-data, "vừa SỬA" trên Dashboard).

## Scope

- `frontend/src/pages/Projects.jsx`:
  - **Project Context Menu**: menu dropdown nhỏ (đúng pattern `room3d-dropdown` đã dùng ở `Room3DViewer.jsx`, hoặc pattern dropdown có sẵn khác trong `NavBar.jsx`/`AccountMenu`) gộp các action đã có (Mở = click card như cũ, Đổi tên, Sao chép nếu có, Ghim/Bỏ ghim, Yêu thích, Xoá mềm) — GIỮ NGUYÊN logic từng hành động, chỉ đổi cách trình bày UI. Không đổi hành vi Click chính (mở project) và không đổi hành vi checkbox "Chọn để so sánh" (giữ tách riêng, không gộp vào menu).
  - **Recent Projects Shortcut**: `localStorage` key mới (vd `homely_recent_projects`), ghi lại jobId khi user click mở 1 project (tối đa ~5, mới nhất lên đầu, bỏ trùng — đúng pattern `homely_recent_furniture` TASK-130). Hàng "🕘 Mở nhanh" ở đầu trang Projects (dưới tiêu đề, trên bộ lọc), chỉ hiện khi có ít nhất 1 mục, mỗi mục click mở thẳng project đó.

## Out of scope

- 4 ý đã loại/backlog ở mục Goal.
- Không đổi logic backend/API.
- Không gộp checkbox "Chọn để so sánh" (TASK-077) vào menu ngữ cảnh.

## Dependencies

`Projects.jsx` (toàn bộ action button hiện có từ TASK-017/077/080/106/122), pattern dropdown có sẵn (`room3d-dropdown` trong `Room3DViewer.jsx`, hoặc `AccountMenu` trong `NavBar.jsx`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Menu ngữ cảnh: bấm "⋮" trên 1 project → menu hiện đủ action cũ, mỗi action hoạt động ĐÚNG như trước (không hồi quy) — kiểm tra ít nhất Đổi tên + Ghim + Xoá mềm qua thao tác thật.
- Click card (ngoài menu) vẫn mở project như cũ.
- Mở 1 project → quay lại trang Projects → project đó xuất hiện trong "🕘 Mở nhanh"; click mục trong "Mở nhanh" → mở đúng project.
- Chưa từng mở project nào (localStorage trống) → không hiện hàng "Mở nhanh" (không có khung trống vô nghĩa).
- Không hồi quy: filter/sort/search/Compare checkbox/Favorite/Pin đã có.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`, cả 2 ý cùng file nên KHÔNG chia 2 agent song song để tránh xung đột — 1 agent làm cả 2 tuần tự). Coordinator rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

Dispatch cho 1 agent duy nhất (cả 2 ý cùng đụng `Projects.jsx`, không chia song song để tránh xung đột). Agent gộp icon pin/yêu thích/đổi tên/xoá mềm vào menu "⋮" đúng pattern `.room3d-dropdown`, tái dùng nguyên logic cũ. Recent Shortcut: `localStorage` key `homely_recent_projects`, đúng pattern `homely_recent_furniture` TASK-130. `npm run build` PASS.

**Tự phát hiện + sửa 1 lỗi thật lúc verify (không phải lúc code)**: bấm mở 1 project thật (click thật qua UI, không phải dispatch sự kiện tổng hợp) → `localStorage` KHÔNG được ghi, hàng "🕘 Mở nhanh" không bao giờ xuất hiện dù đã mở project nhiều lần. Xác nhận không phải lỗi công cụ verify: build lại vẫn tái lập y hệt, đọc code xác định đúng root cause — `recordRecentProject` đặt side effect `window.localStorage.setItem(...)` BÊN TRONG updater callback của `setRecentProjectIds((prev) => {...})`. Click vào `<Link>` đồng thời kích hoạt điều hướng React Router — nếu component `Projects` unmount TRƯỚC KHI React xử lý updater ở lượt render kế tiếp, React có thể bỏ qua không gọi updater đó nữa (không có ý nghĩa tính state mới cho component sắp gỡ bỏ) — side effect bên trong vì vậy không bao giờ chạy. Đây là lỗi tinh vi, thuộc loại "side effect trong setState updater không an toàn khi component có thể unmount ngay sau đó" — không lộ ra khi agent tự test bằng `npm run build` (không phát hiện được qua build, chỉ lộ ra khi bấm thật rồi điều hướng thật). Sửa bằng cách tính `next` và ghi `localStorage` NGAY, ĐỒNG BỘ, TRƯỚC/NGOÀI lời gọi `setState` (đọc trực tiếp state `recentProjectIds` hiện tại thay vì qua updater) — đảm bảo side effect luôn chạy bất kể component có unmount ngay sau đó hay không.

`npm run build` PASS lại sau sửa. Docker rebuild frontend (2 lần — trước/sau sửa lỗi) + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: menu "⋮" mở đúng đủ 4 action, Ghim/Bỏ ghim xác nhận qua đọc lại menu (text đổi đúng "📌 Ghim..."↔"📍 Bỏ ghim..."), menu tự đóng sau khi bấm action. Recent Shortcut SAU KHI SỬA: xoá `localStorage` → bấm mở project qua click THẬT (không phải dispatch sự kiện tổng hợp — phát hiện dispatch tổng hợp/`.click()` qua JS KHÔNG kích hoạt được bug này để lộ ra, chỉ real click qua `computer` tool mới tái lập đúng luồng thật) → xác nhận `localStorage` ghi đúng jobId → quay lại Projects → hàng "🕘 Mở nhanh" hiện đúng, href đúng. Console sạch lỗi.

## Status

COMPLETED
