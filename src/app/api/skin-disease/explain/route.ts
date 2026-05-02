import { NextRequest, NextResponse } from "next/server";
import {
  formatSkinDiseaseAiError,
  generateSkinDiseaseText,
} from "@/lib/skin-disease-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disease, severity, explanationType } = body;

    // Validate required fields
    if (!disease || !explanationType) {
      return NextResponse.json(
        { error: "Disease and explanation type are required" },
        { status: 400 },
      );
    }

    if (
      !process.env.OPENAI_API_KEY?.trim() &&
      !process.env.GEMINI_API_KEY?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Set OPENAI_API_KEY (recommended) or GEMINI_API_KEY for LLM explanations.",
        },
        { status: 500 },
      );
    }

    // Build prompt based on explanation type
    let prompt = "";
    const diseaseName = disease.replace(/_/g, " ");
    const severityText = severity ? ` (${severity} severity)` : "";

    switch (explanationType) {
      case "explain":
        prompt = `Provide a comprehensive explanation about the dog skin disease "${diseaseName}"${severityText} in 2-3 well-developed paragraphs.

DO NOT use markdown formatting. Write in plain text. Use bold text (surround with **) for important terms only.

First paragraph: Explain what this disease is, its main causes, how it develops, and the underlying mechanisms. Include information about what makes this condition occur and how it affects the dog's skin.

Second paragraph: Describe the common symptoms in detail, how they manifest, and what pet owners should look for. Explain how the disease progresses and affects dogs. Include how the severity level (${severity || "mild/severe"}) impacts the condition and what visual characteristics to observe.

Third paragraph: Discuss risk factors, which dogs are more susceptible, potential complications if left untreated, and important considerations for pet owners to understand about this condition.

Write in a clear, informative style. Use professional terminology but explain it simply. Each paragraph should be substantial (4-6 sentences). Total should be 2-3 paragraphs, approximately 300-400 words.`;
        break;

      case "firstAid":
        prompt = `Provide comprehensive first aid instructions for a dog with "${diseaseName}" skin disease${severityText} in 2-3 well-developed paragraphs.

DO NOT use markdown formatting. Write in plain text. Use bold text (surround with **) for important terms only.

First paragraph: Describe in detail the immediate steps pet owners should take at home right away. Include specific instructions on how to clean and care for the affected area properly, what materials to use, and the proper technique.

Second paragraph: Explain what to avoid that could worsen the condition, including specific actions, products, or behaviors to prevent. Then clearly explain when to seek immediate emergency veterinary care, being very specific about warning signs, symptoms, or situations that require urgent attention.

Third paragraph: Provide information about temporary relief measures and comfort care that can be safely administered. Explain how to monitor the dog's condition while waiting for veterinary care, what signs to watch for, and how to keep the dog comfortable.

Keep it detailed and actionable. Prioritize safety and clearly explain when professional veterinary care is necessary. Each paragraph should be substantial (4-6 sentences). Total should be 2-3 paragraphs, approximately 300-400 words.`;
        break;

      case "treatment":
        prompt = `Provide comprehensive treatment information for a dog with "${diseaseName}" skin disease${severityText} in 2-3 well-developed paragraphs.

DO NOT use markdown formatting. Write in plain text. Use bold text (surround with **) for important terms only.

First paragraph: Explain in detail the common treatment approaches and why they are used. Include specific medications that may be prescribed, their purposes, and how they work. Mention topical treatments, oral medications, and other interventions that veterinarians typically recommend.

Second paragraph: Describe home care recommendations and daily management practices. Explain the expected recovery timeline, what to expect during treatment, and how to support the dog's healing process. Include information about how treatment may differ based on the severity level.

Third paragraph: Discuss follow-up care requirements, potential side effects of treatments and how to manage them, when to expect improvement, signs of recovery, and what to do if treatment doesn't seem to be working. Emphasize the importance of following veterinary instructions.

Important: Clearly emphasize that professional veterinary diagnosis and treatment is essential. This information is for educational purposes only. Each paragraph should be substantial (4-6 sentences). Total should be 2-3 paragraphs, approximately 300-400 words.`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid explanation type" },
          { status: 400 },
        );
    }

    const { text: explanation } = await generateSkinDiseaseText(prompt, 1024);

    // Check if explanation is empty or just the fallback message
    if (
      !explanation ||
      explanation === "Unable to generate explanation at this time."
    ) {
      return NextResponse.json(
        {
          error: "No explanation was generated. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      explanation,
      explanationType,
    });
  } catch (error) {
    console.error("Error generating explanation:", error);
    const { message, status } = formatSkinDiseaseAiError(
      error,
      "Failed to generate explanation",
    );
    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}
