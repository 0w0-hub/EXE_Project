# Infrastructure

## Thành phần (Docker Compose) — đã scaffold, đã chạy được thật

- `sqlserver` — Microsoft SQL Server 2022 container (Express edition).
- `db-init` — one-shot: tạo database `homely_db` (SQL Server không tự tạo qua env var như Postgres/MySQL).
- `backend` — Spring Boot app (Java 21), build multi-stage bằng Maven, tự chạy Flyway migration khi start.
- `frontend` — React build (Vite) phục vụ qua Nginx; Nginx cũng proxy `/api/` sang `backend:8080`.
- Chưa có service `ai-service` riêng — AI provider hiện chạy trong module `aidesign` của `backend` (provider `mock`), xem [ADR-0003](../decisions/ADR-0003-ai-integration-approach.md). Sẽ tách thành service riêng nếu chốt dùng Python/model riêng.

File thật: [`../../docker-compose.yml`](../../docker-compose.yml), [`../../backend/Dockerfile`](../../backend/Dockerfile), [`../../frontend/Dockerfile`](../../frontend/Dockerfile), [`../../frontend/nginx.conf`](../../frontend/nginx.conf).

Tham khảo pattern gốc: `../../../dizaine_deploy/docker-compose.yml`.

## Kubernetes

Chưa cần ở giai đoạn hiện tại (chỉ 1 backend + 1 frontend + 1 DB, chưa có nhu cầu scale/orchestration phức tạp). Nếu tương lai cần, sẽ có ADR riêng và scaffold `infrastructure/kubernetes/` khi đó — hiện tại đây là **planned path**, chưa tạo.

## Trạng thái

SCAFFOLDED — đã build & verify chạy thật qua `docker compose up -d --build`: sqlserver healthy, migration tự áp dụng, backend + frontend phục vụ request thật, luồng E2E (đăng ký → tạo room → generate design → xem kết quả) chạy đúng.

Chưa PRODUCTION_READY: chưa có TLS, chưa có CI/CD, chưa có backup strategy cho SQL Server volume.
