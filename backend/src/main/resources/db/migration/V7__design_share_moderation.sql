-- TASK-097: hàng đợi kiểm duyệt cho design_share (SQLite compatible)
ALTER TABLE design_share ADD COLUMN moderation_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
