-- Migration: Add user profile fields and orders table

ALTER TABLE users ADD COLUMN name TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN phone TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN address TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    shipping_address TEXT NOT NULL,
    phone TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    status TEXT DEFAULT 'Order confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
