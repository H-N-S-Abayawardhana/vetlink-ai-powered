import { NextRequest, NextResponse } from "next/server";
import { predictBCS, type BCSPredictionInput } from "@/services/bcsApi";

export const runtime = "nodejs";

const REQUIRED_FIELDS = [
  "breed",
  "age",
  "weight_kg",
  "gender",
  "activity_level",
  "rib_condition",
  "waist",
  "abdominal_tuck",
  "spine_hips",
  "fat_deposits",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => !(field in body));
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
          requiredFields: REQUIRED_FIELDS,
        },
        { status: 400 },
      );
    }

    // Validate input types and values
    if (typeof body.age !== "number" || body.age <= 0) {
      return NextResponse.json(
        { error: "Age must be a positive number" },
        { status: 400 },
      );
    }

    if (typeof body.weight_kg !== "number" || body.weight_kg <= 0) {
      return NextResponse.json(
        { error: "Weight must be a positive number" },
        { status: 400 },
      );
    }

    if (!body.breed || typeof body.breed !== "string") {
      return NextResponse.json(
        { error: "Breed must be a non-empty string" },
        { status: 400 },
      );
    }

    if (!body.gender || typeof body.gender !== "string") {
      return NextResponse.json(
        { error: "Gender must be a non-empty string" },
        { status: 400 },
      );
    }

    // Validate clinical observation fields (should be strings representing ordinal values)
    const clinicalFields = [
      "activity_level",
      "rib_condition",
      "waist",
      "abdominal_tuck",
      "spine_hips",
      "fat_deposits",
    ];

    for (const field of clinicalFields) {
      if (!body[field] || typeof body[field] !== "string") {
        return NextResponse.json(
          { error: `${field} must be a non-empty string` },
          { status: 400 },
        );
      }
    }

    // Create input object for BCS prediction
    const input: BCSPredictionInput = {
      breed: body.breed,
      age: body.age,
      weight_kg: body.weight_kg,
      gender: body.gender,
      activity_level: body.activity_level,
      rib_condition: body.rib_condition,
      waist: body.waist,
      abdominal_tuck: body.abdominal_tuck,
      spine_hips: body.spine_hips,
      fat_deposits: body.fat_deposits,
    };

    // Call the BCS prediction service
    const prediction = await predictBCS(input);

    return NextResponse.json(prediction, { status: 200 });
  } catch (error) {
    console.error("BCS Prediction API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
