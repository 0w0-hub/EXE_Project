# Module: template

**Status:** IMPLEMENTED

- **Responsibility:** cung cấp preset phong cách/màu sắc/nội thất/ngân sách để người dùng áp dụng nhanh vào form tạo room (`RoomNew.jsx`), giảm ma sát khi lần đầu dùng sản phẩm.
- **Owned Data:** bảng `design_templates`.
- **API** (đều public, không cần JWT):
  - `GET /api/v1/templates?category=` — danh sách mẫu, filter theo category (tuỳ chọn).
  - `GET /api/v1/templates/categories` — danh sách category có sẵn.
  - `GET /api/v1/templates/{id}` — chi tiết 1 mẫu.
- **Dependencies:** không phụ thuộc module nào.
- **Events Produced/Consumed:** none.
- **Scaling:** không phân trang (chỉ ~6 mẫu seed sẵn) — revisit nếu số mẫu tăng nhiều hoặc có CRUD admin.
- **Failure Modes:** `GET /{id}` với id không tồn tại → `404 TEMPLATE_NOT_FOUND`.
- **Security:** không có admin CRUD ở v1 — mẫu chỉ được thêm qua Flyway migration (seed data), không qua API.
- **Observability:** chưa có (PLANNED).

## Seed data

Migration `V2__design_templates_billing.sql` seed 6 mẫu: Scandinavian/Industrial (phòng khách), Japandi/Bohemian (phòng ngủ), Modern Minimalist (phòng bếp), Minimalist (phòng làm việc).

## Ghi chú thiết kế

- `category` là cột string đơn giản, không tách bảng `TemplateCategory` riêng (khác dự án tham khảo `dizaine_deploy`) — phù hợp vì chưa có admin CRUD quản lý category.
- Chưa có ảnh minh hoạ (thumbnail) — seed ảnh thật cần upload file qua module `asset`, không chỉ `INSERT` SQL.
