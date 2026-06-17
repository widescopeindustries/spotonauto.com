-- API credits wallet for Stripe-paid AI Training Feed access.
-- Tracks customers, API keys, balances, and per-page deductions.

CREATE TABLE IF NOT EXISTS api_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  stripe_customer_id text UNIQUE,
  api_key text UNIQUE NOT NULL,
  balance_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_customers_api_key_idx ON api_customers(api_key);
CREATE INDEX IF NOT EXISTS api_customers_stripe_customer_id_idx ON api_customers(stripe_customer_id);

CREATE TABLE IF NOT EXISTS api_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,          -- positive = credit, negative = debit
  balance_after_cents integer NOT NULL,
  type text NOT NULL,                     -- 'stripe_purchase' | 'page_request' | 'refund' | 'adjustment'
  description text,
  stripe_session_id text,
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_credit_transactions_customer_id_idx ON api_credit_transactions(customer_id);
CREATE INDEX IF NOT EXISTS api_credit_transactions_session_id_idx ON api_credit_transactions(stripe_session_id);
