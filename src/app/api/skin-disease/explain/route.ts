import { NextRequest, NextResponse } from "next/server";

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

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
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

    // First, get available models to find the right one
    let modelName = "gemini-1.5-flash"; // Default fallback

    // List available models from Gemini API
    try {
      const modelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${geminiApiKey}`;
      const modelsResponse = await fetch(modelsUrl);

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log("Available models:", JSON.stringify(modelsData, null, 2));

        // Find a model that supports generateContent
        const availableModel = modelsData.models?.find((m: any) =>
          m.supportedGenerationMethods?.includes("generateContent"),
        );

        if (availableModel) {
          // Extract model name (format: models/gemini-1.5-flash or just the name)
          // The API might return "models/gemini-1.5-flash" or just "gemini-1.5-flash"
          modelName = availableModel.name.replace(/^models\//, "");
          console.log(
            "Found working model:",
            modelName,
            "from:",
            availableModel.name,
          );
        } else {
          console.log(
            "No model with generateContent found. Available models:",
            modelsData.models
              ?.map(
                (m: any) =>
                  `${m.name} (methods: ${m.supportedGenerationMethods?.join(", ")})`,
              )
              .join(", "),
          );
          // If no model found, try to use the first available model name
          if (modelsData.models && modelsData.models.length > 0) {
            const firstModel = modelsData.models[0];
            modelName = firstModel.name.replace(/^models\//, "");
            console.log("Trying first available model:", modelName);
          }
        }
      } else {
        const errorText = await modelsResponse.text();
        console.error("Failed to list models:", errorText);
      }
    } catch (err) {
      console.error("Error listing models:", err);
      // Continue with default model
    }

    // Call Gemini API with the determined model
    // Try v1beta first (older API that might work with free tier)
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
          maxOutputTokens: 1024, // Increased for 2-3 well-developed paragraphs (300-400 words)
        },
      }),
    });

    // If v1beta fails, try v1
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error with v1beta:", errorText);

      // Try v1 API as fallback
      geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;
      console.log("Trying v1 API instead...");
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
            maxOutputTokens: 1024, // Increased for 2-3 well-developed paragraphs (300-400 words)
          },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);

      // Try to parse error for better message
      let errorMessage = "Failed to generate explanation";
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
          // If model not found, suggest checking available models
          if (errorData.error.message.includes("not found")) {
            errorMessage +=
              "\n\nPlease check:\n1. Your API key is valid in Google AI Studio\n2. The model name matches what's available for your API key\n3. Check the console logs above for available models";
          }
        }
      } catch {
        // If parsing fails, use the raw error text if it's short
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
          error: data.error.message || "Failed to generate explanation",
        },
        { status: 500 },
      );
    }

    // Extract the generated text
    const explanation =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate explanation at this time.";

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
