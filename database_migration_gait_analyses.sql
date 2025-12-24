-- Migration: Create gait_analyses table for storing limping and disease prediction results

CREATE TABLE IF NOT EXISTS gait_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dog information
    age_years INTEGER NOT NULL,
    weight_category VARCHAR(20) NOT NULL CHECK (weight_category IN ('Light', 'Medium', 'Heavy')),
    
    -- Symptom inputs
    limping_detected INTEGER NOT NULL CHECK (limping_detected IN (0, 1)),
    pain_while_walking INTEGER NOT NULL CHECK (pain_while_walking IN (0, 1)),
    difficulty_standing INTEGER NOT NULL CHECK (difficulty_standing IN (0, 1)),
    reduced_activity INTEGER NOT NULL CHECK (reduced_activity IN (0, 1)),
    joint_swelling INTEGER NOT NULL CHECK (joint_swelling IN (0, 1)),
    
    -- Limping detection results (from video analysis)
    limping_class VARCHAR(20),
    limping_confidence DECIMAL(5, 2),
    limping_si_front DECIMAL(5, 2),
    limping_si_back DECIMAL(5, 2),
    limping_si_overall DECIMAL(5, 2),
    
    -- Disease prediction results
    predicted_disease VARCHAR(100) NOT NULL,
    disease_confidence DECIMAL(5, 2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('High', 'Medium', 'Low')),
    symptom_score INTEGER NOT NULL,
    pain_severity INTEGER NOT NULL,
    recommendations JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gait_analyses_pet_id ON gait_analyses(pet_id);
CREATE INDEX IF NOT EXISTS idx_gait_analyses_user_id ON gait_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_gait_analyses_created_at ON gait_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gait_analyses_predicted_disease ON gait_analyses(predicted_disease);

-- Add comment to table
COMMENT ON TABLE gait_analyses IS 'Stores gait analysis results including limping detection and disease risk predictions';

