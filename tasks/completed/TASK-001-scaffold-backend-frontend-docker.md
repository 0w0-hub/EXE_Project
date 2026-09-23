# TASK-001

## Title

Scaffold Backend (Spring Boot) + Frontend (React) + SQL Server + Docker/Nginx + README chạy dự án

## Goal

Tạo code scaffold thật (build được, chạy được) cho modular monolith Homely theo `docs/architecture/overview.md` và `docs/architecture/data-architecture.md`, với AI provider mặc định là `mock` (giống pattern `AI_PROVIDER=mock` ở dự án tham khảo) vì ADR-0003 chưa chốt provider thật. Cập nhật `README.md` gốc: cách chạy bằng Docker, cách chạy không dùng Docker, cấu trúc thư mục.

## Scope

- Backend: Spring Boot (Java 21), module `auth`, `user`, `room`, `asset`, `aidesign` theo `rules/architecture/service-boundaries.md`.
- Frontend: React (Vite), các trang: đăng nhập/đăng ký, tạo room + upload ảnh + preference, xem trạng thái/kết quả design job.
- Database: SQL Server, migration bằng Flyway.
- Docker Compose: sqlserver + backend + frontend (Nginx).
- README.md gốc cập nhật đầy đủ.

Ngoài phạm vi task này: AI provider thật (ADR-0003 vẫn PROPOSED), 3D viewer thật (chỉ scaffold placeholder), CI/CD.

## Dependencies

- ADR-0001 (tech stack) — ACCEPTED
- ADR-0002 (modular monolith) — ACCEPTED

## Affected Services

`auth`, `user`, `room`, `asset`, `aidesign` (tất cả, lần đầu scaffold)

## Acceptance Criteria

- `mvn -f backend/pom.xml clean package` build thành công.
- Backend chạy được local (không Docker) và trả response cho `/api/v1/auth/register`, `/api/v1/auth/login`.
- Frontend `npm install` + `npm run build` thành công.
- `docker compose up` khởi động được sqlserver + backend + frontend, health-check qua ít nhất 1 API thật.
- README.md gốc có đủ 3 phần: chạy bằng Docker, chạy không dùng Docker, cấu trúc thư mục.

## Testing

Chạy thử thật theo `rules/testing/e2e.md` (đăng ký → đăng nhập → tạo room → generate design job mock → xem kết quả) trước khi đóng task.

## Documentation

Cập nhật `tasks/state/current-state.md`, `logs/progress/current.md`, `logs/ai-agent/latest.md` + session log mới sau khi hoàn thành.

## Kết quả verify thật (không chỉ build)

- `mvn clean package` + `mvn test` (unit test `MockAiDesignProviderTest`) — PASS.
- `npm install` + `npm run build` (frontend) — PASS.
- `docker compose up -d --build`: sqlserver healthy, `db-init` tạo database, backend áp Flyway migration và start, frontend serve qua Nginx — PASS.
- E2E qua API thật (curl) và qua UI thật (trình duyệt, Claude in Chrome): đăng ký → đăng nhập → tạo room → upload ảnh → gắn ảnh → lưu preference → generate → poll → xem đủ 7 phần output (decor, nội thất, màu sắc, bố trí, chi phí, 3D placeholder, giải thích AI) — PASS.
- Chạy backend KHÔNG dùng Docker (`mvn spring-boot:run` trỏ tới SQL Server riêng) — PASS (sau khi phát hiện máy dev có SQL Server native chiếm port 1433, phải dùng port khác — đã ghi chú trong README).

## Bug tìm & sửa trong quá trình verify

1. `MockAiDesignProvider`: `.formatted()` chỉ áp dụng cho 1 trong 2 chuỗi nối bằng `+` (độ ưu tiên toán tử Java) → `IllegalFormatConversionException`. Phát hiện qua unit test, đã sửa.
2. `GlobalExceptionHandler.handleUnexpected`: nuốt exception không log, vi phạm `rules/backend/error-handling.md` → đã thêm log, giúp phát hiện bug #3.
3. Flyway migration dùng `DATETIME2` cho cột map với `java.time.Instant`, nhưng Hibernate 6 + SQLServerDialect mặc định cần `DATETIMEOFFSET` → app crash lúc validate schema. Đã sửa migration.
4. `docker-compose.yml` thiếu cơ chế tạo database (SQL Server không tự tạo qua env var như Postgres/MySQL) → thêm service `db-init`.

## Status

COMPLETED
