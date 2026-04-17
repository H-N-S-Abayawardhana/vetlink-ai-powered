import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Check if token exists and is valid
    const result = await pool.query(
      `SELECT prt.*, u.email, u.username
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 
         AND prt.expires_at > CURRENT_TIMESTAMP 
         AND prt.used = FALSE
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [hashedToken],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      email: result.rows[0].email,
    });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
