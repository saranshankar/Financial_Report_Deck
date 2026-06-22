-- PostgreSQL Schema for FinSight AI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cashback Rules Table
CREATE TABLE IF NOT EXISTS cashback_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_name VARCHAR(100) NOT NULL,
    merchant_pattern VARCHAR(255) DEFAULT '*',
    category_pattern VARCHAR(255) DEFAULT '*',
    cashback_percentage NUMERIC(5, 2) NOT NULL,
    max_limit NUMERIC(12, 2),
    min_transaction_amount NUMERIC(12, 2) DEFAULT 0.0,
    conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL, -- DEBIT / CREDIT
    category VARCHAR(50) NOT NULL, -- Food, Travel, Shopping, Bills, Healthcare, Education, Entertainment, Investments, Others
    payment_method VARCHAR(100) NOT NULL,
    cashback_earned NUMERIC(12, 2) DEFAULT 0.0,
    potential_cashback NUMERIC(12, 2) DEFAULT 0.0,
    best_payment_method VARCHAR(100),
    status VARCHAR(20) DEFAULT 'CLEARED', -- CLEARED, PENDING, RECONCILED
    source VARCHAR(20) DEFAULT 'MANUAL', -- MANUAL, CSV, PDF, SMS, OCR
    source_file VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    original_terms TEXT NOT NULL,
    simplified_explanation TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- SAVINGS, CASHBACK, EXPENSE_WARNING
    impact_amount NUMERIC(12, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insights Table
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM
    total_spending NUMERIC(12, 2) NOT NULL,
    total_cashback NUMERIC(12, 2) NOT NULL,
    top_category VARCHAR(50) NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation Logs Table
CREATE TABLE IF NOT EXISTS reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    issue_type VARCHAR(50) NOT NULL, -- DUPLICATE, MISSING_RECORD, MISMATCHED_AMOUNT
    details TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEED MOCK DATA

-- 1. Insert Demo User (UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11, Password: password123)
INSERT INTO users (id, email, hashed_password, full_name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'demo@finsight.ai', '$2b$12$45088svkpAhomL0ynXavSOBjvYaYS9jg5/GgH2awhZj0oTKJxiNtq', 'Demo FinSight User')
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Cashback Rules
INSERT INTO cashback_rules (id, card_name, merchant_pattern, category_pattern, cashback_percentage, max_limit, min_transaction_amount, conditions) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'Amazon Pay ICICI', 'Amazon', '*', 5.00, NULL, 0.00, '5% cashback for Amazon Prime members on Amazon purchases.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'Amazon Pay ICICI', '*', '*', 1.00, NULL, 0.00, '1% flat cashback on other purchases.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'Axis Ace', '*', 'Bills', 5.00, 500.00, 0.00, '5% cashback on utility bills (electricity, internet, gas) paid via Google Pay.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380004', 'Axis Ace', '*', '*', 2.00, NULL, 0.00, '2% flat cashback on all other transactions.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'SBI Cashback', '*', 'Shopping', 5.00, 5000.00, 0.00, '5% cashback on online shopping.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380006', 'SBI Cashback', '*', '*', 1.00, NULL, 0.00, '1% cashback on offline spends.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380007', 'Flipkart Axis', 'Flipkart', '*', 5.00, NULL, 0.00, '5% cashback on Flipkart purchases.'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380008', 'Flipkart Axis', 'Myntra', '*', 4.00, NULL, 0.00, '4% cashback on Myntra purchases.');

-- 3. Seed Transactions
INSERT INTO transactions (id, user_id, date, merchant, amount, type, category, payment_method, cashback_earned, potential_cashback, best_payment_method, status, source) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-01 12:30:00+05:30', 'Amazon', 15000.00, 'DEBIT', 'Shopping', 'SBI Cashback', 750.00, 750.00, 'SBI Cashback', 'CLEARED', 'CSV'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-02 18:45:00+05:30', 'Zomato', 1200.00, 'DEBIT', 'Food', 'UPI', 0.00, 24.00, 'Axis Ace', 'CLEARED', 'SMS'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-05 10:15:00+05:30', 'Uber', 450.00, 'DEBIT', 'Travel', 'Amazon Pay ICICI', 4.50, 9.00, 'Axis Ace', 'CLEARED', 'SMS'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-10 20:00:00+05:30', 'Netflix', 799.00, 'DEBIT', 'Entertainment', 'Axis Ace', 15.98, 39.95, 'SBI Cashback', 'CLEARED', 'PDF'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-12 11:00:00+05:30', 'Electricity Bill', 3500.00, 'DEBIT', 'Bills', 'Axis Ace', 175.00, 175.00, 'Axis Ace', 'CLEARED', 'PDF'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-15 09:30:00+05:30', 'Apollo Pharmacy', 850.00, 'DEBIT', 'Healthcare', 'UPI', 0.00, 17.00, 'Axis Ace', 'CLEARED', 'SMS'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-18 15:00:00+05:30', 'Flipkart', 5000.00, 'DEBIT', 'Shopping', 'Flipkart Axis', 250.00, 250.00, 'Flipkart Axis', 'CLEARED', 'CSV'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-19 19:30:00+05:30', 'Starbucks', 350.00, 'DEBIT', 'Food', 'UPI', 0.00, 7.00, 'Axis Ace', 'CLEARED', 'SMS'),
-- Add duplicates for reconciliation demo
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06-19 19:31:00+05:30', 'Starbucks', 350.00, 'DEBIT', 'Food', 'UPI', 0.00, 7.00, 'Axis Ace', 'PENDING', 'SMS');

-- 4. Seed Offers
INSERT INTO offers (id, title, merchant, original_terms, simplified_explanation, status, expires_at) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'Amazon Prime Day Cashback', 'Amazon', 'Get 10% cashback up to ₹200 on transactions above ₹999.', 'Spend at least ₹999 on Amazon and receive 10% cashback, capped at a maximum of ₹200.', 'ACTIVE', '2026-07-31 23:59:59+05:30'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'Axis Ace Bill Pay Promo', 'Google Pay', 'Earn flat 5% cashback on utility payments (Electricity, Water, Gas) when paid using Axis Ace Card, minimum transaction value ₹500. Maximum cashback ₹250 per billing cycle.', 'Pay a utility bill of at least ₹500 via Google Pay using Axis Ace Card to get 5% cashback (capped at ₹250).', 'ACTIVE', '2026-08-31 23:59:59+05:30'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'Swiggy HDFC Special Offer', 'Swiggy', 'Enjoy 10% instant discount up to ₹100 on orders of ₹499 and above. Valid twice per user per month using HDFC Credit Cards.', 'Get 10% off (up to ₹100) on Swiggy for orders above ₹499 when paying with an HDFC Credit Card. Can be used 2 times a month.', 'ACTIVE', '2026-07-15 23:59:59+05:30');

-- 5. Seed Recommendations
INSERT INTO recommendations (id, user_id, title, message, recommendation_type, impact_amount) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Card Recommendation for Zomato', 'You spent ₹1,200 on Zomato this month using UPI, earning ₹0 cashback. If you used your Axis Ace card, you would have earned ₹24 extra cashback (2% rate).', 'CASHBACK', 24.00),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Unusual Spending Warning', 'Your Shopping expenses are 45% higher than your average monthly shopping spend. This was mostly due to your ₹15,000 purchase on Amazon.', 'EXPENSE_WARNING', 0.00),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Utility Bill Savings Success', 'Excellent work! You paid your electricity bill of ₹3,500 using Axis Ace, maximizing your cashback at 5% (₹175 earned).', 'SAVINGS', 175.00);

-- 6. Seed Insights
INSERT INTO insights (id, user_id, month, total_spending, total_cashback, top_category, summary) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-06', 27298.00, 1195.48, 'Shopping', 'You spent mostly on Shopping this month (₹20,000), driven by purchases on Amazon and Flipkart. Your overall cashback rate was 4.38%, which is excellent. However, you missed out on ₹53.47 of additional cashback by using UPI/Debit instead of Axis Ace or SBI Cashback for food/travel. Switching to the recommended cards would save you more.');

-- 7. Seed Reconciliation Logs
INSERT INTO reconciliation_logs (id, user_id, transaction_id, issue_type, details, resolved) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380009', 'DUPLICATE', 'Duplicate transaction identified: Two debits of ₹350.00 to Starbucks within 1 minute (19:30:00 vs 19:31:00).', FALSE);
