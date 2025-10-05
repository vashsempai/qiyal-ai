-- Create ENUM types for Payment Module
CREATE TYPE payment_status AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM('stripe', 'card', 'bank_transfer', 'balance', 'crypto');
CREATE TYPE transaction_type AS ENUM('deposit', 'withdrawal', 'payment', 'refund', 'commission', 'bonus');

-- Payments Table
-- Note: The spec references a 'contracts' table which is not defined yet.
-- The foreign key will be commented out until the contracts module is implemented.
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  -- contract_id UUID REFERENCES contracts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KZT',
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',

  -- Gateway details
  gateway_transaction_id VARCHAR(255),
  gateway_response JSONB,
  gateway_callback_data JSONB,

  -- Fees and amounts
  platform_fee DECIMAL(15,2) DEFAULT 0,
  gateway_fee DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2),

  -- Payment details
  description TEXT,
  metadata JSONB,
  receipt_url VARCHAR(500),

  -- Timestamps
  expires_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  payment_id UUID REFERENCES payments(id),
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KZT',
  description TEXT NOT NULL,
  reference_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Balances Table
CREATE TABLE user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  available_balance DECIMAL(15,2) DEFAULT 0,
  pending_balance DECIMAL(15,2) DEFAULT 0,
  total_earned DECIMAL(15,2) DEFAULT 0,
  total_withdrawn DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Payment Tables
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);