# TASK-113

## Title

Trạng thái rỗng có hướng dẫn hành động + Thử lại khi lỗi API (Empty States + API Error Retry)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 15 — gộp 2 ý tưởng ChatGPT đề xuất mới (hỏi lại lần 9 ngày 2026-09-17 tại `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) thành 1 task vì cả 2 CÙNG cần sửa `Projects.jsx` (đã đọc code xác nhận trước khi giao việc). Vấn đề thật:
1. **Empty States**: `Projects.jsx` khi filter/tìm kiếm không khớp kết quả nào chỉ hiện `<p>Chưa có thiết kế nào ở trạng thái này.</p>` — text thuần, không có hành động gợi ý tiếp theo (ví dụ xoá bộ lọc, tạo phòng mới).
2. **API Error Retry**: `Projects.jsx`/`Dashboard.jsx` khi gọi API lỗi chỉ hiện `<p className="error-text">{error}</p>` — text thuần, KHÔNG có nút thử lại, user phải tự tải lại cả trang.

## Scope

### Phần 1 — Empty States có CTA

- `frontend/src/pages/Projects.jsx`: đọc kỹ 2 nhánh empty state hiện có (đọc lại code THẬT trước khi sửa vì có thể đã đổi):
  - Chưa có thiết kế nào (tài khoản mới, chưa từng generate) → thêm nút "+ Tạo phòng mới" điều hướng `/rooms/new` (nếu đã có nhánh riêng cho case này, chỉ cần thêm nút; nếu chưa có, phân biệt rõ với case "có dữ liệu nhưng filter/search không khớp").
  - Có dữ liệu nhưng filter trạng thái/tìm kiếm/"chỉ yêu thích" không khớp kết quả nào → thêm nút "Xoá bộ lọc" (reset `status`/`search`/`favoriteOnly` về mặc định) — PHÂN BIỆT RÕ với case "chưa có thiết kế nào" (thông điệp + hành động phải khác nhau, không dùng chung 1 câu chung chung).
- `frontend/src/pages/Trash.jsx` (TASK-107): nếu thùng rác trống, hiện thêm gợi ý điều hướng về `/projects` (thay vì chỉ text "Thùng rác trống.").

### Phần 2 — API Error Retry

- Component tái dùng mới `frontend/src/components/RequestError.jsx` — nhận `message` + `onRetry` (callback), hiện đúng message + nút "🔄 Thử lại" gọi lại `onRetry`. Style dùng lại đúng class `.error-text`/`.card` đã có trong `styles.css`, không tạo màu/token mới.
- Áp dụng `RequestError` thay thế khối `{error && <p className="error-text">{error}</p>}` hiện có ở ĐÚNG 2 nơi:
  - `frontend/src/pages/Projects.jsx` — `onRetry` gọi lại chính xác hàm fetch danh sách hiện có (đọc kỹ code để tái dùng đúng hàm, không viết lại logic fetch mới).
  - `frontend/src/pages/Dashboard.jsx` — tương tự, `onRetry` gọi lại đúng hàm fetch phòng hiện có.
- KHÔNG áp dụng cho toàn bộ các trang khác trong dự án (phạm vi hợp lý cho 1 task, đủ để chứng minh pattern hoạt động — các trang khác có thể áp dụng sau nếu cần, không thuộc phạm vi task này).

## Out of scope

- Không đổi endpoint backend nào.
- Không tự động retry (chỉ nút bấm thủ công theo đúng ý tưởng gốc "retry thủ công khi phù hợp").
- Không áp dụng `RequestError`/empty state mới cho `DesignResult.jsx` polling (luồng đó ĐÃ hoàn chỉnh — có xử lý PENDING/PROCESSING/FAILED riêng, không đụng vào theo đúng khuyến cáo tránh trùng lặp).
- Không đổi `Room3DViewer.jsx`.

## Dependencies

TASK-080 (tìm kiếm Projects), TASK-103 (filter yêu thích), TASK-107 (Trash.jsx).

## Affected Services

Frontend only (`Projects.jsx`, `Dashboard.jsx`, `Trash.jsx`, 1 component mới `RequestError.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Tài khoản có dữ liệu, lọc/tìm kiếm ra kết quả rỗng → hiện đúng thông điệp + nút "Xoá bộ lọc", bấm vào → về đúng danh sách đầy đủ.
- Giả lập lỗi API thật (ví dụ tắt tạm backend hoặc chặn network trong lúc verify) trên Projects/Dashboard → hiện đúng `RequestError` với nút "🔄 Thử lại"; bấm thử lại sau khi API hoạt động lại → tải đúng dữ liệu thật, không cần tải lại trang.
- Không hồi quy: phân trang, filter trạng thái/yêu thích, tìm kiếm, checkbox so sánh (Projects); stat-tile/danh sách phòng (Dashboard).
- Console sạch lỗi.

## Testing

Tự verify: `npm run build`, verify qua Docker + browser nếu có kết nối Claude-in-Chrome trong phiên của agent (khuyến khích — có thể giả lập lỗi API thật bằng cách chặn 1 request qua DevTools/network throttle hoặc tạm sửa URL sai rồi sửa lại để test retry). Không bắt buộc — coordinator sẽ verify UI thật ở vòng gộp cuối cùng của round này.

## Status

COMPLETED

## Coordinator verification

`npm run build` PASS. Rebuild Docker đầy đủ. Verify E2E qua Claude in Chrome (`task077-tester@example.com`) trên container THẬT vừa rebuild — bật "⭐ Chỉ hiện yêu thích" (0 kết quả khớp) → đúng hiện "Không có thiết kế nào khớp với bộ lọc/tìm kiếm hiện tại..." + nút "Xoá bộ lọc"; bấm vào → đúng về lại trạng thái ban đầu. Giả lập lỗi mạng THẬT (subclass `XMLHttpRequest` chặn đúng request `/designs`, dispatch `Event('error')` thật — không phải giả UI) → `RequestError` hiện đúng "Không thể kết nối tới server" + nút "🔄 Thử lại", dữ liệu cũ vẫn hiện bên dưới (không bị xoá sạch); gỡ chặn + bấm "Thử lại" → tải lại thành công thật, lỗi biến mất, không cần tải lại trang. Console sạch lỗi. Chạy lại bộ Playwright TASK-098 làm regression — 3/3 PASS. Không phát hiện lỗi mới.
