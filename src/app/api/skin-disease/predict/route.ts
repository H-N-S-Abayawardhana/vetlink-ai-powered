/**
 * Skin disease prediction via Hugging Face Docker Space (FastAPI).
 * Proxies the image to {API_URL}/predict and returns the JSON response.
 * POST: multipart form with "file" or JSON body with "image" (base64 data URL).
 */

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL =
  "https://Niwazzz-severity-level-detection-with-xai.hf.space";
/** Timeout for the Space (cold start can take 1–2 min). */
const SERVER_TIMEOUT_MS = 120000;

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL?.trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    return url.replace(/\/$/, "");
  }
  return DEFAULT_API_URL;
}

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () =>
        reject(
          new Error(
            "Prediction timed out. The Space may be busy or sleeping—please try again in a moment.",
          ),
        ),
      ms,
    );
  });
  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "Missing file in form (key: file)" },
          { status: 400 },
        );
      }
      formData = new FormData();
      formData.append("file", file);
    } else {
      const body = await request.json();
      const img = body?.image ?? body?.base64;
      if (!img || typeof img !== "string") {
        return NextResponse.json(
          { error: "Missing image (base64 data URL) in JSON body" },
          { status: 400 },
        );
      }
      const base64Data = img.startsWith("data:") ? img.split(",")[1] : img;
      const mime =
        img.startsWith("data:") && img.includes(";")
          ? img.split(";")[0].replace("data:", "")
          : "image/jpeg";
      const buf = Buffer.from(base64Data, "base64");
      const blob = new Blob([buf], { type: mime });
      const ext = mime.includes("png") ? "png" : "jpg";
      formData = new FormData();
      formData.append("file", blob, `image.${ext}`);
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const baseUrl = getApiBaseUrl();
  const predictUrl = `${baseUrl}/predict`;

  try {
    const response = await withTimeout(async () => {
      const res = await fetch(predictUrl, {
        method: "POST",
        body: formData,
        headers: { "x-gradio-user": "api" },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `Space predict failed: ${res.status} ${errText.slice(0, 200)}`,
        );
      }

      const data = (await res.json()) as {
        success?: boolean;
        valid?: boolean;
        prediction?: {
          disease?: string;
          confidence?: number;
          parsed?: {
            disease?: string;
            severity?: string | null;
            fullName?: string;
          };
          all_probabilities?: Record<string, number>;
        };
        xaiExplanation?: string | null;
        xaiHeatmapDataUrl?: string | null;
        error?: string;
      };

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.prediction) {
        throw new Error("Invalid response from Space: missing prediction");
      }

      return NextResponse.json({
        success: data.success !== false,
        valid: data.valid !== false,
        prediction: {
          disease: data.prediction.disease ?? "",
          confidence: data.prediction.confidence ?? 0,
          all_probabilities: data.prediction.all_probabilities ?? {},
          parsed: data.prediction.parsed ?? undefined,
        },
        xaiExplanation: data.xaiExplanation ?? null,
        xaiHeatmapDataUrl: data.xaiHeatmapDataUrl ?? null,
        model_type: "dinov2",
      });
    }, SERVER_TIMEOUT_MS);

    return response;
  } catch (error) {
    const err = error as Error;
    const message = err?.message ?? "Prediction failed";
    console.error("Skin disease predict API error:", error);
    const isTimeout = message.includes("timed out");
    return NextResponse.json(
      { error: message },
      { status: isTimeout ? 504 : 502 },
    );
  }
}
