import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// GET /api/veterinarians - Get list of available veterinarians
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only USER role can view veterinarians for appointment scheduling
    if (session.user.userRole !== 'USER') {
      return NextResponse.json(
        { error: 'Access denied. Only users can view veterinarians.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.contact_number,
        u.created_at,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_appointments,
        COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted_appointments
      FROM users u
      LEFT JOIN appointments a ON u.id = a.veterinarian_id_uuid 
        AND a.appointment_date = $1
        AND a.status IN ('pending', 'accepted')
      WHERE u.user_role = 'VETERINARIAN' 
        AND u.is_active = true
      GROUP BY u.id, u.username, u.email, u.contact_number, u.created_at
      ORDER BY u.username
    `;

    const params = [date || new Date().toISOString().split('T')[0]];

    const result = await pool.query(query, params);
    
    return NextResponse.json({
      success: true,
      veterinarians: result.rows
    });

  } catch (error) {
    console.error('Error fetching veterinarians:', error);
    return NextResponse.json(
      { error: 'Failed to fetch veterinarians' },
      { status: 500 }
    );
  }
}
