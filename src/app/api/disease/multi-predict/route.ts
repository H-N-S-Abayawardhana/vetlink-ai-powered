import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MultiDiseaseApiService from "@/services/multiDiseaseApi";
import pool from "@/lib/db";
import type { DiseasePredictionInput } from "@/types/disease-prediction";

// POST /api/disease/multi-predict - Predict multiple disease risks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      age_years,
      breed_size,
      sex,
      is_neutered,
      body_condition_score,
      pale_gums,
      skin_lesions,
      polyuria,
      tick_prevention,
      heartworm_prevention,
      diet_type,
      exercise_level,
      environment,
      pet_id,
    } = body;

    // Validate required fields
    if (
      age_years === undefined ||
      !breed_size ||
      !sex ||
      is_neutered === undefined ||
      body_condition_score === undefined ||
      pale_gums === undefined ||
      skin_lesions === undefined ||
      polyuria === undefined ||
      !tick_prevention ||
      heartworm_prevention === undefined ||
      !diet_type ||
      !exercise_level ||
      !environment
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 },
      );
    }

    // Validate field values
    if (age_years < 0 || age_years > 30) {
      return NextResponse.json(
        { error: "Age must be between 0 and 30 years" },
        { status: 400 },
      );
    }

    if (body_condition_score < 1 || body_condition_score > 9) {
      return NextResponse.json(
        { error: "Body condition score must be between 1 and 9" },
        { status: 400 },
      );
    }

    const validBreedSizes = ["Small", "Medium", "Large"];
    if (!validBreedSizes.includes(breed_size)) {
      return NextResponse.json(
        { error: "Invalid breed size. Must be Small, Medium, or Large" },
        { status: 400 },
      );
    }

    const validSexes = ["Male", "Female"];
    if (!validSexes.includes(sex)) {
      return NextResponse.json(
        { error: "Invalid sex. Must be Male or Female" },
        { status: 400 },
      );
    }

    const validTickPrevention = ["None", "Irregular", "Regular"];
    if (!validTickPrevention.includes(tick_prevention)) {
      return NextResponse.json(
        { error: "Invalid tick prevention value" },
        { status: 400 },
      );
    }

    const validDietTypes = ["Commercial", "Homemade", "Raw", "Mixed"];
    if (!validDietTypes.includes(diet_type)) {
      return NextResponse.json({ error: "Invalid diet type" }, { status: 400 });
    }

    const validExerciseLevels = ["Low", "Moderate", "High"];
    if (!validExerciseLevels.includes(exercise_level)) {
      return NextResponse.json(
        { error: "Invalid exercise level" },
        { status: 400 },
      );
    }

    const validEnvironments = [
      "Indoor",
      "Outdoor",
      "Mixed",
      "Suburban",
      "Rural",
      "Urban",
    ];
    if (!validEnvironments.includes(environment)) {
      return NextResponse.json(
        { error: "Invalid environment type" },
        { status: 400 },
      );
    }

    // Prepare input for disease prediction API
    const input: DiseasePredictionInput = {
      age_years: parseInt(String(age_years), 10),
      breed_size,
      sex,
      is_neutered: Boolean(is_neutered),
      body_condition_score: parseInt(String(body_condition_score), 10),
      pale_gums: Boolean(pale_gums),
      skin_lesions: Boolean(skin_lesions),
      polyuria: Boolean(polyuria),
      tick_prevention,
      heartworm_prevention: Boolean(heartworm_prevention),
      diet_type,
      exercise_level,
      environment,
      pet_id,
    };

    // Call the Hugging Face prediction API
    let result;
    try {
      result = await MultiDiseaseApiService.predictDiseases(input);
    } catch (apiError) {
      console.error("Disease prediction API error:", apiError);
      return NextResponse.json(
        {
          error:
            "Failed to connect to prediction service. Please try again later.",
        },
        { status: 503 },
      );
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Save to database if pet_id is provided
    let analysisId = null;
    if (pet_id && session.user.id) {
      try {
        // Create table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS multi_disease_analyses (
            id SERIAL PRIMARY KEY,
            pet_id INTEGER NOT NULL,
            user_id UUID NOT NULL,
            age_years INTEGER NOT NULL,
            breed_size VARCHAR(20) NOT NULL,
            sex VARCHAR(10) NOT NULL,
            is_neutered BOOLEAN NOT NULL,
            body_condition_score INTEGER NOT NULL,
            pale_gums BOOLEAN NOT NULL,
            skin_lesions BOOLEAN NOT NULL,
            polyuria BOOLEAN NOT NULL,
            tick_prevention VARCHAR(20) NOT NULL,
            heartworm_prevention BOOLEAN NOT NULL,
            diet_type VARCHAR(20) NOT NULL,
            exercise_level VARCHAR(20) NOT NULL,
            environment VARCHAR(20) NOT NULL,
            has_risk BOOLEAN NOT NULL,
            highest_risk_disease VARCHAR(100),
            predictions JSONB NOT NULL,
            recommendations JSONB NOT NULL,
            pet_profile JSONB NOT NULL,
            analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        const dbResult = await pool.query(
          `INSERT INTO multi_disease_analyses (
            pet_id,
            user_id,
            age_years,
            breed_size,
            sex,
            is_neutered,
            body_condition_score,
            pale_gums,
            skin_lesions,
            polyuria,
            tick_prevention,
            heartworm_prevention,
            diet_type,
            exercise_level,
            environment,
            has_risk,
            highest_risk_disease,
            predictions,
            recommendations,
            pet_profile,
            analyzed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING id`,
          [
            pet_id,
            session.user.id,
            input.age_years,
            input.breed_size,
            input.sex,
            input.is_neutered,
            input.body_condition_score,
            input.pale_gums,
            input.skin_lesions,
            input.polyuria,
            input.tick_prevention,
            input.heartworm_prevention,
            input.diet_type,
            input.exercise_level,
            input.environment,
            result.has_risk,
            result.highest_risk_disease,
            JSON.stringify(result.predictions),
            JSON.stringify(result.recommendations),
            JSON.stringify(result.pet_profile),
            result.analyzed_at,
          ],
        );

        analysisId = dbResult.rows[0]?.id;
      } catch (dbError) {
        console.error("Failed to save disease analysis to database:", dbError);
        // Continue without saving - don't fail the request
      }
    }

    return NextResponse.json({
      success: true,
      analysis_id: analysisId,
      result,
    });
  } catch (error) {
    console.error("Multi-disease prediction error:", error);
    return NextResponse.json(
      { error: "Failed to predict diseases. Please try again." },
      { status: 500 },
    );
  }
}
