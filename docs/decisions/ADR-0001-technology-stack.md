# ADR-0001: Technology Stack Selection

## Status

ACCEPTED

## Context

Dự án Homely cần một stack có thể triển khai độc lập bằng Docker, tách biệt frontend/backend, dùng RDBMS quan hệ để quản lý dữ liệu người dùng/room/design job có cấu trúc rõ ràng.

## Decision

- Database: **SQL Server**
- Backend: **Spring Boot** (Java)
- Frontend: **React**
- Reverse proxy / static hosting: **Nginx**
- Containerization: **Docker** (Docker Compose cho môi trường dev/local)

## Consequences

- Được: hệ sinh thái Java/Spring Boot trưởng thành, phù hợp domain có nhiều business rule (chi phí, ownership, trạng thái job).
- Đánh đổi: SQL Server nặng hơn PostgreSQL/MySQL về resource khi chạy local qua Docker; cần lưu ý khi cấu hình container.
- AI generation (phân tích ảnh, sinh 3D) có thể cần runtime khác (Python) — xem [ADR-0003](ADR-0003-ai-integration-approach.md).
