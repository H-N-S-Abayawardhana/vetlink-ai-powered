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


CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    address TEXT,
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact Information
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Delivery Options
    pickup_available BOOLEAN DEFAULT true,
    delivery_available BOOLEAN DEFAULT false,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pharmacies_owner_id ON pharmacies(owner_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_created_at ON pharmacies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(latitude, longitude);

-- Add comment to table
COMMENT ON TABLE pharmacies IS 'Stores pharmacy registration information';


-- ============================================================================
-- Migration: Create pharmacy_inventory_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pharmacy_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    
    -- Item Information
    name VARCHAR(255) NOT NULL,
    form VARCHAR(100) NOT NULL,
    strength VARCHAR(100),
    
    -- Stock Information
    stock INTEGER DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    expiry_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy_id ON pharmacy_inventory_items(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON pharmacy_inventory_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON pharmacy_inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON pharmacy_inventory_items(stock);

-- Add comment to table
COMMENT ON TABLE pharmacy_inventory_items IS 'Stores inventory items for each pharmacy';