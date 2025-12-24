import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Check if user exists
    const userResult = await pool.query(
      "SELECT id, username, email FROM users WHERE email = $1 AND is_active = true",
      [email],
    );

    // Return error if user doesn't exist
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No account found with this email address. Please check your email or sign up for a new account.",
        },
        { status: 404 },
      );
    }

    const user = userResult.rows[0];

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Check if password_reset_tokens table exists, if not create it
    try {
      // Delete any existing reset tokens for this user
      await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
        user.id,
      ]);

      // Insert new reset token
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [user.id, hashedToken, expiresAt],
      );
    } catch (error: any) {
      // If table doesn't exist, create it
      if (error.code === "42P01") {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            used BOOLEAN DEFAULT FALSE
          )
        `);

        // Retry inserting the token
        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [user.id, hashedToken, expiresAt],
        );
      } else {
        throw error;
      }
    }

    // Generate reset URL
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendPasswordResetEmail({
      email: user.email,
      username: user.username,
      resetUrl,
    });

    return NextResponse.json({
      message:
        "Password reset link has been sent to your email address. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
