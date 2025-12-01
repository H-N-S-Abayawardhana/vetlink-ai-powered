import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { mapRowToPet } from '@/lib/pet-utils';
import { UserRole } from '@/types/next-auth';

// GET /api/pets - list pets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.userRole as UserRole || 'USER';

    if (userRole === 'SUPER_ADMIN' || userRole === 'VETERINARIAN') {
      const result = await pool.query('SELECT * FROM pets ORDER BY created_at DESC');
      const pets = result.rows.map(mapRowToPet);
      return NextResponse.json({ pets });
    }

    // Regular users: only their pets
    const result = await pool.query('SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC', [session.user.id]);
    const pets = result.rows.map(mapRowToPet);
    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pets - create a new pet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      name,
      breed,
      weightKg,
      activityLevel,
      ageYears,
      gender,
      allergies,
      preferredDiet,
      healthNotes,
      vaccinationStatus,
      avatarDataUrl
    } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO pets (owner_id, type, name, breed, weight_kg, activity_level, age_years, gender, allergies, preferred_diet, health_notes, vaccination_status, avatar_url, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        session.user.id,
        type || 'dog',
        name,
        breed || null,
        weightKg ?? null,
        activityLevel || null,
        ageYears ?? null,
        gender || null,
        allergies && Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
        preferredDiet || null,
        healthNotes || null,
        vaccinationStatus || null,
        avatarDataUrl || null,
      ]
    );

    const pet = mapRowToPet(result.rows[0]);
    return NextResponse.json({ pet });
  } catch (error) {
    console.error('Error creating pet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
