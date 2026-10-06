-- Homely initial schema (SQLite compatible)

CREATE TABLE users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE assets (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NULL,
    storage_path VARCHAR(500) NOT NULL,
    asset_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_assets_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE rooms (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    room_type VARCHAR(100) NULL,
    width_meters REAL NULL,
    length_meters REAL NULL,
    photo_asset_id VARCHAR(36) NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_rooms_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_rooms_photo_asset FOREIGN KEY (photo_asset_id) REFERENCES assets(id)
);

CREATE TABLE room_preferences (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    style VARCHAR(500) NULL,
    preferred_colors VARCHAR(500) NULL,
    desired_furniture VARCHAR(1000) NULL,
    budget BIGINT NULL,
    free_text_request VARCHAR(2000) NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_preferences_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE design_jobs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    preference_id VARCHAR(36) NULL,
    owner_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_jobs_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_jobs_preference FOREIGN KEY (preference_id) REFERENCES room_preferences(id),
    CONSTRAINT fk_jobs_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE design_results (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL,
    decor_description VARCHAR(2000) NULL,
    ai_explanation VARCHAR(2000) NULL,
    estimated_cost BIGINT NULL,
    layout_description VARCHAR(2000) NULL,
    result_asset_id VARCHAR(36) NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_results_job UNIQUE (job_id),
    CONSTRAINT fk_results_job FOREIGN KEY (job_id) REFERENCES design_jobs(id),
    CONSTRAINT fk_results_asset FOREIGN KEY (result_asset_id) REFERENCES assets(id)
);

CREATE TABLE design_furniture_items (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NULL,
    position VARCHAR(255) NULL,
    estimated_cost BIGINT NULL,
    CONSTRAINT fk_furniture_result FOREIGN KEY (result_id) REFERENCES design_results(id)
);

CREATE TABLE design_color_palettes (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    role VARCHAR(20) NULL,
    CONSTRAINT fk_colors_result FOREIGN KEY (result_id) REFERENCES design_results(id)
);
