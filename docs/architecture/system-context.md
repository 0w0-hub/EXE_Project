# System Context

```text
                ┌─────────────────────┐
                │        User          │
                │ (chủ nhà / người dùng)│
                └──────────┬───────────┘
                           │ upload ảnh phòng, mô tả yêu cầu
                           ▼
                ┌─────────────────────┐
                │   Homely Frontend    │  (React, qua Nginx)
                └──────────┬───────────┘
                           │ REST API (/api/v1)
                           ▼
                ┌─────────────────────┐
                │   Homely Backend     │  (Spring Boot)
                │  auth/user/room/     │
                │  ai-design/asset     │
                └────┬───────────┬─────┘
                     │           │
                     ▼           ▼
          ┌──────────────┐  ┌──────────────────┐
          │  SQL Server   │  │ AI Provider(s)    │
          │  (dữ liệu)     │  │ (phân tích ảnh +   │
          │               │  │  sinh ảnh 3D)      │
          └──────────────┘  └──────────────────┘
```

Provider AI cụ thể (self-host / API bên thứ 3) chưa chốt — xem [ADR-0003](../decisions/ADR-0003-ai-integration-approach.md).
