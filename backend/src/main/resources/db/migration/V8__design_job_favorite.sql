-- TASK-103: đánh dấu thiết kế yêu thích (Favorites / Starred Designs) trên design_jobs — mỗi lần
-- generate là 1 bản ghi riêng nên favorite gắn vào từng DesignJob, không gắn vào Room (xem Out of
-- scope TASK-103). Cột NOT NULL DEFAULT 0 để backfill mọi row cũ về "chưa yêu thích" mà không cần
-- UPDATE riêng, giữ đúng hành vi hiện có (filter favoriteOnly=false trả về y như trước khi có cột này).
ALTER TABLE design_jobs
    ADD is_favorite BIT NOT NULL CONSTRAINT df_design_jobs_is_favorite DEFAULT 0;
