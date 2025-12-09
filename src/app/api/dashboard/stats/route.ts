import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/types/next-auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.userRole as UserRole || 'USER';

    // Initialize stats object
    const stats = {
      totalPets: 0,
      activeAppointments: 0,
      registeredPetOwners: 0,
      aiAnalyses: 0, // Keep for now, can be updated later
    };

    // Get total pets count
    // For regular users, count only their pets; for admins/vets, count all pets
    if (userRole === 'SUPER_ADMIN' || userRole === 'VETERINARIAN') {
      const petsResult = await pool.query('SELECT COUNT(*) as count FROM pets');
      stats.totalPets = parseInt(petsResult.rows[0].count);
    } else {
      // Cast owner_id to text to match UUID string from session
      const petsResult = await pool.query(
        'SELECT COUNT(*) as count FROM pets WHERE owner_id::text = $1',
        [session.user.id]
      );
      stats.totalPets = parseInt(petsResult.rows[0].count);
    }

    // Get active appointments count
    // Active appointments are those with status 'pending' or 'accepted'
    if (userRole === 'SUPER_ADMIN') {
      const appointmentsResult = await pool.query(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE status IN ('pending', 'accepted')`
      );
      stats.activeAppointments = parseInt(appointmentsResult.rows[0].count);
    } else if (userRole === 'VETERINARIAN') {
      const appointmentsResult = await pool.query(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE veterinarian_id_uuid = $1 AND status IN ('pending', 'accepted')`,
        [session.user.id]
      );
      stats.activeAppointments = parseInt(appointmentsResult.rows[0].count);
    } else {
      const appointmentsResult = await pool.query(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE user_id_uuid = $1 AND status IN ('pending', 'accepted')`,
        [session.user.id]
      );
      stats.activeAppointments = parseInt(appointmentsResult.rows[0].count);
    }

    // Get registered pet owners count (users with role 'USER')
    // Only show this for admins and veterinarians
    if (userRole === 'SUPER_ADMIN' || userRole === 'VETERINARIAN') {
      const usersResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE user_role = 'USER' AND is_active = true"
      );
      stats.registeredPetOwners = parseInt(usersResult.rows[0].count);
    } else {
      // Regular users don't need to see this stat
      stats.registeredPetOwners = 0;
    }

    // AI Analyses - keeping as placeholder for now
    // This can be updated later when AI analysis feature is implemented
    stats.aiAnalyses = 0;

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

