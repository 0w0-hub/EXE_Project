# TASK-163

## Title

Nút "Về đầu danh sách" + huy hiệu "Vừa mở" trong Projects

## Goal

Ý tưởng từ ChatGPT round 34 (2 ý gộp #1+#2, cùng đụng `Projects.jsx`), đã vét trước qua Explore agent:

- **Nút "Về đầu danh sách"**: xác nhận CHƯA CÓ bất kỳ cơ chế scroll-to-top nào trong toàn app (grep rộng `scrollTo|scrollY|scroll-to-top`, chỉ có `scrollIntoView` nhắm tới lỗi cụ thể ở nơi khác, không liên quan). `Projects.jsx` cũng chưa có `scroll` listener nào (chỉ có `keydown` cho phím tắt tìm kiếm TASK-150) — không xung đột.
- **Huy hiệu "Vừa mở"**: xác nhận `recordRecentProject(jobId)` (TASK-147) đã UNSHIFT id mới nhất lên ĐẦU mảng `recentProjectIds` — `recentProjectIds[0]` CHÍNH LÀ project mở gần nhất, đã có sẵn trong state (`RECENT_PROJECTS_STORAGE_KEY`). KHÔNG cần thêm cơ chế tracking mới — chỉ cần đọc lại đúng dữ liệu đã có để hiện 1 badge nhỏ.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Nút nổi "↑ Về đầu" (fixed, góc dưới-phải hoặc tương tự) — chỉ HIỆN sau khi user đã cuộn xuống quá 1 ngưỡng (vd 400px), bấm vào cuộn mượt về đầu trang (`window.scrollTo({top: 0, behavior: 'smooth'})`), tự ẩn khi đã ở đầu trang. Gắn `scroll` listener qua `useEffect` (nhớ cleanup lúc unmount).
  - Huy hiệu nhỏ "Vừa mở" trên card/row của project có `job.jobId === recentProjectIds[0]` (đọc THẲNG từ state `recentProjectIds` đã có, KHÔNG thêm biến/localStorage key mới). Style nhỏ, không đè lên các badge/nhãn khác đã có (pin, favorite, status).

## Out of scope

- Không đổi cơ chế "Mở nhanh" (TASK-147) — chỉ ĐỌC lại đúng `recentProjectIds[0]`, không đổi cách ghi.
- Không thêm danh sách shortcut mới — huy hiệu chỉ là ngữ cảnh trực quan trên card hiện có.

## Dependencies

`Projects.jsx` (`recentProjectIds`/`RECENT_PROJECTS_STORAGE_KEY` TASK-147).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Cuộn trang xuống quá ngưỡng → nút "↑ Về đầu" xuất hiện; bấm → cuộn mượt về đầu, nút tự ẩn.
- Mở 1 project (qua click card hoặc "Mở nhanh") rồi quay lại Projects → project vừa mở hiện đúng huy hiệu "Vừa mở", đúng CHỈ 1 project (project mở gần nhất).
- Không hồi quy: "Mở nhanh" (TASK-147), nhóm ngày + thu gọn/mở (TASK-157/160), ghim, tìm kiếm/phím tắt (TASK-150/152).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`RoomNew.jsx`/`ChangePassword.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-164/165.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`RoomNew.jsx`/trang Đổi mật khẩu. Agent thêm nút "↑ Về đầu" fixed góc DƯỚI-TRÁI (điều chỉnh so với gợi ý "dưới-phải" trong spec vì thanh Hoàn tác TASK-160 đã chiếm góc dưới-phải, nút so sánh chiếm dưới-giữa — quyết định hợp lý tránh chồng lấn 3 phần tử nổi). Huy hiệu "Vừa mở" đọc thẳng `recentProjectIds[0]` có sẵn (TASK-147), không thêm state/localStorage mới.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS ngay lần đầu (đã chờ backend warm-up trước khi chạy, rút kinh nghiệm từ round 45).

Verify E2E qua Claude in Chrome: vì dữ liệu test chỉ có 2 project (không đủ cao để cuộn tự nhiên), chèn tạm 1 `<div>` cao 1200px qua JS để mô phỏng nội dung dài — cuộn xuống quá ngưỡng → nút "↑ Về đầu" xuất hiện đúng; bấm → cuộn mượt về `scrollY=0` + nút tự ẩn đúng (xác nhận sau khi đủ thời gian animation hoàn tất). Huy hiệu "Vừa mở": mở project A → quay lại Projects → huy hiệu đúng trên project A; mở project B (project khác) → quay lại → huy hiệu CHUYỂN đúng sang project B, không còn ở A, đúng CHỈ 1 huy hiệu tại một thời điểm. Console sạch lỗi.

## Status

COMPLETED
