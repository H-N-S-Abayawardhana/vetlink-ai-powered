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
      weight_kg,
      breed_size,
      neutered_status,

      activity_level,
      daily_exercise_minutes,
      diet_type,
      fatty_food_frequency,
      treat_frequency,

      body_condition_score,

      water_intake,
      urination,
      appetite_change,
      vomiting,
      digestive_issues,
      lethargy,
      pet_id,
    } = body;

    // Validate required fields
    if (
      age_years === undefined ||
      weight_kg === undefined ||
      !breed_size ||
      !neutered_status ||
      !activity_level ||
      daily_exercise_minutes === undefined ||
      !diet_type ||
      !fatty_food_frequency ||
      !treat_frequency ||
      body_condition_score === undefined ||
      !water_intake ||
      !urination ||
      !appetite_change ||
      !vomiting ||
      !digestive_issues ||
      !lethargy
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

    if (weight_kg <= 0 || weight_kg > 120) {
      return NextResponse.json(
        { error: "Weight must be between 0 and 120 kg" },
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

    const validYesNo = ["Yes", "No"];
    if (!validYesNo.includes(neutered_status)) {
      return NextResponse.json(
        { error: "Invalid neutered status. Must be Yes or No" },
        { status: 400 },
      );
    }

    const validActivityLevels = ["Low", "Moderate", "High"];
    if (!validActivityLevels.includes(activity_level)) {
      return NextResponse.json(
        { error: "Invalid activity level" },
        { status: 400 },
      );
    }

    if (daily_exercise_minutes < 0 || daily_exercise_minutes > 600) {
      return NextResponse.json(
        { error: "Daily exercise minutes must be between 0 and 600" },
        { status: 400 },
      );
    }

    const validDietTypes = ["Dry", "Wet", "Mixed", "Homemade"];
    if (!validDietTypes.includes(diet_type)) {
      return NextResponse.json({ error: "Invalid diet type" }, { status: 400 });
    }

    const validFattyFood = ["Low", "Moderate", "High"];
    if (!validFattyFood.includes(fatty_food_frequency)) {
      return NextResponse.json(
        { error: "Invalid fatty food frequency" },
        { status: 400 },
      );
    }

    const validTreatFrequency = ["Rare", "Moderate", "Frequent"];
    if (!validTreatFrequency.includes(treat_frequency)) {
      return NextResponse.json(
        { error: "Invalid treat frequency" },
        { status: 400 },
      );
    }

    const validWaterIntake = ["Low", "Normal", "High"];
    if (!validWaterIntake.includes(water_intake)) {
      return NextResponse.json(
        { error: "Invalid water intake" },
        { status: 400 },
      );
    }

    const validUrination = ["Normal", "Frequent", "Difficult"];
    if (!validUrination.includes(urination)) {
      return NextResponse.json(
        { error: "Invalid urination value" },
        { status: 400 },
      );
    }

    const validAppetite = ["Decreased", "Normal", "Increased"];
    if (!validAppetite.includes(appetite_change)) {
      return NextResponse.json(
        { error: "Invalid appetite change value" },
        { status: 400 },
      );
    }

    if (!validYesNo.includes(vomiting) || !validYesNo.includes(lethargy)) {
      return NextResponse.json(
        { error: "Invalid vomiting/lethargy value. Must be Yes or No" },
        { status: 400 },
      );
    }

    const validDigestiveIssues = ["None", "Mild", "Severe"];
    if (!validDigestiveIssues.includes(digestive_issues)) {
      return NextResponse.json(
        { error: "Invalid digestive issues value" },
        { status: 400 },
      );
    }

    // Prepare input for disease prediction API
    const input: DiseasePredictionInput = {
      age_years: parseInt(String(age_years), 10),
      weight_kg: parseFloat(String(weight_kg)),
      breed_size,
      neutered_status,
      activity_level,
      daily_exercise_minutes: parseInt(String(daily_exercise_minutes), 10),
      diet_type,
      fatty_food_frequency,
      treat_frequency,
      body_condition_score: parseInt(String(body_condition_score), 10),
      water_intake,
      urination,
      appetite_change,
      vomiting,
      digestive_issues,
      lethargy,
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
          CREATE TABLE IF NOT EXISTS metabolic_risk_analyses (
            id SERIAL PRIMARY KEY,
            pet_id INTEGER NOT NULL,
            user_id UUID NOT NULL,
            age_years INTEGER NOT NULL,
            weight_kg DOUBLE PRECISION NOT NULL,
            breed_size VARCHAR(20) NOT NULL,
            neutered_status VARCHAR(5) NOT NULL,
            activity_level VARCHAR(20) NOT NULL,
            daily_exercise_minutes INTEGER NOT NULL,
            diet_type VARCHAR(10) NOT NULL,
            fatty_food_frequency VARCHAR(20) NOT NULL,
            treat_frequency VARCHAR(20) NOT NULL,
            body_condition_score INTEGER NOT NULL,
            water_intake VARCHAR(20) NOT NULL,
            urination VARCHAR(20) NOT NULL,
            appetite_change VARCHAR(20) NOT NULL,
            vomiting VARCHAR(5) NOT NULL,
            digestive_issues VARCHAR(20) NOT NULL,
            lethargy VARCHAR(5) NOT NULL,
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
          `INSERT INTO metabolic_risk_analyses (
            pet_id,
            user_id,
            age_years,
            weight_kg,
            breed_size,
            neutered_status,
            activity_level,
            daily_exercise_minutes,
            diet_type,
            fatty_food_frequency,
            treat_frequency,
            body_condition_score,
            water_intake,
            urination,
            appetite_change,
            vomiting,
            digestive_issues,
            lethargy,
            has_risk,
            highest_risk_disease,
            predictions,
            recommendations,
            pet_profile,
            analyzed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          RETURNING id`,
          [
            pet_id,
            session.user.id,
            input.age_years,
            input.weight_kg,
            input.breed_size,
            input.neutered_status,
            input.activity_level,
            input.daily_exercise_minutes,
            input.diet_type,
            input.fatty_food_frequency,
            input.treat_frequency,
            input.body_condition_score,
            input.water_intake,
            input.urination,
            input.appetite_change,
            input.vomiting,
            input.digestive_issues,
            input.lethargy,
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
