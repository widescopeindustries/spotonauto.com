-- Migration: Create public.vehicle_repair_profiles table for 24/7 background content generation
CREATE TABLE IF NOT EXISTS public.vehicle_repair_profiles (
  key text PRIMARY KEY, -- format: "year:make:model:task"
  year integer NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  task text NOT NULL,
  profile jsonb NOT NULL, -- titleSuffix, descriptionSuffix, extraKeywords, supportNote, faqs[]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_repair_profiles_search_idx 
  ON public.vehicle_repair_profiles (year, make, model, task);
