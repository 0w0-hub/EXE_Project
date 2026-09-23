-- TASK-078: chia sẻ liên kết xem công khai (view-only) + bình luận xin ý kiến.
-- Bảng riêng `design_share` (không đụng schema design_jobs hiện có) — share_token là khoá tra cứu
-- công khai, KHÔNG dùng thẳng job_id làm khoá công khai để tránh lộ liên hệ trực tiếp tới ID nội bộ
-- khi chia sẻ ra ngoài hệ thống. UNIQUE(job_id) đảm bảo idempotent: mỗi job chỉ có tối đa 1 bản ghi
-- share (bật lại chỉ update enabled, không tạo mới).
CREATE TABLE design_share (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    job_id UNIQUEIDENTIFIER NOT NULL,
    share_token UNIQUEIDENTIFIER NOT NULL,
    enabled BIT NOT NULL DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT uq_design_share_job UNIQUE (job_id),
    CONSTRAINT uq_design_share_token UNIQUE (share_token),
    CONSTRAINT fk_design_share_job FOREIGN KEY (job_id) REFERENCES design_jobs(id)
);

CREATE TABLE design_comment (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    share_id UNIQUEIDENTIFIER NOT NULL,
    author_name NVARCHAR(100) NULL,
    message NVARCHAR(500) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT fk_design_comment_share FOREIGN KEY (share_id) REFERENCES design_share(id)
);
