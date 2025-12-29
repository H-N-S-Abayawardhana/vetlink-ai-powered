import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { mapRowToPet } from "@/lib/pet-utils";
import { UserRole } from "@/types/next-auth";

// GET /api/pets - list pets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userRole = ((session.user as any)?.userRole as UserRole) || "USER";

    // Support optional filtering by type via query param (e.g. ?type=dog)
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get("type");

    if (userRole === "SUPER_ADMIN") {
      if (typeFilter) {
        const result = await pool.query(
          `SELECT p.*, u.username AS owner_username, u.email AS owner_email
           FROM pets p
           LEFT JOIN users u ON u.id::text = p.owner_id::text
           WHERE p.type = $1
           ORDER BY p.created_at DESC`,
          [typeFilter],
        );
        const pets = result.rows.map((row) => ({
          ...mapRowToPet(row),
          ownerUsername: row.owner_username ?? null,
          ownerEmail: row.owner_email ?? null,
        }));
        return NextResponse.json({ pets });
      }
      const result = await pool.query(
        `SELECT p.*, u.username AS owner_username, u.email AS owner_email
         FROM pets p
         LEFT JOIN users u ON u.id::text = p.owner_id::text
         ORDER BY p.created_at DESC`,
      );
      const pets = result.rows.map((row) => ({
        ...mapRowToPet(row),
        ownerUsername: row.owner_username ?? null,
        ownerEmail: row.owner_email ?? null,
      }));
      return NextResponse.json({ pets });
    }

    if (userRole === "VETERINARIAN") {
      if (typeFilter) {
        const result = await pool.query(
          `SELECT p.*, u.username AS owner_username, u.email AS owner_email
           FROM pets p
           LEFT JOIN users u ON u.id::text = p.owner_id::text
           WHERE p.type = $1
           ORDER BY p.created_at DESC`,
          [typeFilter],
        );
        const pets = result.rows.map((row) => ({
          ...mapRowToPet(row),
          ownerUsername: row.owner_username ?? null,
          ownerEmail: row.owner_email ?? null,
        }));
        return NextResponse.json({ pets });
      }
      const result = await pool.query(
        `SELECT p.*, u.username AS owner_username, u.email AS owner_email
         FROM pets p
         LEFT JOIN users u ON u.id::text = p.owner_id::text
         ORDER BY p.created_at DESC`,
      );
      const pets = result.rows.map((row) => ({
        ...mapRowToPet(row),
        ownerUsername: row.owner_username ?? null,
        ownerEmail: row.owner_email ?? null,
      }));
      return NextResponse.json({ pets });
    }

    // Regular users: only their pets (optionally filter by type)
    // Cast owner_id to text to match UUID string from session
    if (typeFilter) {
      const result = await pool.query(
        "SELECT * FROM pets WHERE owner_id::text = $1 AND type = $2 ORDER BY created_at DESC",
        [session.user.id, typeFilter],
      );
      const pets = result.rows.map(mapRowToPet);
      return NextResponse.json({ pets });
    }

    const result = await pool.query(
      "SELECT * FROM pets WHERE owner_id::text = $1 ORDER BY created_at DESC",
      [session.user.id],
    );
    const pets = result.rows.map(mapRowToPet);
    return NextResponse.json({ pets });
  } catch (error) {
    console.error("Error fetching pets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pets - create a new pet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only USER role can add pets
    const userRole = ((session.user as any)?.userRole as UserRole) || "USER";
    if (userRole !== "USER") {
      return NextResponse.json(
        { error: "Only regular users can add pets" },
        { status: 403 },
      );
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
      livingEnvironment,
      healthNotes,
      vaccinationStatus,
      avatarDataUrl,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Insert pet with owner_id - session.user.id is UUID string
    // If owner_id column is UUID, PostgreSQL will handle the conversion
    // If owner_id is still BIGINT, you need to run the migration script first
    const result = await pool.query(
      `INSERT INTO pets (owner_id, type, name, breed, weight_kg, activity_level, age_years, gender, allergies, preferred_diet, living_environment, health_notes, vaccination_status, avatar_url, created_at, updated_at)
       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        session.user.id,
        type || "dog",
        name,
        breed || null,
        weightKg ?? null,
        activityLevel || null,
        ageYears ?? null,
        gender || null,
        allergies && Array.isArray(allergies)
          ? allergies
          : allergies
            ? [allergies]
            : [],
        preferredDiet || null,
        livingEnvironment || null,
        healthNotes || null,
        vaccinationStatus || null,
        avatarDataUrl || null,
      ],
    );

    const pet = mapRowToPet(result.rows[0]);
    return NextResponse.json({ pet });
  } catch (error) {
    console.error("Error creating pet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
