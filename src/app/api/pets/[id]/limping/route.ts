import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { uploadVideoToS3, deleteMultipleFromS3ByUrls, isS3Url, isLocalUrl } from "@/lib/s3";

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
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/webm") return "webm";
  if (mime === "video/x-msvideo") return "avi";
  return "mp4";
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

// list of limping history for a pet
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
      "SELECT limping_history FROM pets WHERE id = $1",
      [id],
    );
    const row = result.rows?.[0];
    const history = ensureArray(row?.limping_history);

    // Normalize and sort newest first
    const records = history
      .map((r: any) => ({
        id: String(r?.id ?? ""),
        petId: String(id),
        ownerId: access.petRow.owner_id ? String(access.petRow.owner_id) : null,
        // Limping detection results
        limpingClass: String(r?.limpingClass ?? ""),
        limpingConfidence:
          r?.limpingConfidence != null ? Number(r.limpingConfidence) : null,
        limpingSiFront:
          r?.limpingSiFront != null ? Number(r.limpingSiFront) : null,
        limpingSiBack:
          r?.limpingSiBack != null ? Number(r.limpingSiBack) : null,
        limpingSiOverall:
          r?.limpingSiOverall != null ? Number(r.limpingSiOverall) : null,
        // Form data
        ageYears: r?.ageYears != null ? Number(r.ageYears) : null,
        weightCategory: String(r?.weightCategory ?? ""),
        limpingDetected:
          r?.limpingDetected != null ? Number(r.limpingDetected) : null,
        painWhileWalking:
          r?.painWhileWalking != null ? Number(r.painWhileWalking) : null,
        difficultyStanding:
          r?.difficultyStanding != null ? Number(r.difficultyStanding) : null,
        reducedActivity:
          r?.reducedActivity != null ? Number(r.reducedActivity) : null,
        jointSwelling:
          r?.jointSwelling != null ? Number(r.jointSwelling) : null,
        // Disease prediction results
        predictedDisease: String(r?.predictedDisease ?? ""),
        diseaseConfidence:
          r?.diseaseConfidence != null ? Number(r.diseaseConfidence) : null,
        riskLevel: String(r?.riskLevel ?? ""),
        symptomScore: r?.symptomScore != null ? Number(r.symptomScore) : null,
        painSeverity: r?.painSeverity != null ? Number(r.painSeverity) : null,
        recommendations: r?.recommendations ?? null,
        // Video URL
        videoUrl: r?.videoUrl ?? null,
        createdAt: r?.createdAt ?? null,
      }))
      .filter((r: any) => r.id)
      .sort((a: any, b: any) => {
        const at = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bt - at;
      });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error listing limping records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// create a limping record + upload video
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
    const video = formData.get("video");

    // Limping detection results
    const limpingClass = String(formData.get("limpingClass") || "").trim();
    const limpingConfidenceRaw = formData.get("limpingConfidence");
    const limpingSiFrontRaw = formData.get("limpingSiFront");
    const limpingSiBackRaw = formData.get("limpingSiBack");
    const limpingSiOverallRaw = formData.get("limpingSiOverall");

    // Form data
    const ageYearsRaw = formData.get("ageYears");
    const weightCategory = String(formData.get("weightCategory") || "").trim();
    const limpingDetectedRaw = formData.get("limpingDetected");
    const painWhileWalkingRaw = formData.get("painWhileWalking");
    const difficultyStandingRaw = formData.get("difficultyStanding");
    const reducedActivityRaw = formData.get("reducedActivity");
    const jointSwellingRaw = formData.get("jointSwelling");

    // Disease prediction results
    const predictedDisease = String(
      formData.get("predictedDisease") || "",
    ).trim();
    const diseaseConfidenceRaw = formData.get("diseaseConfidence");
    const riskLevel = String(formData.get("riskLevel") || "").trim();
    const symptomScoreRaw = formData.get("symptomScore");
    const painSeverityRaw = formData.get("painSeverity");
    const recommendationsRaw = formData.get("recommendations");

    if (!predictedDisease) {
      return NextResponse.json(
        { error: "Predicted disease is required" },
        { status: 400 },
      );
    }

    // Parse numeric values
    const limpingConfidence =
      limpingConfidenceRaw === null ||
      limpingConfidenceRaw === undefined ||
      limpingConfidenceRaw === ""
        ? null
        : Number(limpingConfidenceRaw);
    const limpingSiFront =
      limpingSiFrontRaw === null ||
      limpingSiFrontRaw === undefined ||
      limpingSiFrontRaw === ""
        ? null
        : Number(limpingSiFrontRaw);
    const limpingSiBack =
      limpingSiBackRaw === null ||
      limpingSiBackRaw === undefined ||
      limpingSiBackRaw === ""
        ? null
        : Number(limpingSiBackRaw);
    const limpingSiOverall =
      limpingSiOverallRaw === null ||
      limpingSiOverallRaw === undefined ||
      limpingSiOverallRaw === ""
        ? null
        : Number(limpingSiOverallRaw);
    const ageYears =
      ageYearsRaw === null || ageYearsRaw === undefined || ageYearsRaw === ""
        ? null
        : Number(ageYearsRaw);
    const limpingDetected =
      limpingDetectedRaw === null ||
      limpingDetectedRaw === undefined ||
      limpingDetectedRaw === ""
        ? null
        : Number(limpingDetectedRaw);
    const painWhileWalking =
      painWhileWalkingRaw === null ||
      painWhileWalkingRaw === undefined ||
      painWhileWalkingRaw === ""
        ? null
        : Number(painWhileWalkingRaw);
    const difficultyStanding =
      difficultyStandingRaw === null ||
      difficultyStandingRaw === undefined ||
      difficultyStandingRaw === ""
        ? null
        : Number(difficultyStandingRaw);
    const reducedActivity =
      reducedActivityRaw === null ||
      reducedActivityRaw === undefined ||
      reducedActivityRaw === ""
        ? null
        : Number(reducedActivityRaw);
    const jointSwelling =
      jointSwellingRaw === null ||
      jointSwellingRaw === undefined ||
      jointSwellingRaw === ""
        ? null
        : Number(jointSwellingRaw);
    const diseaseConfidence =
      diseaseConfidenceRaw === null ||
      diseaseConfidenceRaw === undefined ||
      diseaseConfidenceRaw === ""
        ? null
        : Number(diseaseConfidenceRaw);
    const symptomScore =
      symptomScoreRaw === null ||
      symptomScoreRaw === undefined ||
      symptomScoreRaw === ""
        ? null
        : Number(symptomScoreRaw);
    const painSeverity =
      painSeverityRaw === null ||
      painSeverityRaw === undefined ||
      painSeverityRaw === ""
        ? null
        : Number(painSeverityRaw);

    const recommendations =
      typeof recommendationsRaw === "string"
        ? safeJsonParse(recommendationsRaw)
        : safeJsonParse(String(recommendationsRaw || ""));

    // Upload video to S3 if provided
    let videoUrl: string | null = null;
    if (video instanceof File) {
      const mime = video.type || "video/mp4";
      const ext = extFromMime(mime);
      const filename = `limping-${id}-${Date.now()}.${ext}`;

      const arrayBuffer = await video.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3 and get the URL
      videoUrl = await uploadVideoToS3(buffer, filename, mime);
    }

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
      limpingClass: limpingClass || null,
      limpingConfidence,
      limpingSiFront,
      limpingSiBack,
      limpingSiOverall,
      ageYears,
      weightCategory: weightCategory || null,
      limpingDetected,
      painWhileWalking,
      difficultyStanding,
      reducedActivity,
      jointSwelling,
      predictedDisease,
      diseaseConfidence,
      riskLevel: riskLevel || null,
      symptomScore,
      painSeverity,
      recommendations: recommendations ?? null,
      videoUrl,
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `UPDATE pets
       SET limping_history = COALESCE(limping_history, '[]'::jsonb) || $1::jsonb,
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
    console.error("Error creating limping record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// clear all limping history for a pet
export async function DELETE(
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
      "SELECT limping_history FROM pets WHERE id = $1",
      [id],
    );
    const row = result.rows?.[0];
    const history = ensureArray(row?.limping_history);

    const urlsToDelete: string[] = [];
    history.forEach((record: any) => {
      if (record?.videoUrl && (isS3Url(record.videoUrl) || isLocalUrl(record.videoUrl))) {
        urlsToDelete.push(record.videoUrl);
      }
    });

    // Delete all videos (S3 or local)
    if (urlsToDelete.length > 0) {
      try {
        const deletedCount = await deleteMultipleFromS3ByUrls(urlsToDelete);
        console.log(`Deleted ${deletedCount} of ${urlsToDelete.length} videos`);
      } catch (e) {
        console.error("Error deleting videos:", e);
      }
    }

    await pool.query(
      `UPDATE pets
       SET limping_history = '[]'::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    );

    return NextResponse.json({ message: "Limping history cleared" });
  } catch (error) {
    console.error("Error clearing limping history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
