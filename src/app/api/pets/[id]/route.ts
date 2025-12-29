import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { mapRowToPet } from "@/lib/pet-utils";
import {
  deleteFromS3ByUrl,
  deleteMultipleFromS3ByUrls,
  isS3Url,
} from "@/lib/s3";

// get pet details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await pool.query("SELECT * FROM pets WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const petRow = result.rows[0];
    const pet = mapRowToPet(petRow);
    const userRole = (session.user as any)?.userRole;
    const ownerIdStr = petRow.owner_id ? String(petRow.owner_id) : null;
    if (
      ownerIdStr !== session.user.id &&
      userRole !== "SUPER_ADMIN" &&
      userRole !== "VETERINARIAN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ pet });
  } catch (error) {
    console.error("Error fetching pet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// update a pet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = await pool.query("SELECT * FROM pets WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const petRow = result.rows[0];
    const pet = mapRowToPet(petRow);
    const userRole = (session.user as any)?.userRole;
    const ownerIdStr = petRow.owner_id ? String(petRow.owner_id) : null;
    if (ownerIdStr !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      type,
      name,
      breed,
      weightKg,
      bcs,
      bcsCalculatedAt,
      activityLevel,
      ageYears,
      gender,
      allergies,
      preferredDiet,
      livingEnvironment,
      healthNotes,
      avatarDataUrl,
    } = body;
    const updateResult = await pool.query(
      `UPDATE pets SET type=$1, name=$2, breed=$3, weight_kg=$4, bcs=$5, bcs_calculated_at=$6, activity_level=$7, age_years=$8, gender=$9, allergies=$10, preferred_diet=$11, living_environment=$12, health_notes=$13, avatar_url=$14, updated_at=CURRENT_TIMESTAMP WHERE id=$15 RETURNING *`,
      [
        type || petRow.type,
        name || petRow.name,
        breed || petRow.breed,
        weightKg ?? petRow.weight_kg,
        bcs ?? petRow.bcs,
        bcsCalculatedAt ?? petRow.bcs_calculated_at,
        activityLevel || petRow.activity_level,
        ageYears ?? petRow.age_years,
        gender || petRow.gender,
        allergies && Array.isArray(allergies)
          ? allergies
          : allergies
            ? [allergies]
            : petRow.allergies,
        preferredDiet || petRow.preferred_diet,
        livingEnvironment || petRow.living_environment,
        healthNotes || petRow.health_notes,
        avatarDataUrl || petRow.avatar_url,
        id,
      ],
    );

    return NextResponse.json({ pet: mapRowToPet(updateResult.rows[0]) });
  } catch (error) {
    console.error("Error updating pet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// delete a pet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await pool.query("SELECT * FROM pets WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const pet = result.rows[0];
    const userRole = (session.user as any)?.userRole;
    const ownerIdStr = pet.owner_id ? String(pet.owner_id) : null;
    if (ownerIdStr !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Collect all S3 URLs to delete
    const s3UrlsToDelete: string[] = [];

    // 1. Delete pet avatar if it's an S3 URL
    if (pet.avatar_url && isS3Url(pet.avatar_url)) {
      s3UrlsToDelete.push(pet.avatar_url);
    }

    //  Delete all skin disease images from S3
    if (pet.skin_disease_history) {
      try {
        const history = Array.isArray(pet.skin_disease_history)
          ? pet.skin_disease_history
          : [];

        history.forEach((record: any) => {
          if (record?.imageUrl && isS3Url(record.imageUrl)) {
            s3UrlsToDelete.push(record.imageUrl);
          }
        });
      } catch (e) {
        console.error("Error parsing skin_disease_history:", e);
      }
    }

    // Delete all S3 objects
    if (s3UrlsToDelete.length > 0) {
      try {
        const deletedCount = await deleteMultipleFromS3ByUrls(s3UrlsToDelete);
      } catch (e) {
        console.error("Error deleting S3 objects:", e);
      }
    }

    // Delete from database
    await pool.query("DELETE FROM pets WHERE id = $1", [id]);
    return NextResponse.json({ message: "Pet deleted" });
  } catch (error) {
    console.error("Error deleting pet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = await pool.query("SELECT * FROM pets WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    const petRow = result.rows[0];
    const userRole = (session.user as any)?.userRole;
    const ownerIdStr = petRow.owner_id ? String(petRow.owner_id) : null;
    if (ownerIdStr !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build dynamic update
    const allowedFields = {
      type: "type",
      name: "name",
      breed: "breed",
      weightKg: "weight_kg",
      bcs: "bcs",
      bcsCalculatedAt: "bcs_calculated_at",
      activityLevel: "activity_level",
      ageYears: "age_years",
      gender: "gender",
      allergies: "allergies",
      preferredDiet: "preferred_diet",
      healthNotes: "health_notes",
      vaccinationStatus: "vaccination_status",
      avatarDataUrl: "avatar_url",
    } as Record<string, string>;

    const keys = Object.keys(body).filter((k) =>
      Object.keys(allowedFields).includes(k),
    );
    if (keys.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    keys.forEach((k, idx) => {
      const col = allowedFields[k];
      setClauses.push(`${col} = $${idx + 1}`);
      let val = (body as any)[k];
      if (k === "allergies" && !Array.isArray(val)) {
        val = val ? [val] : [];
      }
      values.push(val);
    });
    // push id as last param
    const sql = `UPDATE pets SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const updateRes = await pool.query(sql, values);
    return NextResponse.json({ pet: mapRowToPet(updateRes.rows[0]) });
  } catch (error) {
    console.error("Error patching pet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
