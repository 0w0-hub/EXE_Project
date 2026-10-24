# Service Boundaries

- Giai đoạn hiện tại: **Modular Monolith** (xem ADR-0002). Không tạo microservices tách rời khi chưa có nhu cầu scale thực tế.
- Ranh giới module bắt buộc theo domain, không theo kỹ thuật:
  - `auth` — xác thực & phân quyền
  - `user` — hồ sơ người dùng
  - `room` — dữ liệu phòng, ảnh phòng, mô tả yêu cầu
  - `ai-design` (`aidesign`) — điều phối gọi AI phân tích & sinh phương án thiết kế
  - `asset` — lưu trữ file (ảnh gốc, ảnh AI sinh ra)
  - `billing` — Plan/Subscription, giới hạn lượt tạo theo tháng
  - `template` — mẫu thiết kế preset
  - `admin` — dashboard/users/designs cho vai trò ADMIN
- Module không được truy cập trực tiếp DB của module khác — phải qua service interface trong cùng codebase.
- Khi một module đủ độc lập về data + tải + team ownership, mới xét tách thành service riêng (ghi ADR mới).

## Tránh circular dependency khi tổng hợp dữ liệu chéo module

Khi module A cần dữ liệu do module B sở hữu để tổng hợp/kiểm tra (ví dụ: `billing` cần biết user đã tạo bao nhiêu `design_jobs` trong tháng để kiểm tra giới hạn, nhưng `design_jobs` thuộc `aidesign`), **không** để B gọi ngược lại A nếu A cũng đang gọi B — điều đó tạo circular constructor injection mà Spring không khởi động được.

**Cách làm đúng:** giữ hướng phụ thuộc một chiều. Module đang sở hữu dữ liệu cần tổng hợp (ở ví dụ trên là `aidesign`, vì nó sở hữu `design_jobs`) tự tính giá trị cần thiết (ví dụ: `countJobsSince(ownerId, since)`) rồi **truyền số đã tính** vào method của module kia (`billingService.checkUsageLimit(ownerId, used)`). Module kia (`billing`) không bao giờ tự query bảng của module gọi nó.

Áp dụng tương tự cho `admin` (tổng hợp dashboard): `admin → {user, room, aidesign}` một chiều, không có module nào gọi ngược lại `admin`.
