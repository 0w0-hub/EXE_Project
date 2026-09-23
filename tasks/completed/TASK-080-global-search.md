# TASK-080

## Title

Tìm kiếm nhanh trong "Dự án của tôi" (Global Search — rút gọn)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 2, ý tưởng lấy từ ChatGPT (cùng phiên hội thoại TASK-077/078/079: `https://chatgpt.com/c/6aab7742-7b94-83ec-bf40-2b5cb5e4bad2`) — "Global Search": `Projects.jsx` hiện chỉ có filter theo trạng thái (Tất cả/Hoàn thành/Đang xử lý/Đang chờ/Lỗi, có sẵn), chưa có cách tìm theo tên/loại phòng khi danh sách dài ra.

## Scope

- `frontend/src/pages/Projects.jsx`: thêm 1 ô input tìm kiếm (đặt cạnh dải nút filter trạng thái có sẵn), lọc THUẦN CLIENT-SIDE trên danh sách job đã fetch sẵn (không gọi API mới) theo: `roomType`, và style/màu nếu có trong dữ liệu preference đã có (kiểm tra kỹ cấu trúc dữ liệu `job` hiện tại trước khi viết — đọc file trước khi sửa, KHÔNG bịa field không tồn tại). Áp dụng SONG SONG với filter trạng thái hiện có (cả 2 điều kiện cùng lúc, không thay thế).
  - Tái sử dụng cách bỏ dấu tiếng Việt đã có ở `Projects.jsx` (hàm `normalize`, từ TASK-017) để tìm không cần gõ đúng dấu — đọc kỹ hàm này trước khi viết, dùng lại chứ không viết hàm mới trùng chức năng.
  - Không có kết quả khớp → thông báo rõ ràng (không phải màn hình trắng im lặng).
  - Ô tìm kiếm rỗng → hiện lại đầy đủ danh sách (theo đúng filter trạng thái đang chọn).

## Out of scope

- Không gọi API tìm kiếm mới ở backend (dữ liệu đã có sẵn ở client, không cần).
- Không đụng `NavBar.jsx`, `Dashboard.jsx`, `Room3DViewer.jsx`, `DesignResult.jsx` — các task khác trong cùng round có thể đang đụng các file đó song song.
- Không tìm theo nội dung nội thất bên trong từng job (chỉ tìm theo thông tin đã hiển thị sẵn trên card — `roomType`/style nếu có).

## Dependencies

TASK-017 (`normalize` bỏ dấu tiếng Việt, card grid), TASK-065 (pattern ô tìm kiếm tương tự đã làm ở `Room3DViewer.jsx` — tham khảo UX, không copy code vì khác component).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Gõ từ khóa khớp 1 phần tên/loại phòng (có hoặc không dấu) → chỉ hiện đúng các card khớp.
- Gõ từ khóa không khớp gì → hiện thông báo rõ ràng, không phải danh sách trống im lặng.
- Xoá từ khóa → hiện lại đầy đủ danh sách theo đúng filter trạng thái đang chọn.
- Kết hợp filter trạng thái + từ khóa cùng lúc → lọc đúng cả 2 điều kiện.
- Không hồi quy checkbox "Chọn để so sánh" (TASK-077) hay bất kỳ chức năng nào khác của trang.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành. Nếu cần dữ liệu thật để tự kiểm tra logic, dùng `curl` gọi thẳng backend đang chạy sẵn ở `http://localhost:8080` (tài khoản test có sẵn: `task077-tester@example.com` / `Test1234!`, đã có vài room/job thật).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker (`docker compose up -d --build`, gộp chung với TASK-081/082) + verify E2E qua Docker + browser thật (`task077-tester@example.com`, 5 project có sẵn: 3× "Living Room"/"LIVING_ROOM", "Phong ngu", "Phong khach"):
- Gõ "ngu" → lọc đúng còn 1 thẻ "Phong ngu".
- Gõ "xyz123" (không khớp) → hiện đúng thông báo "Không tìm thấy phòng nào khớp với "xyz123". Thử từ khóa khác." (không phải trắng trang/im lặng).
- Xoá ô tìm kiếm → hiện lại đủ 5 thẻ.
- Không hồi quy checkbox "Chọn để so sánh" (TASK-077) hay dải nút filter trạng thái có sẵn.
- Console sạch lỗi.
- Không phát hiện lỗi mới nào.
