import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET /api/veterinarians/[id]/availability - Get veterinarian availability for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only USER role can check veterinarian availability
    if (session.user.userRole !== 'USER') {
      return NextResponse.json(
        { error: 'Access denied. Only users can check availability.' },
        { status: 403 }
      );
    }

    const { id: veterinarianId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Verify veterinarian exists and is active
    const vetResult = await pool.query(
      'SELECT id, username FROM users WHERE id = $1 AND user_role = $2 AND is_active = true',
      [veterinarianId, 'VETERINARIAN']
    );

    if (vetResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Veterinarian not found' },
        { status: 404 }
      );
    }

    // Get booked time slots for the date
    const bookedResult = await pool.query(
      `SELECT appointment_time, status 
       FROM appointments 
       WHERE veterinarian_id_uuid = $1 
       AND appointment_date = $2 
       AND status IN ('pending', 'accepted')
       ORDER BY appointment_time`,
      [veterinarianId, date]
    );

    // Define available time slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const isBooked = bookedResult.rows.some(booking => 
          booking.appointment_time === timeString
        );
        
        availableSlots.push({
          time: timeString,
          display_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          available: !isBooked
        });
      }
    }

    return NextResponse.json({
      success: true,
      veterinarian: vetResult.rows[0],
      date,
      available_slots: availableSlots,
      booked_appointments: bookedResult.rows
    });

  } catch (error) {
    console.error('Error checking veterinarian availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
