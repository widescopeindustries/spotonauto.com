export { getLocalPool } from './manualEmbeddingsStore';
import { getLocalPool } from './manualEmbeddingsStore';
import { generateApiKey, hashApiKey } from './apiKey';

export interface Customer {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  api_key: string | null;
  api_key_hash: string | null;
  api_key_displayed: boolean;
  balance_cents: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  customer_id: string;
  amount_cents: number;
  balance_after_cents: number;
  type: string;
  description: string | null;
  stripe_session_id: string | null;
  page_path: string | null;
  created_at: string;
}

export async function getCustomerByApiKey(apiKey: string): Promise<Customer | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  const result = await pool.query<Customer>(
    'SELECT * FROM api_customers WHERE api_key_hash = $1 LIMIT 1',
    [hashApiKey(apiKey)]
  );
  return result.rows[0] || null;
}

export async function getOrCreateCustomerByEmail(
  email: string,
  stripeCustomerId?: string
): Promise<Customer> {
  const pool = getLocalPool();
  if (!pool) throw new Error('Database not configured');

  const existing = await pool.query<Customer>(
    'SELECT * FROM api_customers WHERE email = $1 LIMIT 1',
    [email]
  );
  if (existing.rows[0]) {
    if (stripeCustomerId && !existing.rows[0].stripe_customer_id) {
      await pool.query('UPDATE api_customers SET stripe_customer_id = $1, updated_at = now() WHERE id = $2', [
        stripeCustomerId,
        existing.rows[0].id,
      ]);
      existing.rows[0].stripe_customer_id = stripeCustomerId;
    }
    return existing.rows[0];
  }

  const key = generateApiKey();
  const inserted = await pool.query<Customer>(
    `INSERT INTO api_customers (email, stripe_customer_id, api_key, api_key_hash, balance_cents)
     VALUES ($1, $2, $3, $4, 0)
     RETURNING *`,
    [email, stripeCustomerId || null, key, hashApiKey(key)]
  );
  return inserted.rows[0];
}

export async function getOrCreateCustomerByStripeSession(
  stripeCustomerId: string,
  email?: string | null
): Promise<Customer> {
  const pool = getLocalPool();
  if (!pool) throw new Error('Database not configured');

  const existing = await pool.query<Customer>(
    'SELECT * FROM api_customers WHERE stripe_customer_id = $1 LIMIT 1',
    [stripeCustomerId]
  );
  if (existing.rows[0]) return existing.rows[0];

  if (email) {
    const byEmail = await pool.query<Customer>(
      'SELECT * FROM api_customers WHERE email = $1 LIMIT 1',
      [email]
    );
    if (byEmail.rows[0]) {
      await pool.query(
        'UPDATE api_customers SET stripe_customer_id = $1, updated_at = now() WHERE id = $2',
        [stripeCustomerId, byEmail.rows[0].id]
      );
      byEmail.rows[0].stripe_customer_id = stripeCustomerId;
      return byEmail.rows[0];
    }
  }

  const key = generateApiKey();
  const inserted = await pool.query<Customer>(
    `INSERT INTO api_customers (email, stripe_customer_id, api_key, api_key_hash, balance_cents)
     VALUES ($1, $2, $3, $4, 0)
     RETURNING *`,
    [email || null, stripeCustomerId, key, hashApiKey(key)]
  );
  return inserted.rows[0];
}

/**
 * Return the plaintext API key once (e.g., after checkout), then mark it displayed
 * and clear the plaintext column so it cannot be leaked again.
 */
export async function retrieveApiKeyForDisplay(customerId: string): Promise<string | null> {
  const pool = getLocalPool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<Customer>(
      'SELECT api_key, api_key_displayed FROM api_customers WHERE id = $1 FOR UPDATE',
      [customerId]
    );
    const customer = result.rows[0];
    if (!customer || !customer.api_key) {
      await client.query('ROLLBACK');
      return null;
    }
    const key = customer.api_key;
    await client.query(
      'UPDATE api_customers SET api_key = NULL, api_key_displayed = true, updated_at = now() WHERE id = $1',
      [customerId]
    );
    await client.query('COMMIT');
    return key;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function creditCustomer(
  customerId: string,
  amountCents: number,
  options: {
    type: string;
    description?: string;
    stripeSessionId?: string;
  }
): Promise<Customer> {
  const pool = getLocalPool();
  if (!pool) throw new Error('Database not configured');
  if (amountCents < 0) throw new Error('Credit amount must be non-negative');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const update = await client.query<Customer>(
      'UPDATE api_customers SET balance_cents = balance_cents + $1, updated_at = now() WHERE id = $2 RETURNING *',
      [amountCents, customerId]
    );
    if (!update.rows[0]) throw new Error('Customer not found');

    await client.query(
      `INSERT INTO api_credit_transactions
       (customer_id, amount_cents, balance_after_cents, type, description, stripe_session_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        customerId,
        amountCents,
        update.rows[0].balance_cents,
        options.type,
        options.description || null,
        options.stripeSessionId || null,
      ]
    );

    await client.query('COMMIT');
    return update.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function debitPageRequest(
  apiKey: string,
  pagePath: string
): Promise<{ success: true; customer: Customer; remaining: number } | { success: false; reason: string }> {
  const pool = getLocalPool();
  if (!pool) return { success: false, reason: 'database_not_configured' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const customerResult = await client.query<Customer>(
      'SELECT * FROM api_customers WHERE api_key_hash = $1 FOR UPDATE',
      [hashApiKey(apiKey)]
    );
    if (!customerResult.rows[0]) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'invalid_api_key' };
    }

    const customer = customerResult.rows[0];
    if (customer.balance_cents < 1) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'insufficient_credits' };
    }

    const update = await client.query<Customer>(
      'UPDATE api_customers SET balance_cents = balance_cents - 1, updated_at = now() WHERE id = $1 RETURNING *',
      [customer.id]
    );

    await client.query(
      `INSERT INTO api_credit_transactions
       (customer_id, amount_cents, balance_after_cents, type, description, page_path)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [customer.id, -1, update.rows[0].balance_cents, 'page_request', `Page request: ${pagePath}`, pagePath]
    );

    await client.query('COMMIT');
    return { success: true, customer: update.rows[0], remaining: update.rows[0].balance_cents };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rotateApiKey(customerId: string): Promise<Customer | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  const key = generateApiKey();
  const result = await pool.query<Customer>(
    'UPDATE api_customers SET api_key = $1, api_key_hash = $2, api_key_displayed = false, updated_at = now() WHERE id = $3 RETURNING *',
    [key, hashApiKey(key), customerId]
  );
  return result.rows[0] || null;
}

export async function getTransactionHistory(
  customerId: string,
  limit = 100
): Promise<CreditTransaction[]> {
  const pool = getLocalPool();
  if (!pool) return [];
  const result = await pool.query<CreditTransaction>(
    'SELECT * FROM api_credit_transactions WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2',
    [customerId, limit]
  );
  return result.rows;
}

export async function getCustomerByStripeSessionId(sessionId: string): Promise<Customer | null> {
  const pool = getLocalPool();
  if (!pool) return null;
  const result = await pool.query<Customer>(
    `SELECT c.* FROM api_customers c
     JOIN api_credit_transactions t ON t.customer_id = c.id
     WHERE t.stripe_session_id = $1
     LIMIT 1`,
    [sessionId]
  );
  return result.rows[0] || null;
}
