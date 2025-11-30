# VetLink Appointment Scheduling System

## Overview

The VetLink Appointment Scheduling System allows users with the `USER` role to schedule appointments with veterinarians. The system includes role-based access control, real-time availability checking, and comprehensive appointment management.

## Database Schema

### Appointments Table

The `appointments` table stores all appointment information with the following structure:

```sql
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
```

### Enums

- **appointment_status_enum**: `'pending'`, `'accepted'`, `'rejected'`, `'cancelled'`, `'rescheduled'`, `'completed'`
- **payment_status_enum**: `'unpaid'`, `'paid'`

## API Endpoints

### 1. Appointments Management

#### GET `/api/appointments`
- **Purpose**: Fetch user's appointments
- **Access**: All authenticated users (filtered by role)
- **Query Parameters**:
  - `status`: Filter by appointment status
  - `veterinarian_id`: Filter by veterinarian

#### POST `/api/appointments`
- **Purpose**: Create new appointment
- **Access**: Only `USER` role
- **Body**:
  ```json
  {
    "veterinarian_id": 123,
    "appointment_date": "2024-01-15",
    "appointment_time": "10:30:00",
    "reason": "Annual checkup"
  }
  ```

#### GET `/api/appointments/[id]`
- **Purpose**: Get specific appointment details
- **Access**: Owner, assigned veterinarian, or SUPER_ADMIN

#### PUT `/api/appointments/[id]`
- **Purpose**: Update appointment
- **Access**: Owner, assigned veterinarian, or SUPER_ADMIN
- **Body**: Partial update with any of the appointment fields

#### DELETE `/api/appointments/[id]`
- **Purpose**: Cancel appointment (soft delete)
- **Access**: Owner, assigned veterinarian, or SUPER_ADMIN

### 2. Veterinarians Management

#### GET `/api/veterinarians`
- **Purpose**: Get list of available veterinarians
- **Access**: Only `USER` role
- **Query Parameters**:
  - `date`: Get appointment counts for specific date

#### GET `/api/veterinarians/[id]/availability`
- **Purpose**: Check veterinarian availability for specific date
- **Access**: Only `USER` role
- **Query Parameters**:
  - `date`: Date to check availability (YYYY-MM-DD format)

## Frontend Components

### 1. Appointment Schedule Page (`/dashboard/appointment-schedule`)

**File**: `src/app/dashboard/appointment-schedule/page.tsx`

- Main page for appointment scheduling
- Tab-based interface with "Schedule New" and "My Appointments"
- Role-based access control (USER only)
- Real-time appointment fetching and management

### 2. Appointment Scheduler Component

**File**: `src/components/dashboard/appointment-schedule/AppointmentScheduler.tsx`

Features:
- Veterinarian selection dropdown
- Date picker (prevents past dates)
- Time slot selection with availability checking
- Reason for visit text area
- Form validation and error handling
- Success/error notifications

### 3. Appointment List Component

**File**: `src/components/dashboard/appointment-schedule/AppointmentList.tsx`

Features:
- Display all user appointments
- Status badges with color coding
- Payment status indicators
- Cancel appointment functionality
- Refresh capability
- Empty state handling

## Role-Based Access Control

### USER Role Permissions
- ✅ Schedule new appointments
- ✅ View own appointments
- ✅ Cancel own appointments
- ✅ View available veterinarians
- ✅ Check veterinarian availability

### VETERINARIAN Role Permissions
- ✅ View appointments assigned to them
- ✅ Update appointment status
- ✅ View appointment details

### SUPER_ADMIN Role Permissions
- ✅ Full access to all appointments
- ✅ Manage any appointment
- ✅ View all appointment data

## Database Migration

To set up the appointment system, run the SQL migration file:

```bash
# Run the migration
psql -d your_database -f appointments_migration.sql
```

The migration includes:
1. Enum type creation
2. Appointments table creation
3. Indexes for performance
4. Constraints for data integrity
5. Triggers for automatic timestamp updates
6. Views for easy data access

## Key Features

### 1. Real-time Availability
- Time slots are checked in real-time
- Prevents double-booking
- Shows only available slots

### 2. Data Validation
- Past date prevention
- Required field validation
- Veterinarian existence verification
- Conflict detection

### 3. Status Management
- Comprehensive status tracking
- Automatic timestamp updates
- Status-based permissions

### 4. User Experience
- Intuitive tab-based interface
- Real-time feedback
- Loading states
- Error handling
- Success notifications

## Security Features

1. **Authentication Required**: All endpoints require valid session
2. **Role-Based Access**: Strict role checking for all operations
3. **Data Isolation**: Users can only access their own appointments
4. **Input Validation**: Server-side validation for all inputs
5. **SQL Injection Prevention**: Parameterized queries throughout

## Usage Instructions

### For Users (USER role):

1. **Navigate to Appointment Scheduling**:
   - Go to `/dashboard/appointment-schedule`
   - Or use the "Schedule Appointment" link in the sidebar

2. **Schedule New Appointment**:
   - Select a veterinarian from the dropdown
   - Choose an available date (future dates only)
   - Select an available time slot
   - Optionally add a reason for the visit
   - Click "Schedule Appointment"

3. **Manage Appointments**:
   - Switch to "My Appointments" tab
   - View all scheduled appointments
   - Cancel appointments if needed
   - Refresh to get latest updates

### For Veterinarians (VETERINARIAN role):

1. **View Assigned Appointments**:
   - Access through the appointments API
   - Filter by status or date
   - Update appointment status as needed

### For Administrators (SUPER_ADMIN role):

1. **Full System Access**:
   - View all appointments
   - Manage any appointment
   - Access comprehensive appointment data

## Error Handling

The system includes comprehensive error handling:

- **Client-side**: Form validation, loading states, user feedback
- **Server-side**: Input validation, database error handling, proper HTTP status codes
- **Database**: Constraints, triggers, and data integrity checks

## Performance Optimizations

1. **Database Indexes**: Optimized queries with proper indexing
2. **Efficient Queries**: Minimal data fetching with targeted queries
3. **Caching**: Session-based caching for user data
4. **Lazy Loading**: Components load data only when needed

## Future Enhancements

Potential improvements for the appointment system:

1. **Email Notifications**: Send confirmation and reminder emails
2. **Calendar Integration**: Sync with external calendar systems
3. **Recurring Appointments**: Support for regular checkups
4. **Payment Integration**: Online payment processing
5. **Mobile App**: Native mobile application
6. **Advanced Scheduling**: Multi-day availability, vacation periods
7. **Appointment History**: Detailed history and analytics
8. **Waitlist System**: Queue for popular time slots

## Troubleshooting

### Common Issues:

1. **"Access Denied" Error**:
   - Ensure user has USER role
   - Check authentication status
   - Verify session validity

2. **"No Available Time Slots"**:
   - Check if veterinarian is active
   - Verify date is not in the past
   - Ensure veterinarian has available slots

3. **"Failed to Schedule Appointment"**:
   - Check for conflicting appointments
   - Verify all required fields are filled
   - Ensure database connection is working

### Database Issues:

1. **Migration Errors**:
   - Ensure PostgreSQL is running
   - Check database permissions
   - Verify enum types don't already exist

2. **Constraint Violations**:
   - Check user roles are properly set
   - Verify foreign key relationships
   - Ensure data integrity

## Support

For technical support or questions about the appointment system:

1. Check the application logs for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all environment variables are properly set
4. Check user roles and authentication status

The appointment system is designed to be robust, secure, and user-friendly while maintaining high performance and data integrity.
