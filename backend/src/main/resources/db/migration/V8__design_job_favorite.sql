-- TASK-103: đánh dấu thiết kế yêu thích (SQLite compatible)
ALTER TABLE design_jobs ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
