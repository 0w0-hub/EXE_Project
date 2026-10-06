-- V2: Design templates + billing (SQLite compatible)

CREATE TABLE design_templates (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    style VARCHAR(255) NULL,
    preferred_colors VARCHAR(255) NULL,
    desired_furniture VARCHAR(500) NULL,
    suggested_budget BIGINT NULL,
    description VARCHAR(2000) NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE plans (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    generation_limit INTEGER NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_plans_code UNIQUE (code)
);

CREATE TABLE subscriptions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_subscriptions_user UNIQUE (user_id),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Seed plans
INSERT INTO plans (id, code, name, generation_limit, created_at) VALUES
    ('11111111-1111-1111-1111-111111111101', 'FREE', 'Miễn phí', 5, unixepoch() * 1000),
    ('11111111-1111-1111-1111-111111111102', 'PRO',  'Chuyên nghiệp', NULL, unixepoch() * 1000);

-- Backfill: gán gói FREE cho user đã tồn tại trước migration này
INSERT INTO subscriptions (id, user_id, plan_id, status, created_at, updated_at)
SELECT
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-a' || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
    u.id,
    (SELECT id FROM plans WHERE code = 'FREE' LIMIT 1),
    'ACTIVE',
    unixepoch() * 1000,
    unixepoch() * 1000
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id);

-- Seed design templates
INSERT INTO design_templates (id, category, room_type, style, preferred_colors, desired_furniture, suggested_budget, description, created_at) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Phòng khách', 'Phòng khách', 'Scandinavian', 'Trắng, xám, gỗ sáng', 'Sofa vải, bàn trà gỗ, kệ TV thấp', 25000000, 'Không gian tối giản, ánh sáng tự nhiên, tông màu trung tính.', unixepoch() * 1000),
    ('22222222-2222-2222-2222-222222222202', 'Phòng khách', 'Phòng khách', 'Industrial', 'Đen, nâu, xám bê tông', 'Sofa da, bàn trà kim loại, đèn thả', 30000000, 'Phong cách công nghiệp với vật liệu thô, kim loại và gỗ tối.', unixepoch() * 1000),
    ('22222222-2222-2222-2222-222222222203', 'Phòng ngủ', 'Phòng ngủ', 'Japandi', 'Trắng, beige, gỗ tự nhiên', 'Giường thấp, tủ đầu giường gỗ, đèn ngủ ánh sáng ấm', 20000000, 'Kết hợp tối giản Nhật Bản và ấm áp Scandinavian.', unixepoch() * 1000),
    ('22222222-2222-2222-2222-222222222204', 'Phòng ngủ', 'Phòng ngủ', 'Bohemian', 'Đất nung, cam, xanh rêu', 'Giường thấp, thảm dệt tay, đèn treo mây', 18000000, 'Không gian ấm áp, nhiều hoa văn và chất liệu tự nhiên.', unixepoch() * 1000),
    ('22222222-2222-2222-2222-222222222205', 'Phòng bếp', 'Phòng bếp', 'Modern Minimalist', 'Trắng, đen, xám', 'Tủ bếp không tay nắm, đảo bếp nhỏ, đèn thả LED', 35000000, 'Bếp hiện đại tối giản, tối ưu công năng.', unixepoch() * 1000),
    ('22222222-2222-2222-2222-222222222206', 'Phòng làm việc', 'Phòng làm việc', 'Minimalist', 'Trắng, xanh navy', 'Bàn làm việc gỗ, ghế ergonomic, kệ sách treo tường', 15000000, 'Không gian làm việc gọn gàng, tập trung.', unixepoch() * 1000);
