
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
-- Stores user subscription data
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'premium')),
  credits int default 1, -- Free users get 1 free guide
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_tier, credits)
  values (new.id, new.email, 'free', 1);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- GUIDES TABLE
-- Stores generated repair guides
create table guides (
  id text primary key, -- Text because we use the "year-make-model-task" slug as ID
  user_id uuid references auth.users not null,
  vehicle_json jsonb not null,
  guide_content_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table guides enable row level security;

-- Policies
create policy "Users can view own guides" on guides
  for select using (auth.uid() = user_id);

create policy "Users can insert own guides" on guides
  for insert with check (auth.uid() = user_id);
