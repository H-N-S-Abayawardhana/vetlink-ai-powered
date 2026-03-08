import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_SIZE_MB}MB` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const prompt = `You are an expert at reading handwritten and printed text from prescription images.
Extract and transcribe ALL text visible in this prescription image exactly as written.
- Preserve line breaks and structure where possible.
- Include dosages, medication names, instructions, doctor notes, dates, and any other text.
- If the image is unclear or has no text, say "No readable text found in the image."
- Do not add explanations or headings—only output the transcribed text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      let message = "Failed to read prescription";
      try {
        const err = JSON.parse(errorText);
        if (err.error?.message) message = err.error.message;
      } catch {
        if (errorText.length < 200) message = errorText;
      }
      return NextResponse.json(
        { error: message },
        { status: response.status >= 500 ? 500 : 400 },
      );
    }

    const data = await response.json();
    const text =
      data.choices?.[0]?.message?.content?.trim() ||
      "No text could be extracted from the image.";

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("Prescription read error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to read prescription",
      },
      { status: 500 },
    );
  }
}
