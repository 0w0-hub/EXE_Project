# Module: billing

**Status:** IMPLEMENTED

- **Responsibility:** quản lý `Plan`/`Subscription` và kiểm tra giới hạn lượt tạo thiết kế theo gói mỗi tháng.
- **Owned Data:** bảng `plans`, `subscriptions`.
- **API:**
  - `GET /api/v1/plans` — public, danh sách gói.
  - `GET /api/v1/subscriptions/me` — JWT, gói hiện tại của user.
  - `GET /api/v1/usage/me` — JWT, `{used, limit, remaining, periodMonth, periodYear}`.
- **Dependencies:** không phụ thuộc module nào. **Quan trọng:** `BillingService` không bao giờ đọc bảng `design_jobs` (thuộc module `aidesign`) — số lượt đã dùng ("used") luôn do module gọi (`aidesign`) tính trước rồi truyền vào, để tránh circular dependency (`aidesign → billing → aidesign`) và tôn trọng ranh giới module — xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md).
- **Events Produced/Consumed:** none.
- **Scaling:** stateless; usage tính live bằng `COUNT(design_jobs)` theo tháng — không dùng ledger table (đơn giản hoá vì chỉ có 1 loại usage — xem [../decisions/ADR-0004-billing-and-pagination.md](../decisions/ADR-0004-billing-and-pagination.md)).
- **Failure Modes:** vượt giới hạn → `403 USAGE_LIMIT_EXCEEDED` khi gọi `POST /api/v1/designs/generate` (kiểm tra trong `aidesign.DesignService.createJob`, không phải trong `billing`).
- **Security:** mọi user mới đăng ký tự động được gán gói `FREE` (`AuthService.register` gọi `BillingService.assignFreePlanToNewUser`).
- **Observability:** chưa có (PLANNED).

## Seed data

Migration `V2__design_templates_billing.sql` seed 2 gói: `FREE` (limit 5 lượt/tháng), `PRO` (không giới hạn).
