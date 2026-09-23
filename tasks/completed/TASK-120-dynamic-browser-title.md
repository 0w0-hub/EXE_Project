# TASK-120

## Title

Tiêu đề tab trình duyệt động theo trang đang xem

## Goal

Round 19 (cùng batch ChatGPT với TASK-119 — xem Goal ở đó để biết đầy đủ 6 ý tưởng + lý do loại 3/6). Chọn "Dynamic Browser Title": vấn đề thật — `index.html` chỉ có 1 `<title>Homely — AI Room Design</title>` TĨNH (đã grep xác nhận không có bất kỳ chỗ nào set `document.title` động trong toàn bộ `frontend/src`), nên mọi tab/trang đều hiện cùng 1 tiêu đề — bất tiện khi user mở nhiều tab (vd nhiều thiết kế khác nhau) và phải đoán tab nào là tab nào qua favicon giống hệt nhau.

## Scope

- `frontend/src/hooks/useDocumentTitle.js` (mới) — hook nhỏ dùng chung, nhận 1 chuỗi, tự set `document.title = "${title} — Homely"` khi mount/khi `title` đổi, tự khôi phục lại tiêu đề mặc định khi unmount (tránh "rò rỉ" tiêu đề cũ sang trang khác nếu điều hướng nhanh) — cùng độ đơn giản với `useEscapeKey.js` (TASK-090) đã có.
- Áp dụng hook vào các trang có tên/nội dung đủ ý nghĩa để làm tiêu đề:
  - `DesignResult.jsx`: tiêu đề theo loại phòng + phong cách thiết kế đang xem (dữ liệu đã có sẵn trong `job`/`decorPlan`, không gọi thêm API) — vd "Phòng khách · Hiện đại — Homely".
  - `RoomNew.jsx`: tiêu đề tĩnh "Tạo phòng mới — Homely".
  - `Projects.jsx`: tiêu đề tĩnh "Dự án của tôi — Homely".
  - `Templates.jsx`: tiêu đề tĩnh "Mẫu thiết kế — Homely".
  - `Dashboard.jsx`: tiêu đề tĩnh "Trang chủ — Homely".

## Out of scope

- Không áp dụng cho các trang admin/account (ít mở nhiều tab cùng lúc hơn, giá trị thấp hơn — có thể mở rộng sau nếu cần).
- Không đổi `index.html` (giữ nguyên làm tiêu đề mặc định/fallback trước khi React mount).
- Không đụng `Room3DViewer.jsx`.

## Dependencies

Không phụ thuộc task nào — độc lập hoàn toàn với TASK-119 (khác file, chỉ cùng batch ChatGPT).

## Affected Services

Frontend only (hook mới + import vào 5 trang hiện có).

## Acceptance Criteria

- `npm run build` PASS.
- Mở `/projects` → tab hiện "Dự án của tôi — Homely"; mở 1 thiết kế → tab hiện đúng loại phòng + phong cách của thiết kế đó (khác thiết kế khác → tiêu đề khác).
- Điều hướng qua lại nhiều trang trong 1 tab → tiêu đề luôn cập nhật đúng theo trang hiện tại, không bị "kẹt" tiêu đề trang trước.
- Không hồi quy bất kỳ chức năng nào khác của 5 trang trên.
- Console sạch lỗi.

## Testing

Agent tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (khuyến khích — kiểm tra `document.title` qua `javascript_tool` ở từng trang). Không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này.

## Coordinator verification

- Agent báo cáo: tạo `useDocumentTitle.js` + áp dụng đúng 5 trang, `npm run build` PASS.
- Coordinator: build lại toàn bộ (gộp cùng TASK-119/121) PASS, Docker rebuild frontend, Playwright TASK-098 (3/3 PASS).
- Verify E2E qua Claude-in-Chrome: `/projects` → tab hiện đúng "Dự án của tôi — Homely"; mở 1 thiết kế (`/designs/{jobId}/{slug}`) → tab hiện đúng "Phòng khách — Homely" (tiêu đề đổi đúng theo dữ liệu thật của job, khác tiêu đề trang trước).
- Console sạch lỗi.

## Status

COMPLETED
