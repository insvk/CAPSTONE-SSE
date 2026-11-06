-- ==============================================================================
-- CSA0201-B-CAPSTONE-IMBS Initial Seed Data
-- Version: 001_initial_seed.sql
-- ==============================================================================

-- 1. Organization
INSERT INTO organizations (id, code, name, legal_name, tax_identifier, currency_code, time_zone)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'APEX-CORP',
    'Apex Industrial & Retail Systems Ltd.',
    'Apex Industrial & Retail Systems Private Limited',
    '33AAAAA0000A1Z5',
    'INR',
    'Asia/Kolkata'
) ON CONFLICT (code) DO NOTHING;

-- 2. Branches
INSERT INTO branches (id, organization_id, code, name, state_code, address_line1, city, postal_code, is_headquarters)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'BR-HQ-01',
    'Metro Main Branch & HQ',
    '33',
    '108 Industrial Expressway, Tech Corridor',
    'Chennai',
    '600001',
    true
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'BR-RETAIL-02',
    'South Urban Retail Hub',
    '33',
    '45 Commercial Boulevard, Gandhi Nagar',
    'Chennai',
    '600020',
    false
) ON CONFLICT DO NOTHING;

-- 3. Warehouses
INSERT INTO warehouses (id, organization_id, branch_id, code, name, warehouse_type)
VALUES
(
    'w0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'WH-CENTRAL',
    'Central Distribution Warehouse',
    'STANDARD'
),
(
    'w0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'WH-RETAIL-FLOOR',
    'Retail Store Shelf & Quick Storage',
    'RETAIL_STORE'
) ON CONFLICT DO NOTHING;

-- 4. Roles
INSERT INTO roles (id, code, name, description, is_system)
VALUES
('r0000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Super Administrator', 'Full system access', true),
('r0000000-0000-0000-0000-000000000002', 'INVENTORY_MANAGER', 'Inventory Manager', 'Manages products and stock', true),
('r0000000-0000-0000-0000-000000000003', 'CASHIER', 'POS Cashier & Billing Operator', 'POS and billing operations', true),
('r0000000-0000-0000-0000-000000000004', 'ACCOUNTANT', 'Senior Accountant', 'Accounting, ledgers, and journals', true)
ON CONFLICT (code) DO NOTHING;

-- 5. User Profiles (Password is bcrypt or simulated hash)
INSERT INTO user_profiles (id, organization_id, email, password_hash, full_name)
VALUES
(
    'u0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin@apexcorp.com',
    '$2a$12$e8YJqfIu.Wb8vOq3Gk5V1e8tZ4hP8Y1jP7oO2V7Y.k8H9y6J1o2G6', -- "Admin@123"
    'Paweł Kuna'
),
(
    'u0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'cashier@apexcorp.com',
    '$2a$12$e8YJqfIu.Wb8vOq3Gk5V1e8tZ4hP8Y1jP7oO2V7Y.k8H9y6J1o2G6',
    'Sara Jenkins'
) ON CONFLICT (email) DO NOTHING;

-- Assign Roles
INSERT INTO user_role_assignments (user_id, role_id)
VALUES
('u0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001'),
('u0000000-0000-0000-0000-000000000002', 'r0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- 6. Units of Measure
INSERT INTO units_of_measure (id, organization_id, code, name, is_fractional, precision)
VALUES
('uom00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PCS', 'Pieces', false, 0),
('uom00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'KG', 'Kilograms', true, 3),
('uom00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BOX', 'Box (12 pcs)', false, 0)
ON CONFLICT DO NOTHING;

-- 7. Product Categories
INSERT INTO product_categories (id, organization_id, code, name, description)
VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ELEC', 'Electronics & Hardware', 'High-end electrical components and gear'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'OFFICE', 'Office Supplies & Automation', 'Paper, stationery, and computing accessories'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'PACK', 'Packaging Materials', 'Heavy duty shipping boxes and wraps')
ON CONFLICT DO NOTHING;

-- 8. Products
INSERT INTO products (id, organization_id, category_id, uom_id, sku, barcode, name, description, hsn_code, purchase_price_cents, selling_price_cents, tax_rate_percent, reorder_point, preferred_reorder_qty)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'uom00000-0000-0000-0000-000000000001',
    'SKU-IND-SCAN-01',
    '8901234567890',
    'Apex Pro High-Speed Barcode Scanner 2D',
    'Ergonomic industrial handheld USB/Wireless barcode scanner with shock protection.',
    '8471',
    420000, -- 4,200.00
    650000, -- 6,500.00
    18.00,
    15,
    50
),
(
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'uom00000-0000-0000-0000-000000000001',
    'SKU-THERM-PRN-80',
    '8901234567891',
    'Apex 80mm High-Speed Thermal Receipt Printer',
    'Heavy-duty POS thermal printer with auto-cutter and Ethernet/USB interface.',
    '8443',
    680000, -- 6,800.00
    990000, -- 9,900.00
    18.00,
    10,
    30
),
(
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'uom00000-0000-0000-0000-000000000003',
    'SKU-ROLL-TH-BOX',
    '8901234567892',
    'Thermal Paper Rolls 80x80mm (Box of 50)',
    'Premium BPA-free ultra-white high-contrast thermal receipt paper rolls.',
    '4811',
    180000, -- 1,800.00
    250000, -- 2,500.00
    12.00,
    25,
    100
),
(
    'p0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'uom00000-0000-0000-0000-000000000001',
    'SKU-CASH-DRW-5B',
    '8901234567893',
    'Heavy Duty Metal POS Cash Drawer 5B/8C',
    'Reinforced steel body, dual media slots, RJ11 auto-kick solenoid.',
    '8303',
    310000, -- 3,100.00
    450000, -- 4,500.00
    18.00,
    8,
    20
) ON CONFLICT (organization_id, sku) DO NOTHING;

-- 9. Inventory Balances
INSERT INTO inventory_balances (organization_id, warehouse_id, product_id, on_hand_quantity, reserved_quantity, average_cost_cents)
VALUES
('a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 145, 10, 420000),
('a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 82, 4, 680000),
('a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 320, 15, 180000),
('a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000004', 38, 2, 310000),
-- Retail floor warehouse
('a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 25, 0, 420000),
('a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000003', 45, 0, 180000)
ON CONFLICT (warehouse_id, product_id) DO NOTHING;

-- 10. Suppliers
INSERT INTO suppliers (id, organization_id, code, company_name, contact_person, tax_identifier, phone, email, city, outstanding_payable_cents)
VALUES
(
    's0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-LOGIC-01',
    'LogiTech Electronics Supplies India Ltd.',
    'Ramesh Nair',
    '33AABCL1234F1Z8',
    '+91 98401 23456',
    'procurement@logitechel.in',
    'Chennai',
    14500000 -- ₹1,45,000.00
),
(
    's0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-PAPER-02',
    'National Paper & Roll Mills Co.',
    'Vikram Mehta',
    '27AABCN9876Q1Z2',
    '+91 98200 98765',
    'sales@nationalpaper.com',
    'Mumbai',
    4200000 -- ₹42,000.00
) ON CONFLICT DO NOTHING;

-- 11. Customers
INSERT INTO customers (id, organization_id, code, name, tax_identifier, phone, email, city, credit_limit_cents, outstanding_receivable_cents)
VALUES
(
    'cust0000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'CUST-HYPER-01',
    'HyperMarket Retail Ventures India',
    '33AAACH5678K1ZQ',
    '+91 99400 11223',
    'billing@hypermarketindia.com',
    'Chennai',
    50000000, -- ₹5,00,000.00
    8450000  -- ₹84,500.00
),
(
    'cust0000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'CUST-WALK-IN',
    'Walk-in Retail Customer',
    NULL,
    '+91 90000 00000',
    'cashier@apexcorp.com',
    'Chennai',
    0,
    0
) ON CONFLICT DO NOTHING;

-- 12. Chart of Accounts
INSERT INTO chart_of_accounts (id, organization_id, account_code, account_name, account_type)
VALUES
('coa00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '1010', 'Cash on Hand', 'ASSET'),
('coa00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '1020', 'Operating Bank Account', 'ASSET'),
('coa00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '1200', 'Accounts Receivable (Debtors)', 'ASSET'),
('coa00000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '1300', 'Merchandise Inventory Asset', 'ASSET'),
('coa00000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '2010', 'Accounts Payable (Creditors)', 'LIABILITY'),
('coa00000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '2210', 'CGST Payable', 'LIABILITY'),
('coa00000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '2220', 'SGST Payable', 'LIABILITY'),
('coa00000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '4010', 'Merchandise Sales Revenue', 'REVENUE'),
('coa00000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '5010', 'Cost of Goods Sold (COGS)', 'EXPENSE')
ON CONFLICT DO NOTHING;

-- 13. Notifications
INSERT INTO notifications (organization_id, user_id, title, message, notification_type)
VALUES
('a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'Welcome back, Paweł', 'System operational. 5 new messages and 2 new audit notifications pending.', 'INFO'),
('a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'Low Stock Alert', 'Cash Drawer 5B/8C is below safety threshold (8 units remaining).', 'WARNING')
ON CONFLICT DO NOTHING;

