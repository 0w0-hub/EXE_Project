-- Bảng lưu lịch sử đơn hàng thanh toán PayOS
CREATE TABLE payment_orders (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    plan_code   TEXT NOT NULL,
    billing     TEXT NOT NULL DEFAULT 'monthly',
    order_code  BIGINT UNIQUE NOT NULL,
    amount      INTEGER NOT NULL,
    status      TEXT NOT NULL DEFAULT 'PENDING',
    checkout_url TEXT,
    created_at  BIGINT NOT NULL,
    paid_at     BIGINT
);

CREATE INDEX idx_payment_orders_user_id    ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_code ON payment_orders(order_code);
CREATE INDEX idx_payment_orders_status     ON payment_orders(status);
