import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { UserRole } from "@/types/next-auth";
import bcrypt from "bcryptjs";

// Get all users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any)?.userRole as UserRole;

    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin access required" },
        { status: 403 },
      );
    }

    const result = await pool.query(
      "SELECT id, username, email, user_role, is_active, created_at, last_login FROM users ORDER BY created_at DESC",
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update user role and/or is_active status (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any)?.userRole as UserRole;

    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin access required" },
        { status: 403 },
      );
    }

    const { userId, newRole, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!newRole && isActive === undefined) {
      return NextResponse.json(
        { error: "Either new role or is_active status must be provided" },
        { status: 400 },
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (newRole) {
      // Validate role
      const validRoles: UserRole[] = [
        "USER",
        "VETERINARIAN",
        "SUPER_ADMIN",
        "PHARMACIST",
      ];
      if (!validRoles.includes(newRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.push(`user_role = $${paramIndex}`);
      values.push(newRole);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, username, email, user_role, is_active`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new user (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any)?.userRole as UserRole;

    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin access required" },
        { status: 403 },
      );
    }

    const { username, email, contactNumber, password, role, isActive } =
      await request.json();

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    // Validate role
    const validRoles: UserRole[] = [
      "USER",
      "VETERINARIAN",
      "SUPER_ADMIN",
      "PHARMACIST",
    ];
    const userRoleToAssign = role || "USER";
    if (!validRoles.includes(userRoleToAssign)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (username, email, contact_number, password_hash, user_role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, username, email, contact_number, user_role, is_active, created_at",
      [
        username,
        email,
        contactNumber || null,
        passwordHash,
        userRoleToAssign,
        isActive !== undefined ? isActive : true,
      ],
    );

    const newUser = result.rows[0];

    return NextResponse.json(
      {
        message: "User created successfully",
        user: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
