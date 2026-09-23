# Module: user

**Status:** IMPLEMENTED

- **Responsibility:** quản lý hồ sơ người dùng (tên, avatar, sở thích thiết kế mặc định).
- **Owned Data:** bảng `users` (profile fields), `user_preferences`.
- **API:** `/api/v1/users/me` (GET/PATCH).
- **Events Produced/Consumed:** none.
- **Dependencies:** `auth`.
- **Scaling:** stateless.
- **Failure Modes:** update profile với dữ liệu không hợp lệ → 400.
- **Security:** chỉ user đó (hoặc admin) sửa được profile của mình.
- **Observability:** log thay đổi profile quan trọng (đổi email).
