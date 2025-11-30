-- VetLink Appointments Table Migration
-- Run these queries in your PostgreSQL database to create the appointments system

-- Step 1: Create enum types for appointment status and payment status
CREATE TYPE appointment_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'rescheduled', 'completed');
CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'paid');

-- Step 2: Create the appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    veterinarian_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT,
    status appointment_status_enum DEFAULT 'pending',
    reschedule_reason TEXT,
    rescheduled_from TIMESTAMP WITH TIME ZONE,
    payment_status payment_status_enum DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Create indexes for better query performance
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_veterinarian_id ON appointments(veterinarian_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- Step 4: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Add constraint to ensure appointment date is not in the past
ALTER TABLE appointments 
ADD CONSTRAINT check_appointment_date_future 
CHECK (appointment_date >= CURRENT_DATE);

-- Note: Role validation is handled at the application level in the API routes
-- PostgreSQL CHECK constraints cannot contain subqueries, so we validate
-- veterinarian and user roles in the application code instead

-- Step 7: Create a view for appointment details with user and veterinarian information
CREATE VIEW appointment_details AS
SELECT 
    a.id,
    a.user_id,
    a.veterinarian_id,
    a.appointment_date,
    a.appointment_time,
    a.reason,
    a.status,
    a.reschedule_reason,
    a.rescheduled_from,
    a.payment_status,
    a.created_at,
    a.updated_at,
    a.confirmed_at,
    a.completed_at,
    u.username as user_name,
    u.email as user_email,
    u.contact_number as user_contact,
    v.username as veterinarian_name,
    v.email as veterinarian_email,
    v.contact_number as veterinarian_contact
FROM appointments a
JOIN users u ON a.user_id = u.id
JOIN users v ON a.veterinarian_id = v.id;

-- Step 8: Verify the migration was successful
SELECT 
    'Appointments table created successfully' as status,
    COUNT(*) as total_appointments
FROM appointments;

-- Step 9: Show table structure
\d appointments;

-- Step 10: Show available veterinarians
SELECT 
    id,
    username,
    email,
    contact_number,
    created_at
FROM users 
WHERE user_role = 'VETERINARIAN' 
AND is_active = true
ORDER BY username;
