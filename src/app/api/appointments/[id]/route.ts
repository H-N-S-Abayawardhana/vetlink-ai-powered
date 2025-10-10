import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/types/next-auth';
import { sendAppointmentStatusToUser } from '@/lib/email';

// GET /api/appointments/[id] - Get specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: appointmentId } = await params;

    const result = await pool.query(
      `SELECT 
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
      JOIN users v ON a.veterinarian_id = v.id
      WHERE a.id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const appointment = result.rows[0];

    // Check if user has access to this appointment
    const hasAccess = 
      session.user.userRole === 'SUPER_ADMIN' ||
      (session.user.userRole === 'USER' && appointment.user_id === parseInt(session.user.id)) ||
      (session.user.userRole === 'VETERINARIAN' && appointment.veterinarian_id === parseInt(session.user.id));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: appointmentId } = await params;
    const body = await request.json();
    const { 
      appointment_date, 
      appointment_time, 
      reason, 
      status,
      reschedule_reason 
    } = body;

    // Get current appointment
    const currentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const currentAppointment = currentResult.rows[0];

    // Check if user has access to update this appointment
    const hasAccess = 
      session.user.userRole === 'SUPER_ADMIN' ||
      (session.user.userRole === 'USER' && currentAppointment.user_id === parseInt(session.user.id)) ||
      (session.user.userRole === 'VETERINARIAN' && currentAppointment.veterinarian_id === parseInt(session.user.id));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (appointment_date !== undefined) {
      updates.push(`appointment_date = $${++paramCount}`);
      values.push(appointment_date);
    }

    if (appointment_time !== undefined) {
      updates.push(`appointment_time = $${++paramCount}`);
      values.push(appointment_time);
    }

    if (reason !== undefined) {
      updates.push(`reason = $${++paramCount}`);
      values.push(reason);
    }

    if (status !== undefined) {
      updates.push(`status = $${++paramCount}`);
      values.push(status);
      
      // Set confirmed_at when status changes to accepted
      if (status === 'accepted') {
        updates.push(`confirmed_at = CURRENT_TIMESTAMP`);
      }
      
      // Set completed_at when status changes to completed
      if (status === 'completed') {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (reschedule_reason !== undefined) {
      updates.push(`reschedule_reason = $${++paramCount}`);
      values.push(reschedule_reason);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(appointmentId);
    const query = `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    const updatedAppointment = result.rows[0];

    // Send email notification to user if status changed to accepted or rejected
    if (status && (status === 'accepted' || status === 'rejected')) {
      try {
        // Get user and veterinarian details for email notification
        const userResult = await pool.query(
          'SELECT username, email, contact_number FROM users WHERE id = $1',
          [currentAppointment.user_id]
        );

        const vetResult = await pool.query(
          'SELECT username, email, contact_number FROM users WHERE id = $1',
          [currentAppointment.veterinarian_id]
        );

        if (userResult.rows.length > 0 && vetResult.rows.length > 0) {
          const user = userResult.rows[0];
          const veterinarian = vetResult.rows[0];

          await sendAppointmentStatusToUser({
            appointmentId: parseInt(appointmentId),
            userEmail: user.email,
            userName: user.username,
            userContact: user.contact_number,
            veterinarianEmail: veterinarian.email,
            veterinarianName: veterinarian.username,
            veterinarianContact: veterinarian.contact_number,
            appointmentDate: currentAppointment.appointment_date,
            appointmentTime: currentAppointment.appointment_time,
            reason: currentAppointment.reason,
            status: status
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification to user:', emailError);
        // Don't fail the appointment update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: appointmentId } = await params;

    // Get current appointment
    const currentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const currentAppointment = currentResult.rows[0];

    // Check if user has access to cancel this appointment
    const hasAccess = 
      session.user.userRole === 'SUPER_ADMIN' ||
      (session.user.userRole === 'USER' && currentAppointment.user_id === parseInt(session.user.id)) ||
      (session.user.userRole === 'VETERINARIAN' && currentAppointment.veterinarian_id === parseInt(session.user.id));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update status to cancelled instead of deleting
    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['cancelled', appointmentId]
    );

    return NextResponse.json({
      success: true,
      appointment: result.rows[0],
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
