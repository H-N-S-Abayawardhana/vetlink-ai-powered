/**
 * GET /api/skin-disease/health
 * Probes the Hugging Face Gradio Space (/config) when NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL is set.
 */

import { NextResponse } from "next/server";

import { normalizeHuggingFaceSpaceUrl } from "@/lib/hf-space-url";

const DEFAULT_RESPONSE = {
  status: "healthy",
  model_loaded: true,
  device: "unknown",
  num_classes: 9,
  classes: [] as string[],
  model_type: "dinov2",
};

export async function GET() {
  const raw = process.env.NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL?.trim();
  if (
    !raw ||
    (!raw.startsWith("http://") &&
      !raw.startsWith("https://") &&
      !raw.includes("huggingface.co/spaces"))
  ) {
    return NextResponse.json(DEFAULT_RESPONSE);
  }

  const baseUrl = normalizeHuggingFaceSpaceUrl(raw).replace(/\/$/, "");
  const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();
  const headers: Record<string, string> = {};
  if (hfToken) {
    headers.Authorization = `Bearer ${hfToken}`;
  }

  try {
    const configUrl = `${baseUrl}/config`;
    const res = await fetch(configUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({
        ...DEFAULT_RESPONSE,
        status: "unhealthy",
        model_loaded: false,
        error: `Space config HTTP ${res.status}`,
      });
    }

    return NextResponse.json({
      status: "healthy",
      model_loaded: true,
      device: "unknown",
      num_classes: 9,
      classes: [],
      model_type: "dinov2",
      space_url: baseUrl,
    });
  } catch {
    return NextResponse.json({
      ...DEFAULT_RESPONSE,
      status: "unhealthy",
      model_loaded: false,
    });
  }
}
