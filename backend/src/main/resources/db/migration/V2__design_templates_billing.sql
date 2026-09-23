-- V2: Design templates (Templates feature) + billing (Plan/Subscription/usage-limit feature).
-- Admin panel feature needs no new tables — it reads existing users/rooms/design_jobs.
-- Xem docs/architecture/data-architecture.md.

CREATE TABLE design_templates (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    category NVARCHAR(100) NOT NULL,
    room_type NVARCHAR(100) NOT NULL,
    style NVARCHAR(255) NULL,
    preferred_colors NVARCHAR(255) NULL,
    desired_furniture NVARCHAR(500) NULL,
    suggested_budget BIGINT NULL,
    description NVARCHAR(2000) NULL,
    created_at DATETIMEOFFSET NOT NULL
);

CREATE TABLE plans (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    code NVARCHAR(20) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    generation_limit INT NULL,           -- NULL = không giới hạn
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT uq_plans_code UNIQUE (code)
);

CREATE TABLE subscriptions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT uq_subscriptions_user UNIQUE (user_id),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Seed plans
INSERT INTO plans (id, code, name, generation_limit, created_at) VALUES
    (NEWID(), 'FREE', N'Miễn phí', 5, SYSDATETIMEOFFSET()),
    (NEWID(), 'PRO',  N'Chuyên nghiệp', NULL, SYSDATETIMEOFFSET());

-- Backfill: gán gói FREE cho user đã tồn tại trước migration này
INSERT INTO subscriptions (id, user_id, plan_id, status, created_at, updated_at)
SELECT NEWID(), u.id, (SELECT TOP 1 id FROM plans WHERE code = 'FREE'), 'ACTIVE',
       SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id);

-- Seed design templates
INSERT INTO design_templates (id, category, room_type, style, preferred_colors, desired_furniture, suggested_budget, description, created_at) VALUES
    (NEWID(), N'Phòng khách', N'Phòng khách', N'Scandinavian', N'Trắng, xám, gỗ sáng', N'Sofa vải, bàn trà gỗ, kệ TV thấp', 25000000, N'Không gian tối giản, ánh sáng tự nhiên, tông màu trung tính.', SYSDATETIMEOFFSET()),
    (NEWID(), N'Phòng khách', N'Phòng khách', N'Industrial', N'Đen, nâu, xám bê tông', N'Sofa da, bàn trà kim loại, đèn thả', 30000000, N'Phong cách công nghiệp với vật liệu thô, kim loại và gỗ tối.', SYSDATETIMEOFFSET()),
    (NEWID(), N'Phòng ngủ', N'Phòng ngủ', N'Japandi', N'Trắng, beige, gỗ tự nhiên', N'Giường thấp, tủ đầu giường gỗ, đèn ngủ ánh sáng ấm', 20000000, N'Kết hợp tối giản Nhật Bản và ấm áp Scandinavian.', SYSDATETIMEOFFSET()),
    (NEWID(), N'Phòng ngủ', N'Phòng ngủ', N'Bohemian', N'Đất nung, cam, xanh rêu', N'Giường thấp, thảm dệt tay, đèn treo mây', 18000000, N'Không gian ấm áp, nhiều hoa văn và chất liệu tự nhiên.', SYSDATETIMEOFFSET()),
    (NEWID(), N'Phòng bếp', N'Phòng bếp', N'Modern Minimalist', N'Trắng, đen, xám', N'Tủ bếp không tay nắm, đảo bếp nhỏ, đèn thả LED', 35000000, N'Bếp hiện đại tối giản, tối ưu công năng.', SYSDATETIMEOFFSET()),
    (NEWID(), N'Phòng làm việc', N'Phòng làm việc', N'Minimalist', N'Trắng, xanh navy', N'Bàn làm việc gỗ, ghế ergonomic, kệ sách treo tường', 15000000, N'Không gian làm việc gọn gàng, tập trung.', SYSDATETIMEOFFSET());
