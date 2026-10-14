-- Membership pricing is stored in VND. yearly_price is the monthly equivalent
-- for an annual subscription (the UI bills yearly_price * 12 at checkout).
ALTER TABLE plans ADD COLUMN monthly_price BIGINT NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN yearly_price BIGINT NOT NULL DEFAULT 0;

-- Keep existing subscriptions attached to their existing plan row while
-- renaming the former PRO plan to Studio.
UPDATE plans
SET code = 'STUDIO', name = 'Studio', monthly_price = 79000, yearly_price = 59000
WHERE code = 'PRO';

UPDATE plans
SET name = 'Miễn phí', generation_limit = 3, monthly_price = 0, yearly_price = 0
WHERE code = 'FREE';

INSERT INTO plans (id, code, name, generation_limit, created_at, monthly_price, yearly_price)
SELECT '11111111-1111-1111-1111-111111111103', 'PLUS', 'Plus', 30,
       unixepoch() * 1000, 49000, 29000
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE code = 'PLUS');
