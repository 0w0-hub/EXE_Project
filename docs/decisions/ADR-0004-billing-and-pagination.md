# ADR-0004: Mô hình Billing đơn giản hoá & Pagination envelope

## Status

ACCEPTED

## Context

Khi thêm tính năng giới hạn lượt tạo thiết kế theo gói (Free/Pro) và trang lịch sử/danh sách có phân trang (dự án tham khảo `dizaine_deploy` dùng Prisma + NestJS), cần 2 quyết định kỹ thuật cho Homely (Spring Boot + JPA):

1. **Mô hình dữ liệu billing**: dự án tham khảo có 3 bảng (`Plan`, `Subscription`, `UsageRecord` — ledger ghi từng lượt sử dụng, có nhiều `usageType`: GENERATION/RESIZE/EXPORT_HD/...).
2. **Cách trả dữ liệu phân trang**: đây là lần đầu Homely cần pagination. `ApiResponse<T>` hiện tại chỉ có 3 field (`success, data, error`), và frontend `api.js` có interceptor `response.data?.data` sẽ bỏ qua bất kỳ field nào khác nếu thêm vào `ApiResponse` thay vì vào `data`.

## Decision

### Billing: 2 bảng, không có ledger

Chỉ tạo `plans` + `subscriptions`. Số lượt đã dùng trong tháng tính **live** bằng `COUNT(design_jobs) WHERE owner_id=? AND created_at >= đầu tháng hiện tại`, không lưu ledger riêng. Lý do: Homely hiện chỉ có **một** loại usage (tạo thiết kế = 1 job = 1 unit), nên ledger là phức tạp thừa (vi phạm nguyên tắc "no premature complexity" trong `rules/database/consistency.md`). Việc tính "used" được thực hiện trong module `aidesign` (nơi sở hữu `design_jobs`) rồi truyền vào `BillingService` — xem [rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md) mục "Tránh circular dependency".

### Pagination: `PagedResponse<T>` làm payload, không sửa `ApiResponse<T>`

Thêm `common/PageMeta.java` (`page, size, totalElements, totalPages`) và `common/PagedResponse.java` (`items: List<T>, meta: PageMeta`). Endpoint phân trang trả `ApiResponse.success(PagedResponse.of(page))` — nghĩa là phần phân trang nằm **trong** `data`, không phải field mới cạnh `data`/`error`. `ApiResponse<T>` giữ nguyên 3 field, không cần sửa 12 endpoint hiện có, và **không cần sửa interceptor axios ở frontend** (`response.data?.data` vẫn hoạt động đúng vì `{items, meta}` chính là payload được unwrap).

## Consequences

- Được: đơn giản, không phải retrofit `ApiResponse` hay interceptor; đúng triết lý MVP của dự án.
- Đánh đổi: nếu tương lai có nhiều loại usage khác (export ảnh HD, xoá nền...), sẽ cần thêm ledger table lúc đó — chấp nhận được vì hiện tại chưa có nhu cầu thật.
- Nếu muốn `meta` là field top-level cạnh `data` (ví dụ để hợp với convention OpenAPI codegen sau này), sẽ phải sửa `ApiResponse<T>` và interceptor cùng lúc — chưa cần ở giai đoạn này.
