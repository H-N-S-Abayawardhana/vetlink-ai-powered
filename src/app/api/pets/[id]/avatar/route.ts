import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import fs from "fs";
import path from "path";

// POST /api/pets/:id/avatar
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { params } = context;
    const { id } = (await params) as { id: string };

    // Validate owner or vet/admin - check pet ownership
    const petResult = await pool.query("SELECT * FROM pets WHERE id = $1", [
      id,
    ]);
    if (petResult.rows.length === 0) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const petRow = petResult.rows[0];
    const userRole = (session.user as any)?.userRole;
    // Cast owner_id to text to match UUID string from session
    const ownerIdStr = petRow.owner_id ? String(petRow.owner_id) : null;
    if (
      ownerIdStr !== session.user.id &&
      userRole !== "SUPER_ADMIN" &&
      userRole !== "VETERINARIAN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { dataUrl } = body;
    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
    }

    // Parse data URL: data:[<mediatype>][;base64],<data>
    const match = dataUrl.match(
      /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/,
    );
    if (!match) {
      return NextResponse.json(
        { error: "Unsupported image format" },
        { status: 400 },
      );
    }

    const mime = match[1];
    const ext = match[2] === "jpeg" ? "jpg" : match[2];
    const base64Data = match[3];

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `pet-${id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
