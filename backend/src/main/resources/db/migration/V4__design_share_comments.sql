-- TASK-078: chia sẻ liên kết xem công khai + bình luận (SQLite compatible)

CREATE TABLE design_share (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL,
    share_token VARCHAR(36) NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_design_share_job UNIQUE (job_id),
    CONSTRAINT uq_design_share_token UNIQUE (share_token),
    CONSTRAINT fk_design_share_job FOREIGN KEY (job_id) REFERENCES design_jobs(id)
);

CREATE TABLE design_comment (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    share_id VARCHAR(36) NOT NULL,
    author_name VARCHAR(100) NULL,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_design_comment_share FOREIGN KEY (share_id) REFERENCES design_share(id)
);
