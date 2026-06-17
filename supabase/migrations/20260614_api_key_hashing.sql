-- Migrate API keys to hashed storage.
-- Plaintext api_key is retained only for one-time display after generation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add hash column and make plaintext key nullable so it can be cleared after display.
ALTER TABLE api_customers ADD COLUMN IF NOT EXISTS api_key_hash text UNIQUE;
ALTER TABLE api_customers ALTER COLUMN api_key DROP NOT NULL;

-- Populate hashes for existing keys using SHA-256.
UPDATE api_customers
SET api_key_hash = encode(digest(api_key, 'sha256'), 'hex')
WHERE api_key_hash IS NULL AND api_key IS NOT NULL;

-- Ensure uniqueness and lookup index on the hash.
CREATE UNIQUE INDEX IF NOT EXISTS api_customers_api_key_hash_idx ON api_customers(api_key_hash);

-- Drop old plaintext index if it exists; lookups now go through hash.
DROP INDEX IF EXISTS api_customers_api_key_idx;

-- Add a helper column to track whether the plaintext key has been displayed.
ALTER TABLE api_customers ADD COLUMN IF NOT EXISTS api_key_displayed boolean NOT NULL DEFAULT false;
