# TASK-170 — Frontend mock login không dùng database

## Status
COMPLETED

## Goal
Cho phép UI frontend đăng nhập giả để xem các màn hình protected mà không gọi auth API hoặc database.

## Changes
- Thêm cờ `VITE_MOCK_AUTH` trong `AuthContext`.
- Khi bật cờ, login dùng user/token giả và lưu session ở `localStorage`.
- Reload khôi phục user giả; logout xoá token và user giả.
- Hiển thị thông báo rõ trên trang login khi đang ở mock mode.
- Thêm `frontend/.env.example` và hướng dẫn chạy trong `README.md`.

## Validation
- `cd frontend && npm run build`: PASS.
- Browser với `VITE_MOCK_AUTH=true`: submit email/mật khẩu bất kỳ vào `/`, token/user mock được lưu.
- Reload trang: route protected vẫn mở và session mock còn nguyên.
- Backend không chạy: các request dữ liệu Dashboard báo không kết nối, đúng giới hạn scope; không ảnh hưởng việc bypass auth.
