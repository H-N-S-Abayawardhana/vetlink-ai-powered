import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/types/next-auth';
import { sendAppointmentNotificationToVet } from '@/lib/email';

// GET /api/appointments - Get user's appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const veterinarianId = searchParams.get('veterinarian_id');

    let query = `
      SELECT 
        a.id,
        a.user_id_uuid as user_id,
        a.veterinarian_id_uuid as veterinarian_id,
        a.appointment_date,
        a.appointment_time,
        a.appointment_title,
        a.contact_number,
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
      JOIN users u ON a.user_id_uuid = u.id
      JOIN users v ON a.veterinarian_id_uuid = v.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filter by user role
    if (session.user.userRole === 'USER') {
      query += ` AND a.user_id_uuid = $${++paramCount}`;
      params.push(session.user.id);
    } else if (session.user.userRole === 'VETERINARIAN') {
      query += ` AND a.veterinarian_id_uuid = $${++paramCount}`;
      params.push(session.user.id);
    }
    // SUPER_ADMIN can see all appointments

    // Additional filters
    if (status) {
      query += ` AND a.status = $${++paramCount}`;
      params.push(status);
    }

    if (veterinarianId) {
      query += ` AND a.veterinarian_id_uuid = $${++paramCount}`;
      params.push(veterinarianId);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const result = await pool.query(query, params);
    
    // Ensure dates are returned as strings to avoid timezone conversion issues
    const appointments = result.rows.map(row => ({
      ...row,
      appointment_date: row.appointment_date instanceof Date 
        ? row.appointment_date.toISOString().split('T')[0]
        : typeof row.appointment_date === 'string' && row.appointment_date.includes('T')
        ? row.appointment_date.split('T')[0]
        : row.appointment_date,
      appointment_time: typeof row.appointment_time === 'string' 
        ? row.appointment_time 
        : row.appointment_time?.toString() || ''
    }));
    
    return NextResponse.json({
      success: true,
      appointments
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only USER role can create appointments
    if (session.user.userRole !== 'USER') {
      return NextResponse.json(
        { error: 'Only users can schedule appointments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      veterinarian_id, 
      appointment_date, 
      appointment_time, 
      appointment_title,
      contact_number,
      reason 
    } = body;

    // Validate required fields
    if (!veterinarian_id || !appointment_date || !appointment_time || !appointment_title || !contact_number) {
      return NextResponse.json(
        { error: 'Missing required fields: veterinarian_id, appointment_date, appointment_time, appointment_title, contact_number' },
        { status: 400 }
      );
    }

    // Validate appointment date is not in the past
    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
    if (appointmentDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule appointments in the past' },
        { status: 400 }
      );
    }

    // Verify veterinarian exists and is active
    const vetResult = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND user_role = $2 AND is_active = true',
      [veterinarian_id, 'VETERINARIAN']
    );

    if (vetResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid veterinarian selected' },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const conflictResult = await pool.query(
      `SELECT id FROM appointments 
       WHERE veterinarian_id_uuid = $1 
       AND appointment_date = $2 
       AND appointment_time = $3 
       AND status IN ('pending', 'accepted')`,
      [veterinarian_id, appointment_date, appointment_time]
    );

    if (conflictResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Update user's contact number if provided and different from stored value
    if (contact_number) {
      await pool.query(
        'UPDATE users SET contact_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND (contact_number IS NULL OR contact_number != $1)',
        [contact_number, session.user.id]
      );
    }

    // Create the appointment
    const result = await pool.query(
      `INSERT INTO appointments 
       (user_id_uuid, veterinarian_id_uuid, appointment_date, appointment_time, appointment_title, contact_number, reason, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'unpaid')
       RETURNING *`,
      [session.user.id, veterinarian_id, appointment_date, appointment_time, appointment_title, contact_number, reason || null]
    );

    const appointment = result.rows[0];

    // Get user and veterinarian details for email notification
    const userResult = await pool.query(
      'SELECT username, email, contact_number FROM users WHERE id = $1',
      [session.user.id]
    );

    const vetDetailsResult = await pool.query(
      'SELECT username, email, contact_number FROM users WHERE id = $1',
      [veterinarian_id]
    );

    if (userResult.rows.length > 0 && vetDetailsResult.rows.length > 0) {
      const user = userResult.rows[0];
      const veterinarian = vetDetailsResult.rows[0];

      // Send email notification to veterinarian
      try {
        await sendAppointmentNotificationToVet({
          appointmentId: appointment.id,
          userEmail: user.email,
          userName: user.username,
          userContact: user.contact_number,
          veterinarianEmail: veterinarian.email,
          veterinarianName: veterinarian.username,
          veterinarianContact: veterinarian.contact_number,
          appointmentDate: appointment_date,
          appointmentTime: appointment_time,
          reason: reason || null,
          status: 'pending'
        });
      } catch (emailError) {
        console.error('Failed to send email notification to veterinarian:', emailError);
        // Don't fail the appointment creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      appointment: appointment,
      message: 'Appointment scheduled successfully'
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
