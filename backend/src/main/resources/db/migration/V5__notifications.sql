-- TASK-082: Notification Center (SQLite compatible)

CREATE TABLE notification (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    job_id VARCHAR(36) NOT NULL,
    type VARCHAR(30) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX ix_notification_user_created ON notification (user_id, created_at DESC);
