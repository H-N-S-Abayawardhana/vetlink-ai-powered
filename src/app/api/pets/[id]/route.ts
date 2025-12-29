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
      microchipNumber,
      microchipImplantDate,
      spayedNeutered,
      spayNeuterDate,
      bloodType,
      dateOfBirth,
      ownerPhone,
      secondaryContactName,
      secondaryContactPhone,
      vetClinicName,
      vetClinicPhone,
      avatarDataUrl,
    } = body;
    const updateResult = await pool.query(
      `UPDATE pets SET
         name=$1, breed=$2, weight_kg=$3, bcs=$4, bcs_calculated_at=$5, activity_level=$6, age_years=$7, gender=$8,
         allergies=$9, preferred_diet=$10, living_environment=$11, health_notes=$12,
         microchip_number=$13, microchip_implant_date=$14, spayed_neutered=$15, spay_neuter_date=$16, blood_type=$17, date_of_birth=$18,
         owner_phone=$19, secondary_contact_name=$20, secondary_contact_phone=$21, vet_clinic_name=$22, vet_clinic_phone=$23,
         avatar_url=$24, updated_at=CURRENT_TIMESTAMP
       WHERE id=$25 RETURNING *`,
      [
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
        microchipNumber ?? petRow.microchip_number,
        microchipImplantDate ?? petRow.microchip_implant_date,
        spayedNeutered ?? petRow.spayed_neutered,
        spayNeuterDate ?? petRow.spay_neuter_date,
        bloodType ?? petRow.blood_type,
        dateOfBirth ?? petRow.date_of_birth,
        ownerPhone ?? petRow.owner_phone,
        secondaryContactName ?? petRow.secondary_contact_name,
        secondaryContactPhone ?? petRow.secondary_contact_phone,
        vetClinicName ?? petRow.vet_clinic_name,
        vetClinicPhone ?? petRow.vet_clinic_phone,
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
      microchipNumber: "microchip_number",
      microchipImplantDate: "microchip_implant_date",
      spayedNeutered: "spayed_neutered",
      spayNeuterDate: "spay_neuter_date",
      bloodType: "blood_type",
      dateOfBirth: "date_of_birth",
      ownerPhone: "owner_phone",
      secondaryContactName: "secondary_contact_name",
      secondaryContactPhone: "secondary_contact_phone",
      vetClinicName: "vet_clinic_name",
      vetClinicPhone: "vet_clinic_phone",
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
