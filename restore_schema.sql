-- Drop all wrong tables
DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_lines CASCADE;
DROP TABLE IF EXISTS invoices_to_email CASCADE;
DROP TABLE IF EXISTS accounts_receivable CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS route_pricing CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS customer_credit CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- customers
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  customer_type VARCHAR(20) DEFAULT 'individual',
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- routes
CREATE TABLE routes (
  route_id SERIAL PRIMARY KEY,
  route_name VARCHAR(255) NOT NULL,
  origin_label VARCHAR(255),
  destination_label VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- route_pricing
CREATE TABLE route_pricing (
  pricing_id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(route_id),
  weekly_price DECIMAL(10,2),
  monthly_price DECIMAL(10,2),
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- subscriptions
CREATE TABLE subscriptions (
  subscription_id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(route_id),
  customer_id INTEGER REFERENCES customers(customer_id),
  seats INTEGER DEFAULT 1,
  billing_period VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE,
  next_period_start DATE,
  price_override DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- invoices
CREATE TABLE invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50),
  subscription_id INTEGER REFERENCES subscriptions(subscription_id),
  customer_id INTEGER REFERENCES customers(customer_id),
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  period_start DATE,
  period_end DATE,
  email_status VARCHAR(20),
  payfast_reference VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- invoice_lines
CREATE TABLE invoice_lines (
  invoice_line_id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(invoice_id),
  description TEXT,
  qty INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- accounts_receivable
CREATE TABLE accounts_receivable (
  ar_id SERIAL PRIMARY KEY,
  subscription_id INTEGER,
  invoice_id INTEGER,
  invoice_number VARCHAR(50),
  customer_id INTEGER,
  customer_name VARCHAR(255),
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance_amount DECIMAL(10,2) DEFAULT 0,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payments
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  payment_reference VARCHAR(100),
  payment_date DATE,
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payment_allocations
CREATE TABLE payment_allocations (
  allocation_id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(payment_id),
  invoice_id INTEGER,
  allocated_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- customer_credit
CREATE TABLE customer_credit (
  credit_id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  display_name VARCHAR(255),
  email VARCHAR(255),
  credit_balance DECIMAL(10,2) DEFAULT 0
);

-- invoices_to_email (view-like table)
CREATE TABLE invoices_to_email (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER,
  total_amount DECIMAL(10,2),
  balance_amount DECIMAL(10,2),
  period_start DATE
);
