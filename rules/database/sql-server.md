# SQL Server

- Dùng SQL Server làm database chính, truy cập qua Spring Data JPA/Hibernate.
- Đặt tên bảng/cột theo `snake_case`, khóa chính `id` kiểu `UNIQUEIDENTIFIER` hoặc `BIGINT IDENTITY` (quyết định tại ADR khi bắt đầu implement).
- Không lưu file ảnh nhị phân trong SQL Server — chỉ lưu đường dẫn/metadata (xem [../../docs/architecture/data-architecture.md](../../docs/architecture/data-architecture.md)).
