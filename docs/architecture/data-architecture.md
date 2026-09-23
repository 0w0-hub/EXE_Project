# Data Architecture

## Nguyên tắc

- Metadata (user, room, design job, đường dẫn file) → SQL Server.
- File nhị phân (ảnh gốc, ảnh AI sinh ra) → filesystem/volume riêng (tương tự `uploads_data` volume ở dự án tham khảo), không lưu trong DB.

## Thực thể chính (mức khái niệm, chưa phải schema cuối)

Input đầy đủ và output đầy đủ tham chiếu tại [../project/requirements.md](../project/requirements.md).

- `User` — thông tin tài khoản.
- `Room` — 1 phòng của user: loại phòng, kích thước, gắn với 1+ ảnh gốc (`Asset`).
- `RoomPreference` — input sở thích của user cho 1 room: phong cách, màu sắc mong muốn, nội thất mong muốn, ngân sách, yêu cầu text tự do. Tách riêng khỏi `Room` vì 1 room có thể generate nhiều lần với preference khác nhau.
- `DesignJob` — 1 lần yêu cầu AI generation, gắn với `Room` + `RoomPreference`, có `status` (PENDING/PROCESSING/COMPLETED/FAILED).
- `DesignResult` — kết quả của 1 `DesignJob`, gồm:
  - mô tả phương án decor (text)
  - giải thích của AI (text)
  - chi phí dự kiến tổng (số)
  - ảnh/scene 3D toàn cảnh (`Asset`)
- `DesignFurnitureItem` — 1 item nội thất trong `DesignResult`: tên, loại, vị trí trong layout, chi phí ước tính của riêng item đó (cộng lại = chi phí tổng của `DesignResult`).
- `DesignColorPalette` — 1 hoặc nhiều màu áp dụng cho `DesignResult` (mã màu, vai trò: chủ đạo/phụ/nhấn).
- `Asset` — file vật lý (ảnh gốc hoặc ảnh 3D kết quả), có đường dẫn lưu trữ.
- `DesignTemplate` — mẫu preset (module `template`): category, roomType, style, preferredColors, desiredFurniture, suggestedBudget, description. Không liên kết trực tiếp tới `Room`/`RoomPreference` bằng FK — frontend đọc giá trị rồi điền vào form tạo room, không "áp dụng" qua API riêng.
- `Plan` — gói dịch vụ (module `billing`): code (`FREE`/`PRO`), name, generationLimit (NULL = không giới hạn).
- `Subscription` — gói hiện tại của 1 user (module `billing`): 1 user chỉ có 1 subscription tại một thời điểm (`UNIQUE(user_id)`), liên kết `Plan`.

Quan hệ tóm tắt: `Room 1—N DesignJob`, `DesignJob 1—1 DesignResult`, `DesignResult 1—N DesignFurnitureItem`, `DesignResult 1—N DesignColorPalette`, `User 1—1 Subscription`, `Subscription N—1 Plan`. `DesignTemplate` độc lập, không FK tới bảng khác.

Schema SQL chi tiết + migration: xem [../database/README.md](../database/README.md) — `V1__init.sql` (core: users/rooms/assets/design_*), `V2__design_templates_billing.sql` (design_templates/plans/subscriptions + seed data).

## Lưu ý usage tracking (module `billing`)

Không có bảng ledger riêng cho lượt sử dụng (khác với pattern `UsageRecord` ở dự án tham khảo). Số lượt đã dùng trong tháng = `COUNT(design_jobs) WHERE owner_id=? AND created_at >= đầu tháng hiện tại` — tính trực tiếp trong module `aidesign` (nơi sở hữu bảng `design_jobs`) rồi truyền số đã tính vào `BillingService`, không để `billing` tự query bảng của module khác — xem [../decisions/ADR-0004-billing-and-pagination.md](../decisions/ADR-0004-billing-and-pagination.md).
