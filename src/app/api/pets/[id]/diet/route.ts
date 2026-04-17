<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { mapRowToPet } from "@/lib/pet-utils";
import { generateDietPlan } from "@/lib/diet";
import {
  predictDietRecommendation,
  type DietPredictionInput,
} from "@/services/dietApi";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function mapActivityLevel(value?: string | null) {
  const level = (value || "").toLowerCase();
  if (level === "high" || level === "active" || level === "working") {
    return "High";
  }
  if (level === "medium" || level === "normal") {
    return "Medium";
  }
  return "Low";
}

function mapFoodType(value?: string | null) {
  const diet = (value || "").toLowerCase();
  if (diet.includes("home")) return "Homemade";
  if (diet.includes("mix")) return "Mixed";
  return "Commercial";
}

function mapYesNo(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = String(value || "")
    .toLowerCase()
    .trim();
  if (normalized === "yes" || normalized === "true" || normalized === "1") {
    return "Yes";
  }
  return "No";
}

// GET /api/pets/:id/diet -> generate diet plan based on stored pet data
export async function GET(
  _request: NextRequest,
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
      weightKg: Number(pet.weightKg ?? 0),
      ageYears: Number(pet.ageYears ?? 0),
      bcs: Number(pet.bcs ?? 5),
      activityLevel: (pet.activityLevel || undefined) as any,
      gender: pet.gender,
      spayedNeutered: pet.spayedNeutered,
      mealsPerDay: Number(pet.mealsPerDay ?? 2),
      digestiveSensitivity:
        typeof pet.digestiveSensitivity === "string"
          ? pet.digestiveSensitivity.toLowerCase() === "true"
          : pet.digestiveSensitivity || null,
      preferredDiet: pet.preferredDiet,
    };

    const dietInput: DietPredictionInput = {
      age: input.ageYears,
      weight_kg: input.weightKg,
      body_condition_score: input.bcs,
      meals_per_day: input.mealsPerDay,
      breed: input.breed || "Unknown",
      gender:
        String(input.gender || "").toLowerCase() === "female"
          ? "Female"
          : "Male",
      neutered_status: mapYesNo(input.spayedNeutered),
      activity_level: mapActivityLevel(String(input.activityLevel || "")),
      digestive_sensitivity: mapYesNo(input.digestiveSensitivity),
      current_food_type: mapFoodType(input.preferredDiet),
    };

    let prediction = null;
    try {
      prediction = await predictDietRecommendation(dietInput);
    } catch (predictionError) {
      console.error("Diet prediction service error:", predictionError);
    }

    const plan = generateDietPlan(input, prediction);
    return NextResponse.json(
      { plan },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error generating diet plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate diet plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
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
=======
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { mapRowToPet } from "@/lib/pet-utils";
import { generateDietPlan } from "@/lib/diet";
import {
  predictDietRecommendation,
  type DietPredictionInput,
} from "@/services/dietApi";

export const runtime = "nodejs";

function mapActivityLevel(value?: string | null) {
  const level = (value || "").toLowerCase();
  if (level === "high" || level === "active" || level === "working") {
    return "High";
  }
  if (level === "medium" || level === "normal") {
    return "Medium";
  }
  return "Low";
}

function mapFoodType(value?: string | null) {
  const diet = (value || "").toLowerCase();
  if (diet.includes("home")) return "Homemade";
  if (diet.includes("mix")) return "Mixed";
  return "Commercial";
}

function mapYesNo(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = String(value || "")
    .toLowerCase()
    .trim();
  if (normalized === "yes" || normalized === "true" || normalized === "1") {
    return "Yes";
  }
  return "No";
}

// GET /api/pets/:id/diet -> generate diet plan based on stored pet data
export async function GET(
  _request: NextRequest,
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
      weightKg: Number(pet.weightKg ?? 0),
      ageYears: Number(pet.ageYears ?? 0),
      bcs: Number(pet.bcs ?? 5),
      activityLevel: (pet.activityLevel || undefined) as any,
      gender: pet.gender,
      spayedNeutered: pet.spayedNeutered,
      mealsPerDay: Number(pet.mealsPerDay ?? 2),
      digestiveSensitivity:
        typeof pet.digestiveSensitivity === "string"
          ? pet.digestiveSensitivity.toLowerCase() === "true"
          : pet.digestiveSensitivity || null,
      preferredDiet: pet.preferredDiet,
    };

    const dietInput: DietPredictionInput = {
      age: input.ageYears,
      weight_kg: input.weightKg,
      body_condition_score: input.bcs,
      meals_per_day: input.mealsPerDay,
      breed: input.breed || "Unknown",
      gender:
        String(input.gender || "").toLowerCase() === "female"
          ? "Female"
          : "Male",
      neutered_status: mapYesNo(input.spayedNeutered),
      activity_level: mapActivityLevel(String(input.activityLevel || "")),
      digestive_sensitivity: mapYesNo(input.digestiveSensitivity),
      current_food_type: mapFoodType(input.preferredDiet),
    };

    let prediction = null;
    try {
      prediction = await predictDietRecommendation(dietInput);
    } catch (predictionError) {
      console.error("Diet prediction service error:", predictionError);
    }

    const plan = generateDietPlan(input, prediction);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error generating diet plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate diet plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
>>>>>>> d95edf6d3d05d354033436e12422e274d5577f55
