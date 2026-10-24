# TASK-144

## Title

Xem trước nhanh 1 Project (Quick Preview) trong `Projects.jsx`

## Goal

Ý tưởng từ ChatGPT round 26 (hỏi lần 3 trong cùng phiên chat, sau khi báo TASK-143 xong, chủ động yêu cầu ChatGPT mở rộng ra NGOÀI phạm vi 3D vì mảng đó đã khai thác sâu qua nhiều round). Đã vét trước qua Explore agent, xác nhận CHƯA CÓ: mỗi card/row trong `pages/Projects.jsx` hiện là `<Link>` bấm là điều hướng thẳng sang trang đầy đủ `/designs/{jobId}` — không có bất kỳ preview/popup nào trước khi rời trang.

- **Xem trước nhanh**: hover hoặc bấm (giữ) 1 project trong danh sách (cả 2 chế độ grid/list, `Projects.jsx`) hiện 1 popup nhỏ với ảnh phòng + tên + ngày cập nhật + SỐ LƯỢNG design/version liên quan (nếu có dữ liệu thật) — KHÔNG cần mở trang đầy đủ.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Thêm state `previewJobId` (hoặc tương tự) — job đang được xem trước.
  - Popup nhỏ (tooltip/card nổi, định vị gần phần tử được hover/bấm) hiện: ảnh phòng (dùng đúng nguồn ảnh card đã có), tên design (`customName`/fallback), ngày cập nhật (`updatedAt`), và card/row hiện tại đang preview loại nào.
  - **KHÔNG bịa dữ liệu**: "số lượng design" CHỈ hiện nếu có dữ liệu thật sẵn có trong response API hiện tại (kiểm tra kỹ trước khi thêm field UI — nếu API không trả về, bỏ hẳn phần này, không mock).
  - Click vẫn điều hướng đến trang đầy đủ như cũ (không đổi hành vi click chính) — preview CHỈ là lớp bổ sung khi hover, không thay thế click.
  - Đóng popup khi rời chuột/click ra ngoài/nhấn Esc (đúng pattern `useEscapeKey` đã có).

## Out of scope

- Không đổi API/backend — thuần frontend dùng dữ liệu đã fetch sẵn.
- Không đổi hành vi click chính (vẫn điều hướng trang đầy đủ).
- Không áp dụng cho `Trash.jsx`/trang khác — chỉ `Projects.jsx`.

## Dependencies

`pages/Projects.jsx` (card/list rendering có sẵn từ TASK-017/080), `useEscapeKey` hook có sẵn (TASK-090/124).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Hover/bấm giữ 1 project (cả grid lẫn list mode) → popup preview hiện đúng ảnh/tên/ngày, KHÔNG điều hướng trang.
- Click bình thường vào project → vẫn điều hướng đúng trang đầy đủ như cũ (không hồi quy).
- Rời chuột/Esc/click ra ngoài → popup đóng đúng.
- Không hồi quy: filter/sort/search/Compare checkbox/xoá mềm đã có (TASK-017/077/080/106/122).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-145/146.

## Coordinator verification

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Agent tự kiểm tra kỹ trước khi thêm UI: đọc `DesignJobSummaryResponse.java` xác nhận API KHÔNG có field số lượng design/version thật lẫn ảnh thumbnail thật — bỏ hẳn phần "số lượng design", tái dùng đúng icon emoji theo `roomType` card đã dùng sẵn (không bịa ảnh mới). State `previewJobId` + `previewTimerRef`, hover 350ms/giữ chạm 500ms mới hiện (tránh nháy khi lướt chuột qua nhanh), đóng qua mouse-leave/Esc (`useEscapeKey` có sẵn)/click ra ngoài. Popup `pointer-events: none` để không chặn click/gây nhầm lẫn "click ra ngoài". `npm run build` PASS.

Coordinator verify: build tổng hợp cả 3 task (TASK-144/145/146) PASS, đọc diff xác nhận không đụng độ với `styles.css` của TASK-146 (agent tự đọc lại file trước khi append). Docker rebuild + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: hover vào card project thật → JS xác nhận `.project-preview-popup` render đúng icon/tên/"Cập nhật: ..." → di chuột ra ngoài → xác nhận đóng đúng qua DOM; xác nhận link `<a href="/designs/...">` vẫn nguyên vẹn (click chính không đổi hành vi). Console sạch lỗi.

## Status

COMPLETED
