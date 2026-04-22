-- Lock down the public coverage waitlist table.
-- The app writes through a server route using the Supabase service role key,
-- so the table itself should not be readable or writable by anon/authenticated roles.

create table if not exists public.coverage_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  vehicle text not null default '',
  year integer,
  created_at timestamptz not null default now()
);

create unique index if not exists coverage_waitlist_email_vehicle_key
  on public.coverage_waitlist (email, vehicle);

alter table public.coverage_waitlist enable row level security;

revoke all on table public.coverage_waitlist from anon, authenticated;
grant all on table public.coverage_waitlist to service_role;

drop policy if exists "Service role full access to coverage waitlist" on public.coverage_waitlist;
create policy "Service role full access to coverage waitlist"
  on public.coverage_waitlist
  for all
  to service_role
  using (true)
  with check (true);
