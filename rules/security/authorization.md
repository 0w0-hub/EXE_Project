# Authorization

- Mỗi room/design chỉ owner (user tạo ra) mới xem/sửa được, trừ vai trò `ADMIN`.
- Kiểm tra ownership ở tầng service, không chỉ dựa vào việc ẩn UI.

## RBAC theo role (module `admin`)

- `SecurityConfig` có `@EnableMethodSecurity`; mọi method admin đánh dấu `@PreAuthorize("hasRole('ADMIN')")`.
- **Defense-in-depth:** ngoài `@PreAuthorize`, `SecurityConfig` còn có URL matcher tầng filter chain `.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")` — để endpoint admin mới thêm sau mà quên `@PreAuthorize` vẫn fail-closed (403) thay vì vô tình mở cho mọi user đã đăng nhập.
- `common/CurrentUser.role()` / `isAdmin()` đọc authority `ROLE_<role>` từ `SecurityContextHolder` (được `JwtAuthFilter` set từ claim `role` trong JWT).
- **JWT role là snapshot lúc đăng nhập, không re-check DB mỗi request.** Sau khi promote user thành `ADMIN` bằng SQL (`UPDATE users SET role='ADMIN' ...`), user đó phải **đăng xuất rồi đăng nhập lại** để nhận token mới có `ROLE_ADMIN` — nếu không, `/api/v1/admin/**` vẫn trả `403 ACCESS_DENIED` dù DB đã đúng. Đây không phải bug, chỉ cần lấy token mới (đã ghi trong README gốc).
- Không có tài khoản admin mặc định/hardcode trong migration hoặc code — vi phạm `rules/security/secrets.md`. Admin đầu tiên luôn được tạo bằng cách đăng ký thường + update SQL thủ công.

## Lỗi 403 phải trả JSON đúng format ở cả 2 tầng

`@PreAuthorize` denial (trong lúc controller method chạy) đi qua `@RestControllerAdvice` (`GlobalExceptionHandler.handleAccessDenied`) như bình thường. Nhưng URL-matcher-level denial (`.hasRole(...)` ở tầng filter chain, **trước khi** vào `DispatcherServlet`/controller) **không** đi qua `@RestControllerAdvice` — Spring Security tự trả response ở tầng filter. Nếu không cấu hình, mặc định trả body rỗng (đã gặp bug này khi thêm module `admin`).

**Cách sửa:** cấu hình `.exceptionHandling(ex -> ex.accessDeniedHandler(...).authenticationEntryPoint(...))` trong `SecurityConfig`, viết JSON thủ công theo đúng format `ApiResponse.error(code, message)` (dùng `ObjectMapper` có sẵn của Spring Boot). **Nhớ `response.setCharacterEncoding("UTF-8")` trước khi lấy `getWriter()`** — nếu không, tiếng Việt trong message lỗi sẽ bị hỏng encoding (mojibake) vì servlet response mặc định dùng ISO-8859-1 cho writer khi charset không được set rõ trong content type.
