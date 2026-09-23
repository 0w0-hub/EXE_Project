-- TASK-107: Thùng rác (Trash / Soft Delete & Restore) cho DesignJob. NULL = job còn hoạt động bình
-- thường (mọi view thường của user tự loại trừ deleted_at IS NOT NULL, xem DesignJobRepository),
-- có giá trị = thời điểm xoá mềm — dùng để liệt kê GET /api/v1/designs/trash (sắp theo cột này
-- giảm dần) và cho phép khôi phục (set lại NULL).
-- Kiểu DATETIMEOFFSET (không phải DATETIME2) để khớp đúng convention hiện có của mọi cột Instant
-- khác trên bảng này (created_at/updated_at, xem V1__init.sql) — tránh lệch kiểu timezone-aware.
-- Admin Data Explorer (TASK-104)/AdminDesignController KHÔNG lọc theo cột này — admin cần thấy cả
-- job đã xoá mềm để tra cứu (xem tasks/active/TASK-107-trash-soft-delete.md, mục Scope).
ALTER TABLE design_jobs ADD deleted_at DATETIMEOFFSET NULL;
