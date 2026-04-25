/**
 * Supabase shim
 *
 * The self-hosted stack no longer depends on Supabase at runtime. This shim
 * stays in place so any stray imports fail gracefully instead of trying to
 * reach an external service.
 */

type QueryResult = {
  data: null;
  error: { message: string; code?: string } | null;
  count: number | null;
};

function fail(message: string): QueryResult {
  return { data: null, error: { message }, count: null };
}

const chain = {
  select: async () => fail('Supabase data access is disabled in the local-only stack'),
  insert: async () => fail('Supabase data access is disabled in the local-only stack'),
  update: async () => fail('Supabase data access is disabled in the local-only stack'),
  delete: async () => fail('Supabase data access is disabled in the local-only stack'),
  upsert: async () => fail('Supabase data access is disabled in the local-only stack'),
  eq: () => chain,
  order: () => chain,
  single: async () => fail('Supabase data access is disabled in the local-only stack'),
  head: () => chain,
  limit: () => chain,
  range: () => chain,
  in: () => chain,
  ilike: () => chain,
};

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async getUser() {
      return { data: { user: null }, error: null };
    },
    async signInWithOAuth() {
      return fail('Supabase auth is disabled in the local-only stack');
    },
    async signInWithPassword() {
      return fail('Supabase auth is disabled in the local-only stack');
    },
    async signUp() {
      return fail('Supabase auth is disabled in the local-only stack');
    },
    async signOut() {
      return { data: null, error: null };
    },
    async resetPasswordForEmail() {
      return fail('Supabase auth is disabled in the local-only stack');
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
  from() {
    return chain;
  },
  rpc: async () => fail('Supabase RPC is disabled in the local-only stack'),
};
