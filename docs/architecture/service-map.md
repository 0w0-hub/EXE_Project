# Service / Module Map

| Module | Trách nhiệm | Trạng thái |
|---|---|---|
| `auth` | Đăng ký, đăng nhập, JWT | IMPLEMENTED |
| `user` | Hồ sơ người dùng | IMPLEMENTED |
| `room` | Lưu ảnh phòng, mô tả yêu cầu | IMPLEMENTED |
| `ai-design` (`aidesign`) | Điều phối gọi AI phân tích + sinh ảnh, quản lý job, lịch sử phân trang | IMPLEMENTED (mock provider) |
| `asset` | Lưu trữ file ảnh gốc & ảnh kết quả | IMPLEMENTED |
| `billing` | Plan/Subscription, giới hạn lượt tạo theo tháng | IMPLEMENTED |
| `template` | Mẫu thiết kế (preset phong cách/màu sắc/ngân sách) | IMPLEMENTED |
| `admin` | Dashboard/users/designs cho vai trò ADMIN | IMPLEMENTED |

Chi tiết trách nhiệm/API/data từng module: xem [../services/README.md](../services/README.md).

Đây là module trong CÙNG MỘT backend (modular monolith), không phải service deploy riêng — xem [overview.md](overview.md).

## Sơ đồ phụ thuộc giữa module (một chiều, không có cycle)

```text
auth      → billing
aidesign  → { room, billing }
admin     → { user, room, aidesign }
template  → (không phụ thuộc module nào)
```

**Nguyên tắc quan trọng** (đã áp dụng khi thêm `billing`/`admin`, xem [../../rules/architecture/service-boundaries.md](../../rules/architecture/service-boundaries.md)): khi module A cần tổng hợp dữ liệu thuộc module B, A gọi qua **service** của B (không đọc repository của B trực tiếp), và hướng phụ thuộc phải giữ một chiều — nếu B cũng cần dữ liệu của A thì A phải tự tính rồi truyền vào B qua tham số, tránh circular dependency (constructor injection của Spring sẽ fail nếu có cycle).
