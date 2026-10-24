# Module: admin

**Status:** IMPLEMENTED

- **Responsibility:** dashboard số liệu tổng hợp, danh sách toàn bộ user, danh sách toàn bộ design job (xem tất cả user) — chỉ dành cho vai trò `ADMIN`.
- **Owned Data:** không có bảng riêng — chỉ tổng hợp qua service của `user`, `room`, `aidesign` (không đọc trực tiếp repository của module khác — xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md)).
- **API** (tất cả yêu cầu role `ADMIN`):
  - `GET /api/v1/admin/dashboard` — `{totalUsers, totalRooms, totalDesignJobs, designJobsByStatus}`.
  - `GET /api/v1/admin/users?page=&size=` — danh sách user, phân trang.
  - `GET /api/v1/admin/designs?status=&page=&size=` — danh sách job của **tất cả** user, phân trang + filter (dùng chung logic `DesignService.listJobs(ownerId=null, ...)` với endpoint lịch sử của chính user trong module `aidesign`).
- **Dependencies:** `user`, `room`, `aidesign` — một chiều (`admin → {user, room, aidesign}`), không có module nào phụ thuộc ngược lại `admin`.
- **Events Produced/Consumed:** none.
- **Scaling:** dashboard tính 4 lượt `countByStatus` riêng — đơn giản, đủ ở quy mô hiện tại; có thể đổi sang 1 query `GROUP BY` nếu cần tối ưu sau.
- **Failure Modes:** user không phải ADMIN gọi bất kỳ endpoint `/admin/**` → `403 ACCESS_DENIED` (JSON đúng format, xem Security).
- **Security:**
  - RBAC qua `@PreAuthorize("hasRole('ADMIN')")` trên từng method (`@EnableMethodSecurity` trong `SecurityConfig`), **cộng thêm** defense-in-depth: `SecurityConfig` có URL matcher `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")` ở tầng filter chain, để endpoint admin mới thêm sau mà quên `@PreAuthorize` vẫn fail-closed.
  - `CurrentUser.role()`/`isAdmin()` đọc authority `ROLE_<role>` từ JWT.
  - Không có tài khoản admin mặc định/hardcode. Cách tạo admin: đăng ký bình thường rồi `UPDATE users SET role='ADMIN' WHERE email=...` (xem README gốc). **Phải đăng xuất/đăng nhập lại** sau khi promote — JWT gắn `role` lúc đăng nhập, không đọc lại DB theo từng request.
  - `AccessDeniedException` ở tầng filter (URL matcher deny, trước khi vào controller) không đi qua `@RestControllerAdvice` — phải cấu hình `AccessDeniedHandler`/`AuthenticationEntryPoint` riêng trong `SecurityConfig` để trả JSON đúng format `ApiResponse.error(...)` (đã fix bug ban đầu trả body rỗng, xem [ADR-0004](../decisions/ADR-0004-billing-and-pagination.md) hoặc `rules/security/authorization.md`).
- **Observability:** chưa có (PLANNED).
