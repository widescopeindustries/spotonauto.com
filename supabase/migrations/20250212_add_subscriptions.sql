-- Enable RLS
alter table if exists public.subscriptions enable row level security;
alter table if exists public.user_usage enable row level security;
alter table if exists public.garage_vehicles enable row level security;
alter table if exists public.diagnosis_history enable row level security;

-- Subscriptions table
create table if not exists public.subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tier text default 'free' check (tier in ('free', 'pro', 'pro_plus')),
    status text default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean default false,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id)
);

-- User usage tracking (resets monthly)
create table if not exists public.user_usage (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    month text not null, -- Format: YYYY-MM
    ai_diagnoses_used integer default 0,
    guides_accessed integer default 0,
    obd_scans_used integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, month)
);

-- Garage vehicles (saved vehicles for users)
create table if not exists public.garage_vehicles (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    year text not null,
    make text not null,
    model text not null,
    vin text,
    nickname text, -- e.g., "My Truck", "Wife's Car"
    mileage integer,
    last_service_date date,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Diagnosis history (saved AI conversations)
create table if not exists public.diagnosis_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    vehicle_id uuid references public.garage_vehicles(id) on delete set null,
    vehicle_year text,
    vehicle_make text,
    vehicle_model text,
    problem text,
    conversation jsonb, -- Array of messages
    diagnosis_summary text,
    recommended_parts jsonb,
    status text default 'active' check (status in ('active', 'resolved', 'archived')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- RLS Policies

-- Subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- User usage: Users can only see their own
CREATE POLICY "Users can view own usage"
    ON public.user_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Garage vehicles: Users can CRUD their own
CREATE POLICY "Users can view own garage"
    ON public.garage_vehicles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own garage vehicles"
    ON public.garage_vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own garage vehicles"
    ON public.garage_vehicles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own garage vehicles"
    ON public.garage_vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- Diagnosis history: Users can CRUD their own
CREATE POLICY "Users can view own diagnosis history"
    ON public.diagnosis_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnoses"
    ON public.diagnosis_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnoses"
    ON public.diagnosis_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions

-- Get or create user usage for current month
CREATE OR REPLACE FUNCTION public.get_or_create_usage(p_user_id uuid)
RETURNS public.user_usage
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_month text := to_char(now(), 'YYYY-MM');
    v_usage public.user_usage;
BEGIN
    SELECT * INTO v_usage
    FROM public.user_usage
    WHERE user_id = p_user_id AND month = v_month;
    
    IF NOT FOUND THEN
        INSERT INTO public.user_usage (user_id, month)
        VALUES (p_user_id, v_month)
        RETURNING * INTO v_usage;
    END IF;
    
    RETURN v_usage;
END;
$$;

-- Increment AI diagnosis count
CREATE OR REPLACE FUNCTION public.increment_ai_diagnosis(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage public.user_usage;
    v_subscription public.subscriptions;
    v_limit integer;
BEGIN
    -- Get usage
    v_usage := public.get_or_create_usage(p_user_id);
    
    -- Get subscription tier
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE user_id = p_user_id;
    
    -- Get limit based on tier
    v_limit := CASE v_subscription.tier
        WHEN 'pro' THEN 999999
        WHEN 'pro_plus' THEN 999999
        ELSE 3
    END;
    
    -- Check if under limit
    IF v_usage.ai_diagnoses_used >= v_limit THEN
        RETURN false;
    END IF;
    
    -- Increment
    UPDATE public.user_usage
    SET ai_diagnoses_used = ai_diagnoses_used + 1,
        updated_at = now()
    WHERE id = v_usage.id;
    
    RETURN true;
END;
$$;

-- Trigger to create subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active');
    RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
