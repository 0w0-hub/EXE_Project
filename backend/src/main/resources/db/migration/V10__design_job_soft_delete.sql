-- TASK-107: Thùng rác cho DesignJob (SQLite compatible)
ALTER TABLE design_jobs ADD COLUMN deleted_at TIMESTAMP NULL;
