# Database Documentation — Index

**Status:** IMPLEMENTED — schema thật đã tạo và verify qua Flyway migration.

- Entity mức khái niệm: [../architecture/data-architecture.md](../architecture/data-architecture.md)
- Rules SQL Server & migration: [../../rules/database/README.md](../../rules/database/README.md)
- Migration thật: [`../../backend/src/main/resources/db/migration/V1__init.sql`](../../backend/src/main/resources/db/migration/V1__init.sql)

## Bảng đã tạo

`users`, `assets`, `rooms`, `room_preferences`, `design_jobs`, `design_results`, `design_furniture_items`, `design_color_palettes`.

## Lưu ý kỹ thuật đã gặp khi implement

Hibernate 6 map `java.time.Instant` sang kiểu `DATETIMEOFFSET` trên SQL Server (không phải `DATETIME2`) theo mặc định — migration phải dùng đúng kiểu này cho mọi cột `created_at`/`updated_at`, nếu không `ddl-auto: validate` sẽ fail lúc backend khởi động.
