# State Management

- Trạng thái auth dùng Context (giống dự án tham khảo `AuthContext`).
- Trạng thái tiến trình generation (uploading → analyzing → generating → done/failed) phải là state machine rõ ràng, hiển thị đúng trạng thái cho người dùng — tránh loading vô hạn.
