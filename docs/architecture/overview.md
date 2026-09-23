# Architecture Overview

## Kiểu kiến trúc

**Modular Monolith** cho giai đoạn hiện tại (xem [ADR-0002](../decisions/ADR-0002-modular-monolith-architecture.md)):

- 1 backend Spring Boot, tổ chức theo module domain (`auth`, `user`, `room`, `ai-design`, `asset`).
- 1 frontend React (SPA), phục vụ qua Nginx.
- 1 database SQL Server.
- 1 (hoặc tách riêng nếu cần) service xử lý AI generation — quyết định cụ thể tại [ADR-0003](../decisions/ADR-0003-ai-integration-approach.md).
- Nginx làm reverse proxy phía trước backend + phục vụ static frontend, theo mẫu ở dự án tham khảo `dizaine_deploy`.

## Vì sao không chọn microservices ngay

Quy mô sản phẩm ở MVP chưa cần scale độc lập theo từng domain; modular monolith giúp giảm độ phức tạp vận hành (một DB, một service deploy) trong khi vẫn giữ ranh giới module rõ ràng để tách ra sau nếu cần — xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md).

## Luồng chính (happy path)

```text
User → React (upload ảnh + mô tả) 
     → Nginx 
     → Backend Spring Boot (module room) 
     → tạo generation job 
     → module ai-design gọi AI provider 
     → lưu kết quả (asset) 
     → Backend trả job status 
     → React hiển thị ảnh 3D kết quả
```

Chi tiết data: [data-architecture.md](data-architecture.md).
Chi tiết hạ tầng: [infrastructure.md](infrastructure.md).
