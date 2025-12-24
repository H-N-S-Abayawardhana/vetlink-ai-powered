import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
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

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `SELECT prt.*, u.id as user_id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 
         AND prt.expires_at > CURRENT_TIMESTAMP 
         AND prt.used = FALSE
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [hashedToken],
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const tokenData = tokenResult.rows[0];
    const userId = tokenData.user_id;

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [passwordHash, userId],
    );

    // Mark token as used
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
      [tokenData.id],
    );

    // Delete all other unused tokens for this user
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = FALSE AND id != $2",
      [userId, tokenData.id],
    );

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
