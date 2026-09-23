-- TASK-097: hàng đợi kiểm duyệt hậu kiểm cho design_share (Admin Content Moderation Queue).
-- Quyết định thiết kế (xem tasks/completed/TASK-097-admin-moderation-queue.md, mục Goal): chia sẻ
-- MỚI vẫn hoạt động NGAY LẬP TỨC (default 'APPROVED', không phá hành vi TASK-078 hiện có/dữ liệu
-- cũ) — admin chỉ có thể ẩn (REJECTED) 1 chia sẻ đã có SAU KHI nó đã công khai, không phải duyệt
-- trước khi công khai. Cột NOT NULL DEFAULT 'APPROVED' để backfill mọi row cũ về đúng trạng thái
-- "đang hoạt động bình thường" mà không cần UPDATE riêng.
ALTER TABLE design_share
    ADD moderation_status NVARCHAR(20) NOT NULL CONSTRAINT df_design_share_moderation_status DEFAULT 'APPROVED';
