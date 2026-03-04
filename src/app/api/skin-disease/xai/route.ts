import { NextRequest, NextResponse } from "next/server";
import { buildSkinDiseaseXAIExplanation } from "@/lib/skin-disease-xai";

/**
 * XAI endpoint: returns a reason-based explanation of why the model
 * predicted this disease and severity. Uses only model outputs (confidence,
 * probabilities) and optional pet context — no LLM, no API key required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disease, severity, confidence, all_probabilities, pet } = body as {
      disease: string;
      severity: string | null;
      confidence: number;
      all_probabilities?: Record<string, number> | null;
      pet?: { name?: string; breed?: string; ageYears?: number } | null;
    };

    if (!disease) {
      return NextResponse.json(
        { error: "Disease (prediction label) is required" },
        { status: 400 },
      );
    }

    const explanation = buildSkinDiseaseXAIExplanation({
      disease,
      severity,
      confidence,
      all_probabilities,
      pet,
    });

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error("XAI route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate explanation",
      },
      { status: 500 },
    );
  }
}
