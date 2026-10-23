-- TASK-106: tên riêng do user tự đặt cho thiết kế (SQLite compatible)
ALTER TABLE design_jobs ADD COLUMN custom_name VARCHAR(200) NULL;
