# Module: auth

**Status:** IMPLEMENTED

- **Responsibility:** đăng ký, đăng nhập, refresh token, đăng xuất.
- **Owned Data:** bảng `users`, `refresh_tokens` (tên chính thức chốt khi implement).
- **API:** `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/me`.
- **Events Produced:** none (chưa dùng event-driven ở giai đoạn này).
- **Events Consumed:** none.
- **Dependencies:** `user` (tạo profile khi register).
- **Scaling:** stateless, scale theo backend chung.
- **Failure Modes:** sai mật khẩu → 401; token hết hạn → 401 + yêu cầu refresh.
- **Security:** hash password (BCrypt), JWT ký bằng secret riêng biệt theo môi trường.
- **Observability:** log login thất bại (không log password).
