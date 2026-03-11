import { NextRequest, NextResponse } from "next/server";

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

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
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

    // Determine model name
    let modelName = "gemini-1.5-flash"; // Default fallback

    // Try to get available models
    try {
      const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${geminiApiKey}`;
      const modelsResponse = await fetch(modelsUrl);

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const availableModel = modelsData.models?.find((m: any) =>
          m.supportedGenerationMethods?.includes("generateContent"),
        );

        if (availableModel) {
          modelName = availableModel.name.replace(/^models\//, "");
        } else if (modelsData.models && modelsData.models.length > 0) {
          const firstModel = modelsData.models[0];
          modelName = firstModel.name.replace(/^models\//, "");
        }
      }
    } catch (err) {
      console.error("Error listing models:", err);
      // Continue with default model
    }

    // Call Gemini API
    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
    let response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    // If v1beta fails, try v1
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error with v1beta:", errorText);

      geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);

      let errorMessage = "Failed to generate guidance";
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Check for API errors in response
    if (data.error) {
      console.error("Gemini API error in response:", data.error);
      return NextResponse.json(
        {
          error: data.error.message || "Failed to generate guidance",
        },
        { status: 500 },
      );
    }

    // Extract the generated text and check finish reason
    const candidate = data.candidates?.[0];
    let guidance =
      candidate?.content?.parts?.[0]?.text ||
      "Unable to generate guidance at this time.";
    const finishReason = candidate?.finishReason;

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
    const wasTruncatedByTokens = finishReason === "MAX_TOKENS";
    const isLikelyTruncated =
      wasTruncatedByTokens ||
      (!endsWithPunctuation && trimmedGuidance.length > 50);

    // If truncated, request completion
    if (isLikelyTruncated) {
      try {
        // Get the last sentence or phrase to provide context
        const lastSentence =
          trimmedGuidance.split(/[.!?]/).filter(Boolean).pop() ||
          trimmedGuidance.slice(-100);

        const completionPrompt = `Complete the following explanation about "${formattedDiseaseName}". The explanation was cut off. Continue from where it left off and finish the thought naturally with proper punctuation. Do not repeat what was already said, just complete the current thought.

${trimmedGuidance}

Continue and complete the explanation:`;

        // Try v1beta first, then v1
        let completionUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        let completionResponse = await fetch(completionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: completionPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 600,
            },
          }),
        });

        // If v1beta fails, try v1
        if (!completionResponse.ok) {
          completionUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;
          completionResponse = await fetch(completionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: completionPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 600,
              },
            }),
          });
        }

        if (completionResponse.ok) {
          const completionData = await completionResponse.json();
          const completion =
            completionData.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate guidance",
      },
      { status: 500 },
    );
  }
}
