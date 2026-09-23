-- TASK-082: Notification Center — báo khi design job COMPLETED/FAILED.
-- job_id KHÔNG có FK cứng tới design_jobs: bảng notification phải sống sót dù job gốc có bị dọn dẹp
-- sau này (lịch sử thông báo không nên biến mất theo dữ liệu job), job_id chỉ dùng để điều hướng.
CREATE TABLE notification (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL,
    job_id UNIQUEIDENTIFIER NOT NULL,
    type NVARCHAR(30) NOT NULL,
    message NVARCHAR(255) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX ix_notification_user_created ON notification (user_id, created_at DESC);
