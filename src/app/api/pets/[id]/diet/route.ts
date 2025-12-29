import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { mapRowToPet } from "@/lib/pet-utils";
import { generateDietPlan } from "@/lib/diet";

// GET /api/pets/:id/diet -> generate diet plan based on stored pet data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const res = await pool.query("SELECT * FROM pets WHERE id = $1", [id]);
    if (res.rows.length === 0)
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });

    const petRow = res.rows[0];
    const pet = mapRowToPet(petRow);

    // Authorization: owner or vet/admin
    // Cast owner_id to text to match UUID string from session
    const userRole = (session.user as any)?.userRole;
    const ownerIdStr = petRow.owner_id ? String(petRow.owner_id) : null;
    if (
      ownerIdStr !== session.user.id &&
      userRole !== "SUPER_ADMIN" &&
      userRole !== "VETERINARIAN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const input = {
      id: pet.id,
      name: pet.name,
      breed: pet.breed,
      weightKg: pet.weightKg ?? 0,
      ageYears: pet.ageYears ?? null,
      bcs: pet.bcs ?? null,
      activityLevel: (pet.activityLevel || undefined) as any,
    };

    const plan = generateDietPlan(input);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error generating diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pets/:id/diet -> persist a generated plan (body: { plan, targetWeightKg?, timelineWeeks? })
// Persistence of diet plans has been removed. POST is no longer supported for this route.
export async function POST() {
  return NextResponse.json(
    { error: "Persistence of diet plans has been disabled on this server" },
    { status: 405 },
  );
}
