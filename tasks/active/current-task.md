# Current Task

Hiện tại **không có task nào đang ACTIVE**.

Task gần nhất hoàn thành: TASK-171 — Fix mock auth login/register. Xem [tasks/completed/TASK-171-fix-mock-auth-login-register.md](../completed/TASK-171-fix-mock-auth-login-register.md).

Task gần nhất đã hoàn thành: TASK-168/169 (round 48 — 2 agent song song, `Projects.jsx` (giữ vị trí cuộn phạm vi hẹp + sao chép tên trong menu "⋮" + trả focus đúng nút) + `RoomNew.jsx` (đặt lại từng trường về giá trị mặc định THẬT, khác xoá trắng TASK-164). Playwright 3/3 PASS ngay lần đầu) — xem `../completed/TASK-168-projects-scroll-copy-name-focus-restore.md`, `../completed/TASK-169-roomnew-field-reset-to-default.md`.

## VÒNG LẶP "HỎI CHATGPT → NHIỀU AGENT TỰ TRIỂN KHAI" ĐÃ DỪNG (2026-09-18)

Theo yêu cầu trực tiếp của user: *"Làm nốt vòng lặp này và dừng lại"* — round 48 (TASK-168/169) là round CUỐI CÙNG. Vòng lặp tự động hỏi ChatGPT ý tưởng mới đã DỪNG HẲN, KHÔNG tự động tiếp tục sang round 49. Tổng kết: 48 round liên tiếp, TASK-077→169 (116 tính năng) + TASK-118 (yêu cầu trực tiếp từ user, dọn dẹp toolbar 3D). Xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory (đã cập nhật trạng thái dừng), `tasks/state/current-state.md` mục "Next Priority" (đã cập nhật), backlog ý tưởng chưa dùng còn lại trong `tasks/backlog/README.md` cho tham khảo nếu user muốn tiếp tục thủ công sau này.

Khi bắt đầu một task MỚI (theo yêu cầu trực tiếp của user, không tự động), tạo file `tasks/active/TASK-XXX-ten-task.md` theo format trong `tasks/README.md` và cập nhật file này để trỏ tới task đó. **Lịch sử đầy đủ từng round (TASK-077 trở đi) đã chuyển hẳn sang `tasks/state/current-state.md` mục "Implemented" — đây là NGUỒN SỰ THẬT DUY NHẤT cho lịch sử round, không lặp lại ở file này nữa** (dọn dẹp theo đúng nguyên tắc "một nguồn sự thật, không copy nội dung" của `CLAUDE.md` — file này trước đó đã phình to thành bản tóm tắt trùng lặp với `current-state.md`).

Task tiếp theo nên bắt đầu: xem `tasks/state/current-state.md` → mục "Next Priority" để biết chính xác bước kế tiếp (hỏi ChatGPT lần mới hay dùng ý tưởng còn dư), hoặc chọn 1 mục trong [../backlog/README.md](../backlog/README.md).

Khi bắt đầu một task, tạo file `tasks/active/TASK-XXX-ten-task.md` theo format trong `tasks/README.md` và cập nhật file này để trỏ tới task đó.
