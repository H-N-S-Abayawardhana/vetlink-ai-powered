import { NextRequest, NextResponse } from "next/server";
import {
  formatSkinDiseaseAiError,
  generateSkinDiseaseText,
} from "@/lib/skin-disease-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disease_name, disease_stage, card_type } = body;

    // Validate required fields
    if (!disease_name || !card_type) {
      return NextResponse.json(
        { error: "Disease name and card type are required" },
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
            "Set OPENAI_API_KEY (recommended) or GEMINI_API_KEY in your environment for LLM guidance.",
        },
        { status: 500 },
      );
    }

    // Build prompt based on card type
    let prompt = "";
    const formattedDiseaseName = disease_name.replace(/_/g, " ");
    const stage = disease_stage || "Mild"; // Default to Mild if not provided

    switch (card_type) {
      case "disease_info":
        prompt = `You are a helpful assistant providing clear, detailed information about dog skin diseases for pet owners.

Provide a concise but still helpful explanation about "${formattedDiseaseName}" for someone who wants to understand it well.

CRITICAL REQUIREMENTS:
- Write 2 short paragraphs (about 6-9 sentences in total)
- Be informative but not overly long: cover what the disease is, common causes, how it typically presents, and how it differs at ${stage} stage
- Use simple, easy-to-understand language (avoid heavy medical jargon; if you use a term, briefly explain it)
- Explain what this disease means for the dog and what owners might notice
- Make it relevant to the ${stage} stage where applicable
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone calm, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write 2 concise paragraphs with enough detail to be useful, without becoming too long.`;

        break;

      case "stage_meaning":
        prompt = `You are a helpful assistant explaining disease stages to pet owners.

Explain in detail what "${stage}" severity means for "${formattedDiseaseName}".

CRITICAL REQUIREMENTS:
- Write 2 short paragraphs (about 6-9 sentences in total)
- Be thorough but concise: explain what this stage means in practical terms, typical symptoms or signs at this stage, and how it differs from milder or more severe stages
- Use simple, easy-to-understand language
- Describe what owners might observe and when to be concerned
- If the stage is "Severe", include a clear but gentle recommendation to consult a veterinarian
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone calm, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write 2 concise paragraphs that stay practical and easy to read.`;

        break;

      case "care_tips":
        // Special handling for healthy skin
        if (formattedDiseaseName.toLowerCase() === "healthy") {
          prompt = `You are a helpful assistant providing tips for maintaining healthy dog skin for pet owners.

Provide detailed, practical tips on how to keep a dog's skin healthy and maintain good skin condition.

CRITICAL REQUIREMENTS:
- Write 2 short paragraphs (about 6-9 sentences in total)
- Be practical and balanced: cover preventive care, grooming, nutrition, environment, and general wellness
- Include specific, actionable tips (e.g. bathing frequency, diet, checking for parasites, when to see a vet for a check-up)
- Use simple, easy-to-understand language
- Emphasize maintaining the current healthy state
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone positive, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write 2 concise paragraphs with actionable advice that do not feel too long.`;
        } else {
          prompt = `You are a helpful assistant providing basic care tips for pet owners.

Provide detailed, practical care tips for a dog with "${formattedDiseaseName}" at the ${stage} stage.

CRITICAL REQUIREMENTS:
- Write 2 short paragraphs (about 6-9 sentences in total)
- Be practical and concise: cover hygiene, comfort, what to do at home, when to see a vet, and what to avoid
- Include specific, actionable tips relevant to both the disease and the ${stage} stage
- Use simple, easy-to-understand language
- If the stage is "Severe", include a clear recommendation to consult a veterinarian and what to do in the meantime
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone calm, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write 2 concise paragraphs with useful home-care guidance, without becoming too long.`;
        }

        break;

      default:
        return NextResponse.json(
          { error: "Invalid card type" },
          { status: 400 },
        );
    }

    const initialResult = await generateSkinDiseaseText(prompt, 2048);
    let guidance =
      initialResult.text || "Unable to generate guidance at this time.";
    const finishReason = initialResult.finishReason;

    // Check if guidance is empty
    if (!guidance || guidance === "Unable to generate guidance at this time.") {
      return NextResponse.json(
        {
          error: "No guidance was generated. Please try again.",
        },
        { status: 500 },
      );
    }

    // Check if response was truncated
    // finishReason can be: STOP (normal), MAX_TOKENS (truncated), or other reasons
    const trimmedGuidance = guidance.trim();
    const endsWithPunctuation = /[.!?]$/.test(trimmedGuidance);
    const wasTruncatedByTokens =
      finishReason === "MAX_TOKENS" || finishReason === "length";
    const isLikelyTruncated =
      wasTruncatedByTokens ||
      (!endsWithPunctuation && trimmedGuidance.length > 50);

    // If truncated, request completion
    if (isLikelyTruncated) {
      try {
        const completionPrompt = `Complete the following explanation about "${formattedDiseaseName}". The explanation was cut off. Continue from where it left off and finish the thought naturally with proper punctuation. Do not repeat what was already said, just complete the current thought.

${trimmedGuidance}

Continue and complete the explanation:`;

        const { text: completion } = await generateSkinDiseaseText(
          completionPrompt,
          600,
        );
        if (completion.trim()) {
          // Append completion, ensuring proper spacing and no duplication
          const completionText = completion.trim();
          // Remove any potential duplicate text at the start of completion
          const cleanCompletion = completionText.startsWith(
            trimmedGuidance.slice(-20),
          )
            ? completionText.slice(trimmedGuidance.slice(-20).length).trim()
            : completionText;

          guidance = trimmedGuidance + " " + cleanCompletion;
        }
      } catch (completionError) {
        console.error("Error completing truncated response:", completionError);
        // Continue with original response even if completion fails
      }
    }

    // Return the full guidance text
    return NextResponse.json({
      success: true,
      guidance: guidance.trim(),
      card_type,
    });
  } catch (error) {
    console.error("Error generating guidance:", error);
    const { message, status } = formatSkinDiseaseAiError(
      error,
      "Failed to generate guidance",
    );
    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}
