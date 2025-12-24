import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function safeJsonParse(input: string | null): any | null {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

async function assertPetAccess(petId: string, session: any) {
  const petResult = await pool.query("SELECT * FROM pets WHERE id = $1", [
    petId,
  ]);
  if (petResult.rows.length === 0) {
    return { ok: false as const, status: 404, error: "Pet not found" };
  }
  const petRow = petResult.rows[0];

  const userRole = (session.user as any)?.userRole;
  const ownerIdStr = petRow.owner_id ? String(petRow.owner_id) : null;
  const userIdStr = session.user.id ? String(session.user.id) : null;

  const allowed =
    ownerIdStr === userIdStr ||
    userRole === "SUPER_ADMIN" ||
    userRole === "VETERINARIAN";
  if (!allowed) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, petRow };
}

function ensureArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [];
}

function makeRecordId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// GET /api/pets/:id/skin-disease - list scan records for a pet
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const access = await assertPetAccess(id, session);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const result = await pool.query(
      "SELECT skin_disease_history FROM pets WHERE id = $1",
      [id],
    );
    const row = result.rows?.[0];
    const history = ensureArray(row?.skin_disease_history);

    // Normalize and sort newest first
    const records = history
      .map((r: any) => ({
        id: String(r?.id ?? ""),
        petId: String(id),
        ownerId: access.petRow.owner_id ? String(access.petRow.owner_id) : null,
        disease: String(r?.disease ?? ""),
        confidence: r?.confidence != null ? Number(r.confidence) : null,
        allProbabilities: r?.allProbabilities ?? null,
        imageUrl: r?.imageUrl ?? null,
        createdAt: r?.createdAt ?? null,
      }))
      .filter((r: any) => r.id && r.disease)
      .sort((a: any, b: any) => {
        const at = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bt - at;
      });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error listing skin disease records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pets/:id/skin-disease - create a scan record + upload affected image
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const access = await assertPetAccess(id, session);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const disease = String(formData.get("disease") || "").trim();
    const confidenceRaw = formData.get("confidence");
    const allProbRaw = formData.get("allProbabilities");

    if (!disease) {
      return NextResponse.json(
        { error: "Disease is required" },
        { status: 400 },
      );
    }

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    const confidence =
      confidenceRaw === null ||
      confidenceRaw === undefined ||
      confidenceRaw === ""
        ? null
        : Number(confidenceRaw);

    const allProbabilities =
      typeof allProbRaw === "string"
        ? safeJsonParse(allProbRaw)
        : safeJsonParse(String(allProbRaw || ""));

    // Save image to public/uploads/skin-disease
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "skin-disease",
    );
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const mime = image.type || "application/octet-stream";
    const ext = extFromMime(mime);
    const filename = `skin-${id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const arrayBuffer = await image.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    const imageUrl = `/uploads/skin-disease/${filename}`;

    const ownerId = access.petRow.owner_id
      ? String(access.petRow.owner_id)
      : null;
    if (!ownerId)
      return NextResponse.json(
        { error: "Pet owner not found" },
        { status: 400 },
      );

    const recordPayload = {
      id: makeRecordId(),
      disease,
      confidence,
      allProbabilities: allProbabilities ?? null,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    // Append record into pets.skin_disease_history (JSONB array)
    await pool.query(
      `UPDATE pets
       SET skin_disease_history = COALESCE(skin_disease_history, '[]'::jsonb) || $1::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify([recordPayload]), id],
    );

    const record = {
      ...recordPayload,
      petId: String(id),
      ownerId,
    };

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Error creating skin disease record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
