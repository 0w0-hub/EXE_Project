-- TASK-093: Design Duplicate/Snapshot (SQLite compatible)
ALTER TABLE design_jobs ADD COLUMN duplicated_from_job_id VARCHAR(36) NULL;
