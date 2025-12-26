import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GaitApiService, {
  DiseasePredictionInput,
  DiseasePredictionResult,
} from "@/services/gaitApi";
import pool from "@/lib/db";

// POST /api/disease/predict - Predict disease risk
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      limping_detected,
      age_years,
      weight_category,
      pain_while_walking,
      difficulty_standing,
      reduced_activity,
      joint_swelling,
      limping_analysis_result, // Optional: results from limping detection
      pet_id, // Optional: link to pet
    } = body;

    // Validate required fields
    if (
      limping_detected === undefined ||
      !age_years ||
      !weight_category ||
      pain_while_walking === undefined ||
      difficulty_standing === undefined ||
      reduced_activity === undefined ||
      joint_swelling === undefined
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 },
      );
    }

    // Prepare input for disease prediction API
    const input: DiseasePredictionInput = {
      Limping_Detected: parseInt(limping_detected),
      Age_Years: parseInt(age_years),
      Weight_Category: weight_category,
      Pain_While_Walking: parseInt(pain_while_walking),
      Difficulty_Standing: parseInt(difficulty_standing),
      Reduced_Activity: parseInt(reduced_activity),
      Joint_Swelling: parseInt(joint_swelling),
    };

    // Call Hugging Face disease prediction API
    const result: DiseasePredictionResult =
      await GaitApiService.predictDisease(input);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Calculate additional metadata
    const symptom_score =
      input.Pain_While_Walking +
      input.Difficulty_Standing +
      input.Reduced_Activity +
      input.Joint_Swelling;

    const age_group =
      input.Age_Years <= 3
        ? "Puppy"
        : input.Age_Years <= 7
          ? "Adult"
          : input.Age_Years <= 11
            ? "Senior"
            : "Geriatric";

    const high_risk_profile =
      input.Age_Years > 10 && input.Weight_Category === "Heavy";
    const mobility_impaired =
      input.Limping_Detected === 1 && input.Difficulty_Standing === 1;

    // Save to database if pet_id is provided
    let analysisId = null;
    if (pet_id && session.user.id) {
      try {
        const dbResult = await pool.query(
          `INSERT INTO gait_analyses (
            pet_id,
            user_id,
            age_years,
            weight_category,
            limping_detected,
            pain_while_walking,
            difficulty_standing,
            reduced_activity,
            joint_swelling,
            limping_class,
            limping_confidence,
            limping_si_front,
            limping_si_back,
            limping_si_overall,
            predicted_disease,
            disease_confidence,
            risk_level,
            symptom_score,
            pain_severity,
            recommendations,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
          RETURNING id`,
          [
            pet_id,
            session.user.id,
            input.Age_Years,
            input.Weight_Category,
            input.Limping_Detected,
            input.Pain_While_Walking,
            input.Difficulty_Standing,
            input.Reduced_Activity,
            input.Joint_Swelling,
            limping_analysis_result?.class || "Unknown",
            limping_analysis_result?.confidence || null,
            limping_analysis_result?.SI_front || null,
            limping_analysis_result?.SI_back || null,
            limping_analysis_result?.SI_overall || null,
            result.predicted_disease,
            result.confidence,
            result.risk_level,
            symptom_score,
            result.pain_severity,
            JSON.stringify(result.recommendations),
          ],
        );
        analysisId = dbResult.rows[0].id;
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        // Continue even if DB save fails
      }
    }

    return NextResponse.json({
      success: true,
      prediction: {
        predicted_disease: result.predicted_disease,
        confidence: result.confidence,
        risk_level: result.risk_level,
        symptom_score: symptom_score,
        pain_severity: result.pain_severity,
        recommendations: result.recommendations,
        age_group: age_group,
        risk_profile: high_risk_profile ? "High" : "Normal",
        mobility_status: mobility_impaired ? "Impaired" : "Normal",
      },
      analysis_id: analysisId,
    });
  } catch (error) {
    console.error("Error predicting disease:", error);
    return NextResponse.json(
      {
        error: "Failed to predict disease",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
