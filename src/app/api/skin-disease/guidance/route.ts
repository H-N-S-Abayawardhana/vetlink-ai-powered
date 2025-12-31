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
        prompt = `You are a helpful assistant providing clear information about dog skin diseases for pet owners.

Provide a concise but complete explanation about "${formattedDiseaseName}" in ONE well-developed paragraph. 

CRITICAL REQUIREMENTS:
- Write exactly ONE paragraph (5-8 sentences)
- Provide a COMPLETE explanation - do not truncate or cut off your response
- Use simple, easy-to-understand language (no medical jargon)
- Explain what this disease is, its main causes, and basic understanding
- Make it relevant to the ${stage} stage if applicable
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone calm, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write exactly one complete paragraph (5-8 sentences). Provide a full explanation without any truncation.`;

        break;

      case "stage_meaning":
        prompt = `You are a helpful assistant explaining disease stages to pet owners.

Explain what "${stage}" severity means for "${formattedDiseaseName}" in ONE well-developed paragraph.

CRITICAL REQUIREMENTS:
- Write exactly ONE paragraph (5-8 sentences)
- Provide a COMPLETE explanation - do not truncate or cut off your response
- Use simple, easy-to-understand language
- Explain what this stage means in practical terms
- Describe what symptoms or characteristics are typical for this stage
- If the stage is "Severe", include a gentle recommendation to consult a veterinarian
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone calm, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write exactly one complete paragraph (5-8 sentences). Provide a full explanation without any truncation.`;

        break;

      case "care_tips":
        // Special handling for healthy skin
        if (formattedDiseaseName.toLowerCase() === "healthy") {
          prompt = `You are a helpful assistant providing tips for maintaining healthy dog skin for pet owners.

Provide practical tips on how to keep a dog's skin healthy and maintain good skin condition in ONE well-developed paragraph.

CRITICAL REQUIREMENTS:
- Write exactly ONE paragraph (5-8 sentences)
- Provide a COMPLETE explanation - do not truncate or cut off your response
- Use simple, easy-to-understand language
- Focus on preventive care, grooming, nutrition, and general wellness practices
- Include tips about regular check-ups, proper bathing, diet, and environmental factors
- Emphasize maintaining the current healthy state
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone positive, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write exactly one complete paragraph (5-8 sentences). Provide a full explanation without any truncation.`;
        } else {
          prompt = `You are a helpful assistant providing basic care tips for pet owners.

Provide practical care tips for a dog with "${formattedDiseaseName}" at the ${stage} stage in ONE well-developed paragraph.

CRITICAL REQUIREMENTS:
- Write exactly ONE paragraph (5-8 sentences)
- Provide a COMPLETE explanation - do not truncate or cut off your response
- Use simple, easy-to-understand language
- Focus on practical, actionable care tips
- Include general hygiene and comfort measures
- Make tips relevant to both the disease and the ${stage} stage
- If the stage is "Severe", include a gentle recommendation to consult a veterinarian
- Do NOT provide medical diagnosis or specific medicine names
- Keep the tone calm, informative, and supportive
- Write in plain text format (no markdown, no bullet points, no numbering)
- ALWAYS complete your full response - never cut off mid-sentence or mid-thought

Format: Write exactly one complete paragraph (5-8 sentences). Provide a full explanation without any truncation.`;
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
          maxOutputTokens: 900, // Sufficient for one paragraph (5-8 sentences)
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
            maxOutputTokens: 900,
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
              maxOutputTokens: 300, // Enough to complete the thought
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
                maxOutputTokens: 300,
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
