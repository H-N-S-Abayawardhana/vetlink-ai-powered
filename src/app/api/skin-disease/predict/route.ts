/**
 * Skin disease prediction via Hugging Face Gradio Space (Docker).
 * Uses @gradio/client to call the Space `predict` fn (image → probs + GradCAM + OpenAI text).
 */

import { Client } from "@gradio/client";
import { NextRequest, NextResponse } from "next/server";

import { normalizeHuggingFaceSpaceUrl } from "@/lib/hf-space-url";
import { parseDiseaseName } from "@/services/skin-disease-detection/mlApi";

/** Default: your XAI Gradio Space (override with NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL). */
const DEFAULT_SPACE =
  "https://niwazzz-dog-skin-disease-detection-with-xai-latest.hf.space";

const CONNECT_TIMEOUT_MS = 45_000;
const PREDICT_TIMEOUT_MS = 120_000;

function getSpaceRootUrl(): string {
  const raw = process.env.NEXT_PUBLIC_DOG_SKIN_DISEASE_ML_API_URL?.trim();
  if (!raw) return DEFAULT_SPACE;
  const normalized = normalizeHuggingFaceSpaceUrl(raw);
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized.replace(/\/$/, "");
  }
  return DEFAULT_SPACE;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${ms}ms. The Space may be sleeping—try again.`,
          ),
        ),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!));
}

/** Convert Gradio Image / File output to a usable URL for <img src>. */
function normalizeHeatmapOutput(img: unknown): string | null {
  if (img == null) return null;
  if (typeof img === "string") {
    return img.startsWith("http") || img.startsWith("data:") ? img : null;
  }
  if (typeof img === "object" && img !== null) {
    const o = img as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (typeof o.path === "string" && o.path.startsWith("http")) return o.path;
  }
  return null;
}

/** Gradio Dataframe → probability map (keys = model class labels). */
function parseProbabilitiesTable(table: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!table) return out;

  let rows: unknown[] = [];
  if (
    typeof table === "object" &&
    table !== null &&
    "data" in table &&
    Array.isArray((table as { data: unknown }).data)
  ) {
    rows = (table as { data: unknown[] }).data;
  } else if (Array.isArray(table)) {
    rows = table;
  }

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const key = String(row[0]).trim();
    const val = Number(row[1]);
    if (key && !Number.isNaN(val)) out[key] = val;
  }
  return out;
}

/** Pick top label from probability map. */
function topFromProbs(probs: Record<string, number>): {
  disease: string;
  confidence: number;
} {
  const entries = Object.entries(probs);
  if (entries.length === 0) {
    return { disease: "", confidence: 0 };
  }
  entries.sort((a, b) => b[1] - a[1]);
  return { disease: entries[0][0], confidence: entries[0][1] };
}

/**
 * @gradio/client v2 resolves `predict()` to a websocket message object
 * `{ type: "data", data: [...] }`, not a raw tuple. Normalize to output values.
 */
function extractGradioOutputs(raw: unknown): unknown[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    if (raw.length === 1 && Array.isArray(raw[0])) {
      return raw[0] as unknown[];
    }
    return raw;
  }

  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if ("data" in o && o.data != null) {
      const d = o.data;
      if (Array.isArray(d)) {
        if (d.length === 1 && Array.isArray(d[0])) {
          return d[0] as unknown[];
        }
        return d;
      }
    }
  }

  return [];
}

function safeJsonPreview(value: unknown, max = 400): string {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return String(value).slice(0, max);
  }
}

/** Find the dataframe / table blob that contains class probabilities. */
function pickProbabilitySource(tuple: unknown[]): unknown {
  for (let i = tuple.length - 1; i >= 0; i--) {
    const p = parseProbabilitiesTable(tuple[i]);
    if (Object.keys(p).length >= 2) return tuple[i];
  }
  return tuple.length > 0 ? tuple[tuple.length - 1] : null;
}

/** Find heatmap-like output (URL or FileData). Gradio order: [md, heat, text, table]. */
function pickHeatmapSource(tuple: unknown[]): unknown {
  if (tuple.length >= 2 && normalizeHeatmapOutput(tuple[1])) {
    return tuple[1];
  }
  for (const item of tuple) {
    if (normalizeHeatmapOutput(item)) return item;
  }
  return null;
}

/** Pick LLM text block (optional). Gradio order: [markdown preds, heat, openai text, table]. */
function pickTextExplanation(tuple: unknown[]): string | null {
  if (tuple.length >= 3 && typeof tuple[2] === "string") {
    const t = tuple[2].trim();
    if (t.length > 0) return t;
  }
  for (const item of tuple) {
    if (typeof item === "string" && item.trim().length > 0) {
      const s = item.trim();
      if (s.startsWith("### Prediction")) continue;
      if (
        s.includes("veterinarian") ||
        s.includes("Assist a") ||
        s.length > 200
      ) {
        return s;
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  let imageFile: File;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "Missing file in form (key: file)" },
          { status: 400 },
        );
      }
      const name = file instanceof File ? file.name : "upload.jpg";
      imageFile = new File([file], name, { type: file.type || "image/jpeg" });
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
      const ext = mime.includes("png") ? "png" : "jpg";
      imageFile = new File([buf], `image.${ext}`, { type: mime });
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const spaceRoot = getSpaceRootUrl();
  const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();

  try {
    const app = await withTimeout(
      hfToken
        ? Client.connect(spaceRoot, {
            token: hfToken as `hf_${string}`,
          })
        : Client.connect(spaceRoot),
      CONNECT_TIMEOUT_MS,
      "Connecting to Hugging Face Space",
    );

    let result: unknown;
    try {
      result = await withTimeout(
        app.predict(0, [imageFile]) as Promise<unknown>,
        PREDICT_TIMEOUT_MS,
        "Prediction",
      );
    } catch (first) {
      try {
        result = await withTimeout(
          app.predict("/predict", [imageFile]) as Promise<unknown>,
          PREDICT_TIMEOUT_MS,
          "Prediction",
        );
      } catch {
        throw first;
      }
    }

    const tuple = extractGradioOutputs(result);
    if (tuple.length === 0) {
      throw new Error(
        `Unexpected response from Gradio Space (empty outputs): ${safeJsonPreview(result)}`,
      );
    }

    const tableRaw = pickProbabilitySource(tuple);
    const all_probabilities = parseProbabilitiesTable(tableRaw);
    const { disease, confidence } = topFromProbs(all_probabilities);

    if (!disease) {
      throw new Error(
        `Could not parse class probabilities from Space output. Raw: ${safeJsonPreview(result)}`,
      );
    }

    const parsed = parseDiseaseName(disease);
    const heatRaw = pickHeatmapSource(tuple);
    const heatUrl = normalizeHeatmapOutput(heatRaw);
    const xaiExplanation = pickTextExplanation(tuple);

    return NextResponse.json({
      success: true,
      valid: true,
      prediction: {
        disease,
        confidence,
        all_probabilities,
        parsed,
      },
      xaiExplanation,
      xaiHeatmapDataUrl: heatUrl,
      model_type: "dinov2",
      gradio_space: spaceRoot,
    });
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
