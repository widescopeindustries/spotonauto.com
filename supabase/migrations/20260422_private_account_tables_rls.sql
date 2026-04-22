-- Lock down signed-in user data tables.
-- These tables back garage, diagnosis history, subscriptions, and monthly usage tracking.
-- They should only be readable and writable by the authenticated owner or the service role.

create table if not exists public.garage_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year text not null,
  make text not null,
  model text not null,
  vin text,
  nickname text,
  mileage integer,
  last_service_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists garage_vehicles_user_id_idx
  on public.garage_vehicles (user_id, created_at desc);

create table if not exists public.diagnosis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid references public.garage_vehicles(id) on delete set null,
  vehicle_year text not null,
  vehicle_make text not null,
  vehicle_model text not null,
  problem text not null,
  conversation jsonb not null default '[]'::jsonb,
  diagnosis_summary text,
  recommended_parts jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diagnosis_history_user_id_idx
  on public.diagnosis_history (user_id, created_at desc);

create index if not exists diagnosis_history_status_idx
  on public.diagnosis_history (user_id, status, created_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create table if not exists public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  ai_diagnoses_used integer not null default 0,
  guides_accessed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists user_usage_user_month_idx
  on public.user_usage (user_id, month);

alter table public.garage_vehicles enable row level security;
alter table public.diagnosis_history enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_usage enable row level security;

revoke all on table public.garage_vehicles from anon, authenticated;
revoke all on table public.diagnosis_history from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.user_usage from anon, authenticated;

grant select, insert, update, delete on table public.garage_vehicles to authenticated, service_role;
grant select, insert, update, delete on table public.diagnosis_history to authenticated, service_role;
grant select, insert, update, delete on table public.subscriptions to authenticated, service_role;
grant select, insert, update, delete on table public.user_usage to authenticated, service_role;

drop policy if exists "Service role full access to garage vehicles" on public.garage_vehicles;
drop policy if exists "Authenticated users can manage own garage vehicles" on public.garage_vehicles;
create policy "Service role full access to garage vehicles"
  on public.garage_vehicles
  for all
  to service_role
  using (true)
  with check (true);
create policy "Authenticated users can manage own garage vehicles"
  on public.garage_vehicles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role full access to diagnosis history" on public.diagnosis_history;
drop policy if exists "Authenticated users can manage own diagnosis history" on public.diagnosis_history;
create policy "Service role full access to diagnosis history"
  on public.diagnosis_history
  for all
  to service_role
  using (true)
  with check (true);
create policy "Authenticated users can manage own diagnosis history"
  on public.diagnosis_history
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role full access to subscriptions" on public.subscriptions;
drop policy if exists "Authenticated users can manage own subscriptions" on public.subscriptions;
create policy "Service role full access to subscriptions"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);
create policy "Authenticated users can manage own subscriptions"
  on public.subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role full access to user usage" on public.user_usage;
drop policy if exists "Authenticated users can manage own usage rows" on public.user_usage;
create policy "Service role full access to user usage"
  on public.user_usage
  for all
  to service_role
  using (true)
  with check (true);
create policy "Authenticated users can manage own usage rows"
  on public.user_usage
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.get_or_create_usage(p_user_id uuid)
returns public.user_usage
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month text := to_char(now(), 'YYYY-MM');
  usage_row public.user_usage;
begin
  insert into public.user_usage (user_id, month)
  values (p_user_id, current_month)
  on conflict (user_id, month) do update
    set updated_at = now()
  returning * into usage_row;

  return usage_row;
end;
$$;

create or replace function public.increment_ai_diagnosis(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month text := to_char(now(), 'YYYY-MM');
begin
  insert into public.user_usage (user_id, month, ai_diagnoses_used, guides_accessed, updated_at)
  values (p_user_id, current_month, 1, 0, now())
  on conflict (user_id, month) do update
    set ai_diagnoses_used = public.user_usage.ai_diagnoses_used + 1,
        updated_at = now();

  return true;
end;
$$;
