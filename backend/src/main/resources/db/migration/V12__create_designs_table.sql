-- Homely V12: Table for saving 3D Decor Studio designs as JSON
CREATE TABLE designs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NULL,
    data TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_designs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_designs_user ON designs(user_id);
