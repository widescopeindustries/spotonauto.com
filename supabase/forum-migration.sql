-- ============================================================
-- SpotOnAuto Community Forum — Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── 1. TABLES ───────────────────────────────────────────────

-- Forum categories (8 auto-repair topic areas)
CREATE TABLE IF NOT EXISTS forum_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text NOT NULL DEFAULT '',
    icon text NOT NULL DEFAULT 'wrench',
    sort_order int NOT NULL DEFAULT 0,
    thread_count int NOT NULL DEFAULT 0,
    post_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Forum threads (user-created discussions)
CREATE TABLE IF NOT EXISTS forum_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    slug text NOT NULL,
    body text NOT NULL,
    vehicle_year int,
    vehicle_make text,
    vehicle_model text,
    view_count int NOT NULL DEFAULT 0,
    reply_count int NOT NULL DEFAULT 0,
    is_pinned boolean NOT NULL DEFAULT false,
    is_locked boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug ON forum_threads(slug);

-- Forum posts (replies on threads)
CREATE TABLE IF NOT EXISTS forum_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);

-- Forum profiles (display name, avatar, counts)
CREATE TABLE IF NOT EXISTS forum_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL DEFAULT 'DIY Mechanic',
    avatar_url text,
    thread_count int NOT NULL DEFAULT 0,
    post_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);


-- ── 2. ROW LEVEL SECURITY ──────────────────────────────────

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_profiles ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Anyone can read categories"
    ON forum_categories FOR SELECT
    USING (true);

-- Threads: public read, auth insert, author update/delete
CREATE POLICY "Anyone can read threads"
    ON forum_threads FOR SELECT
    USING (true);

CREATE POLICY "Auth users can create threads"
    ON forum_threads FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own threads"
    ON forum_threads FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own threads"
    ON forum_threads FOR DELETE
    USING (auth.uid() = author_id);

-- Posts: public read, auth insert, author update/delete
CREATE POLICY "Anyone can read posts"
    ON forum_posts FOR SELECT
    USING (true);

CREATE POLICY "Auth users can create posts"
    ON forum_posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
    ON forum_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
    ON forum_posts FOR DELETE
    USING (auth.uid() = author_id);

-- Profiles: public read, owner update
CREATE POLICY "Anyone can read profiles"
    ON forum_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON forum_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON forum_profiles FOR UPDATE
    USING (auth.uid() = id);


-- ── 3. TRIGGERS ─────────────────────────────────────────────

-- Auto-increment category thread_count + profile thread_count on new thread
CREATE OR REPLACE FUNCTION fn_on_thread_created()
RETURNS trigger AS $$
BEGIN
    UPDATE forum_categories
        SET thread_count = thread_count + 1
        WHERE id = NEW.category_id;
    UPDATE forum_profiles
        SET thread_count = thread_count + 1
        WHERE id = NEW.author_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_thread_created
    AFTER INSERT ON forum_threads
    FOR EACH ROW EXECUTE FUNCTION fn_on_thread_created();

-- Auto-increment thread reply_count + category post_count + profile post_count on new post
CREATE OR REPLACE FUNCTION fn_on_post_created()
RETURNS trigger AS $$
BEGIN
    UPDATE forum_threads
        SET reply_count = reply_count + 1,
            updated_at = now()
        WHERE id = NEW.thread_id;
    UPDATE forum_categories
        SET post_count = post_count + 1
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = NEW.thread_id);
    UPDATE forum_profiles
        SET post_count = post_count + 1
        WHERE id = NEW.author_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_post_created
    AFTER INSERT ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION fn_on_post_created();

-- Auto-create forum profile on user signup
CREATE OR REPLACE FUNCTION fn_create_forum_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.forum_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'DIY Mechanic'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_forum_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION fn_create_forum_profile();


-- ── 4. RPC: increment_thread_views ──────────────────────────
-- SECURITY DEFINER so anonymous visitors can trigger it

CREATE OR REPLACE FUNCTION increment_thread_views(p_thread_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE forum_threads
        SET view_count = view_count + 1
        WHERE id = p_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 5. SEED CATEGORIES ──────────────────────────────────────

INSERT INTO forum_categories (name, slug, description, icon, sort_order) VALUES
    ('Oil Changes & Fluids', 'oil-changes-fluids', 'Oil changes, coolant flushes, transmission fluid, brake fluid, and all vehicle fluids', 'droplets', 1),
    ('Engine & Electrical', 'engine-electrical', 'Engine diagnostics, check engine lights, starters, alternators, batteries, and wiring', 'zap', 2),
    ('Brakes & Suspension', 'brakes-suspension', 'Brake pads, rotors, calipers, shocks, struts, control arms, and steering', 'shield', 3),
    ('Tires & Wheels', 'tires-wheels', 'Tire selection, rotation, balancing, alignment, and wheel maintenance', 'circle', 4),
    ('Body & Interior', 'body-interior', 'Paint repair, dent removal, upholstery, dashboard, and cosmetic fixes', 'paintbrush', 5),
    ('Heating & Cooling', 'heating-cooling', 'Radiators, thermostats, water pumps, heater cores, and A/C systems', 'thermometer', 6),
    ('Transmission & Drivetrain', 'transmission-drivetrain', 'Manual and automatic transmissions, clutches, differentials, CV joints, and axles', 'cog', 7),
    ('General Discussion', 'general-discussion', 'Tool recommendations, shop talk, vehicle buying advice, and anything auto-related', 'message-circle', 8)
ON CONFLICT (slug) DO NOTHING;


-- ── 6. BACKFILL: Create forum_profiles for existing users ───

INSERT INTO forum_profiles (id, display_name, avatar_url)
SELECT
    id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'DIY Mechanic'),
    raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
