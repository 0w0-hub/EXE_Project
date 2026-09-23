-- TASK-093: Design Duplicate/Snapshot — nhân bản job COMPLETED thành job mới độc lập.
-- duplicated_from_job_id đánh dấu job này là bản sao (không phải generate AI thật) để
-- DesignService.countJobsSince loại trừ khỏi số lượt tính vào giới hạn gói (usage limit).
-- NULL = job generate thật (mặc định, các job hiện có không đổi).
ALTER TABLE design_jobs ADD duplicated_from_job_id UNIQUEIDENTIFIER NULL;

ALTER TABLE design_jobs
    ADD CONSTRAINT fk_jobs_duplicated_from FOREIGN KEY (duplicated_from_job_id) REFERENCES design_jobs(id);
