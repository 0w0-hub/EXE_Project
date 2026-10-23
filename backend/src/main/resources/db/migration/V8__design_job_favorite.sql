-- TASK-103: đánh dấu thiết kế yêu thích (PostgreSQL compatible)
ALTER TABLE design_jobs ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
