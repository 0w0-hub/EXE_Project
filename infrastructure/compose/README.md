# Docker Compose — Index

**Status:** IMPLEMENTED — [`../../docker-compose.yml`](../../docker-compose.yml) đã chạy được thật (sqlserver + db-init + backend + frontend).

Rules: [../../rules/docker/compose.md](../../rules/docker/compose.md)
Kiến trúc hạ tầng: [../../docs/architecture/infrastructure.md](../../docs/architecture/infrastructure.md)

Service `db-init` là bổ sung so với dự kiến ban đầu: SQL Server không tự tạo database qua biến môi trường (khác Postgres/MySQL ở dự án tham khảo `dizaine_deploy`), nên cần 1 service chạy `sqlcmd CREATE DATABASE` trước khi backend kết nối (`depends_on: condition: service_completed_successfully`).

Đã verify end-to-end: đăng ký → tạo room → upload ảnh → lưu preference → generate design job → xem kết quả, chạy được thật qua `http://localhost:<FRONTEND_PORT>`.
