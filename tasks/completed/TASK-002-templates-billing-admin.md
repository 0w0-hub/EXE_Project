# TASK-002

## Title

Templates + Projects/History page + Free-plan usage limits + Admin panel

## Goal

Port 4 SaaS feature groups from `dizaine_deploy` into Homely, adapted to Homely's Spring Boot/JPA conventions: design style templates, paginated design-job history for the current user, a Free-plan monthly generation limit with usage tracking, and a role-gated admin panel (dashboard stats, user list, all-jobs list).

## Scope

- New backend modules: `billing/` (Plan, Subscription, usage), `template/` (DesignTemplate), `admin/` (dashboard/users/designs, `@PreAuthorize` RBAC).
- Modified: `auth/AuthService` (auto-assign FREE plan), `aidesign/*` (pagination + usage-limit check), `room/RoomService` + `user/UserService` (aggregation helpers), `common/CurrentUser` + `SecurityConfig` + `GlobalExceptionHandler` (RBAC plumbing), `common/` (new `PageMeta`/`PagedResponse`).
- New Flyway migration `V2__design_templates_billing.sql`.
- Frontend: `Templates.jsx`, `Projects.jsx`, `admin/AdminDashboard.jsx`, `admin/AdminUsers.jsx`, `admin/AdminDesigns.jsx`, `AdminRoute`, modifications to `RoomNew.jsx`, `Dashboard.jsx`, `App.jsx`, `NavBar.jsx`, `services/api.js`.

Full design rationale (circular-dependency avoidance, billing model, pagination envelope): see plan at time of execution / this task's session log.

## Dependencies

- TASK-001 (backend/frontend/db scaffold) — COMPLETED.

## Affected Services

`auth`, `aidesign`, `room`, `user` (modified); `billing`, `template`, `admin` (new).

## Acceptance Criteria

- `mvn clean package` builds; `docker compose up --build` applies Flyway V2 cleanly on top of existing V1 data.
- New user registration auto-creates a FREE subscription (`GET /api/v1/subscriptions/me` confirms).
- 6th `POST /api/v1/designs/generate` in a month returns `403 USAGE_LIMIT_EXCEEDED`.
- `GET /api/v1/designs` (own history) and `GET /api/v1/admin/designs` (all users) both paginate correctly.
- Non-admin hits `/api/v1/admin/**` → `403 ACCESS_DENIED`; SQL-promoted + re-logged-in admin gets real data back.
- Frontend: Templates page applies a template into the room form; Projects page filters by status with pagination; Dashboard shows usage widget; Admin nav link + 3 admin pages only visible/reachable for ADMIN role.

## Testing

Full curl-based backend E2E + browser E2E via Claude in Chrome, per verification plan — no status marked COMPLETED without both passing for real against the rebuilt Docker stack.

## Kết quả verify thật

- Backend: `mvn compile`/`mvn test` PASS. `docker compose up --build` áp Flyway V2 lên DB đã có V1 data, không cần reset volume.
- Curl E2E: plans/templates/categories công khai đúng dữ liệu seed; register tự gán FREE subscription (used=0/limit=5); 5 lần generate thành công, lần 6 → `403 USAGE_LIMIT_EXCEEDED`; `GET /designs` phân trang + filter status đúng; non-admin gọi `/admin/**` → 403; promote qua SQL (`-d homely_db`) + re-login → cả 3 endpoint admin trả đúng dữ liệu thật.
- Browser E2E (Claude in Chrome): Dashboard hiện widget usage đúng; Projects filter tab + link tới trang kết quả cũ (tái sử dụng, không duplicate) đúng; Templates hiện 6 mẫu, "Áp dụng mẫu này" điền đúng form + hiện đúng cảnh báo hết lượt (nút submit disable); NavBar hiện link "Quản trị" chỉ khi role ADMIN; AdminDashboard/AdminUsers/AdminDesigns hiện đúng dữ liệu thật.

## Bug tìm & sửa trong quá trình verify

1. `SecurityConfig`: import sai `AuthenticationEntryPoint` (package `org.springframework.security.web.authentication` → đúng phải là `org.springframework.security.web`) — lỗi compile, phát hiện ngay khi build.
2. URL matcher `.hasRole("ADMIN")` deny ở **tầng filter chain** (trước khi vào controller) không đi qua `GlobalExceptionHandler` → trả body rỗng thay vì JSON `ACCESS_DENIED`. Phải thêm `AccessDeniedHandler`/`AuthenticationEntryPoint` riêng trong `SecurityConfig`.
3. JSON lỗi từ Security filter chain bị lỗi encoding tiếng Việt (mojibake) vì thiếu `response.setCharacterEncoding("UTF-8")` trước khi lấy `getWriter()`.
4. Test thủ công qua Git Bash: `docker exec .../sqlcmd` bị path-conversion sai (MSYS) → cần `MSYS_NO_PATHCONV=1`; và thiếu `-d homely_db` khi promote admin khiến sqlcmd chạy nhầm trên DB `master` ("Invalid object name 'users'").

## Status

COMPLETED
