/**
 * GET /api/skin-disease/health
 * When NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL is set, pings the Space's /health.
 * Otherwise returns a static healthy response.
 */

import { NextResponse } from "next/server";

const DEFAULT_RESPONSE = {
  status: "healthy",
  model_loaded: true,
  device: "unknown",
  num_classes: 9,
  classes: [] as string[],
  model_type: "dinov2",
};

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL?.trim();
  if (
    !baseUrl ||
    (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://"))
  ) {
    return NextResponse.json(DEFAULT_RESPONSE);
  }

  const healthUrl = `${baseUrl.replace(/\/$/, "")}/health`;
  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: { "x-gradio-user": "api" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({
        ...DEFAULT_RESPONSE,
        status: "unhealthy",
        model_loaded: false,
      });
    }
    const data = (await res.json()) as {
      status?: string;
      model_loaded?: boolean;
      device?: string;
      num_classes?: number;
      classes?: string[];
      model_type?: string;
    };
    return NextResponse.json({
      status: data.status ?? "healthy",
      model_loaded: data.model_loaded !== false,
      device: data.device ?? "unknown",
      num_classes: data.num_classes ?? 9,
      classes: data.classes ?? [],
      model_type: data.model_type ?? "dinov2",
    });
  } catch {
    return NextResponse.json({
      ...DEFAULT_RESPONSE,
      status: "unhealthy",
      model_loaded: false,
    });
  }
}
