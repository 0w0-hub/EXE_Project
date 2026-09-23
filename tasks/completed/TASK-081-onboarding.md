# TASK-081

## Title

Hướng dẫn nhanh cho user mới (First-Time Onboarding — rút gọn)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 2, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại TASK-077/078/079: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "First-Time Onboarding": user mới đăng ký chưa biết quy trình upload ảnh → tạo phòng → xem kết quả 2D/3D, hiện tại `Dashboard.jsx` không có hướng dẫn gì, chỉ có hero + danh sách rỗng.

## Scope

- Đọc `frontend/src/pages/Dashboard.jsx` và `frontend/src/pages/RoomNew.jsx` trước khi viết (để biết đúng luồng thật: tạo phòng → upload ảnh (tuỳ chọn) → preference → generate → xem kết quả).
- Component mới `frontend/src/components/OnboardingTour.jsx` — 1 overlay/modal nhẹ (dùng CSS token có sẵn trong `styles.css`, không thêm thư viện ngoài) gồm 3-4 bước giải thích luồng thật của Homely (không phải luồng bịa — mô tả đúng những gì Dashboard/RoomNew thật sự có), mỗi bước có nút "Tiếp theo"/"Bỏ qua" (Skip), bước cuối có nút "Bắt đầu" điều hướng sang `/rooms/new`.
- Gắn vào `Dashboard.jsx`: hiện tự động CHỈ LẦN ĐẦU sau khi đăng ký/đăng nhập — dùng `localStorage` flag riêng (ví dụ `homely_onboarding_seen`, đặt tên không trùng các key đã có: `homely_access_token`/`homely_refresh_token`) để không hiện lại các lần sau. Thêm 1 link nhỏ "Xem lại hướng dẫn" (ví dụ cuối trang hoặc gần hero) để user tự mở lại tour bất cứ lúc nào — không bắt buộc phải đẹp, chỉ cần hoạt động đúng.

## Out of scope

- Không dùng "sample room/demo data" giả (ý tưởng gốc ChatGPT có đề xuất — bỏ qua vì tạo dữ liệu demo giả cho user thật vi phạm nguyên tắc "không bịa dữ liệu" của dự án; giải thích luồng bằng TEXT/hình minh hoạ tĩnh là đủ).
- KHÔNG đụng `NavBar.jsx` (task khác trong cùng round — Notification Center — đang đụng file đó song song, tránh xung đột).
- Không đụng `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`.
- Không thêm tour riêng cho từng trang khác (RoomNew/DesignResult) — chỉ 1 tour tổng quan ở Dashboard.

## Dependencies

`Dashboard.jsx`, `RoomNew.jsx` (mô tả đúng luồng thật), `styles.css` (design token "Peacock Feather" có sẵn).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Tài khoản MỚI đăng nhập lần đầu (chưa có flag `localStorage`) → vào Dashboard tự động hiện tour.
- Bấm "Bỏ qua" hoặc đi hết các bước → tour đóng, đặt flag `localStorage`, tải lại trang/đăng nhập lại KHÔNG tự hiện lại tour.
- Bấm "Xem lại hướng dẫn" → tour mở lại đúng dù đã có flag.
- Bước cuối bấm "Bắt đầu" → điều hướng đúng sang `/rooms/new`.
- Không hồi quy layout/hero/danh sách room hiện có ở Dashboard.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành. Nếu cần tài khoản mới thật để suy luận logic "lần đầu", tự đăng ký qua API (`POST /api/v1/auth/register`) — không cần chạy được trong trình duyệt.

## Status

COMPLETED

## Coordinator verification

Rebuild Docker (`docker compose up -d --build`, gộp chung với TASK-080/082) + verify E2E qua Docker + browser thật, tài khoản MỚI đăng ký thật (`task080-onboard@example.com`):
- Vào Dashboard lần đầu → tour tự động hiện đúng ("Chào mừng đến với Homely 👋", 4 chấm tiến trình).
- Bấm "Tiếp theo" qua đủ 3 bước (Tạo phòng mới → Ảnh hiện trạng & sở thích → Xem kết quả AI thiết kế) — nội dung mô tả đúng luồng thật (khớp `RoomNew.jsx`/`DesignResult.jsx`), không có bước bịa.
- Bước cuối bấm "Bắt đầu" → điều hướng đúng sang `/rooms/new`.
- Quay lại Dashboard → tour KHÔNG tự hiện lại (flag `localStorage` hoạt động đúng).
- Bấm "Xem lại hướng dẫn" → tour mở lại đúng dù đã có flag.
- Console sạch lỗi.
- Không phát hiện lỗi mới nào.
