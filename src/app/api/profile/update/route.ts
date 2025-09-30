import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email, contactNumber } = body;

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        { message: 'Username and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if username or email already exists for other users
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, session.user.id]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, contact_number = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND is_active = true
       RETURNING id, username, email, contact_number, created_at, last_login`,
      [username, email, contactNumber || null, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found or inactive' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        contactNumber: updatedUser.contact_number,
        createdAt: updatedUser.created_at,
        lastLogin: updatedUser.last_login
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
