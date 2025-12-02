-- Migration: Create pets table
-- Run this in your Postgres database (psql or your DB tool).

-- Note: adjust types (serial/uuid) to match your existing users.id type.

CREATE TABLE IF NOT EXISTS pets (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'dog',
  name TEXT NOT NULL,
  breed TEXT,
  weight_kg NUMERIC,
  bcs NUMERIC,
  bcs_calculated_at TIMESTAMP WITH TIME ZONE,
  activity_level TEXT,
  age_years INTEGER,
  gender TEXT,
  allergies TEXT[],
  preferred_diet TEXT,
  health_notes TEXT,
  vaccination_status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);

-- Optional: example seed (uncomment to insert)
-- INSERT INTO pets (owner_id, type, name, breed, weight_kg, activity_level, age_years, gender, allergies, preferred_diet, health_notes, vaccination_status, avatar_url)
-- VALUES (1, 'dog', 'Buddy', 'Golden Retriever', 28, 'High', 3, 'Male', ARRAY['None'], 'Dry kibble', 'Very friendly', 'Up to date', NULL);
