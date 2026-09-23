-- Homely initial schema
-- Xem docs/architecture/data-architecture.md cho mô tả entity đầy đủ.

CREATE TABLE users (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE assets (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    owner_id UNIQUEIDENTIFIER NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    content_type NVARCHAR(100) NULL,
    storage_path NVARCHAR(500) NOT NULL,
    asset_type NVARCHAR(30) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT fk_assets_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE rooms (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    owner_id UNIQUEIDENTIFIER NOT NULL,
    room_type NVARCHAR(100) NULL,
    width_meters FLOAT NULL,
    length_meters FLOAT NULL,
    photo_asset_id UNIQUEIDENTIFIER NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT fk_rooms_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_rooms_photo_asset FOREIGN KEY (photo_asset_id) REFERENCES assets(id)
);

CREATE TABLE room_preferences (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    room_id UNIQUEIDENTIFIER NOT NULL,
    style NVARCHAR(500) NULL,
    preferred_colors NVARCHAR(500) NULL,
    desired_furniture NVARCHAR(1000) NULL,
    budget BIGINT NULL,
    free_text_request NVARCHAR(2000) NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT fk_preferences_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE design_jobs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    room_id UNIQUEIDENTIFIER NOT NULL,
    preference_id UNIQUEIDENTIFIER NULL,
    owner_id UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message NVARCHAR(1000) NULL,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT fk_jobs_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_jobs_preference FOREIGN KEY (preference_id) REFERENCES room_preferences(id),
    CONSTRAINT fk_jobs_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE design_results (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    job_id UNIQUEIDENTIFIER NOT NULL,
    decor_description NVARCHAR(2000) NULL,
    ai_explanation NVARCHAR(2000) NULL,
    estimated_cost BIGINT NULL,
    layout_description NVARCHAR(2000) NULL,
    result_asset_id UNIQUEIDENTIFIER NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT uq_results_job UNIQUE (job_id),
    CONSTRAINT fk_results_job FOREIGN KEY (job_id) REFERENCES design_jobs(id),
    CONSTRAINT fk_results_asset FOREIGN KEY (result_asset_id) REFERENCES assets(id)
);

CREATE TABLE design_furniture_items (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    result_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    category NVARCHAR(100) NULL,
    [position] NVARCHAR(255) NULL,
    estimated_cost BIGINT NULL,
    CONSTRAINT fk_furniture_result FOREIGN KEY (result_id) REFERENCES design_results(id)
);

CREATE TABLE design_color_palettes (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    result_id UNIQUEIDENTIFIER NOT NULL,
    color_hex NVARCHAR(7) NOT NULL,
    role NVARCHAR(20) NULL,
    CONSTRAINT fk_colors_result FOREIGN KEY (result_id) REFERENCES design_results(id)
);
