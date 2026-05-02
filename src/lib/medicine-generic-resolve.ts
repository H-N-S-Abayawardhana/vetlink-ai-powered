/**
 * Resolve veterinary medicine → generic (INN) name for DB matching.
 *
 * Optional env (Google Programmable Search Engine — "search on Google" server-side):
 *   GOOGLE_CUSTOM_SEARCH_API_KEY
 *   GOOGLE_CUSTOM_SEARCH_ENGINE_ID
 *
 * Uses OPENAI_API_KEY for extraction from snippets and as fallback when Google is not configured.
 */

const OPENAI_CHAT = "https://api.openai.com/v1/chat/completions";

async function openaiComplete(
  system: string,
  user: string,
  maxTokens = 256,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return "";

  const res = await fetch(OPENAI_CHAT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  return typeof text === "string" ? text.trim() : "";
}

function normalizeGenericCandidate(raw: string): string | null {
  const line = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean);
  if (!line) return null;
  let s = line
    .replace(/^["']|["']$/g, "")
    .replace(/^generic:\s*/i, "")
    .replace(/\.$/, "")
    .trim();
  if (!s || /^unknown$/i.test(s)) return null;
  if (s.length > 120) s = s.slice(0, 120);
  return s;
}

async function fetchGoogleContext(medicineLabel: string): Promise<string> {
  const key = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID?.trim();
  if (!key || !cx) return "";

  const q = `${medicineLabel} generic name active ingredient veterinary drug`;
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", q);
  url.searchParams.set("num", "5");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return "";
    const data = await res.json();
    const items: Array<{ title?: string; snippet?: string }> = data.items || [];
    return items
      .map((i) => `${i.title || ""}\n${i.snippet || ""}`.trim())
      .filter(Boolean)
      .join("\n---\n");
  } catch {
    return "";
  }
}

/**
 * Returns a short generic / INN phrase suitable for DB ILIKE matching, or null.
 */
export async function resolveMedicineGenericName(
  medicineLabel: string,
): Promise<string | null> {
  const label = medicineLabel.trim();
  if (label.length < 2) return null;

  const googleContext = await fetchGoogleContext(label);
  const user =
    googleContext.length > 0
      ? `Medicine label or brand (possibly for animals): "${label}"\n\nGoogle search result excerpts:\n${googleContext.slice(0, 4500)}\n\nReply with ONLY the international nonproprietary name (generic active ingredient), 1–5 words, no punctuation list, no extra words. If truly unknown, reply exactly: UNKNOWN`
      : `Medicine label or brand (veterinary context when applicable): "${label}"\n\nReply with ONLY the international nonproprietary name (generic active ingredient), 1–5 words. If unknown, reply exactly: UNKNOWN`;

  const out = await openaiComplete(
    "You map drug labels to generic (INN) names. Output one short phrase or UNKNOWN.",
    user,
    80,
  );

  return normalizeGenericCandidate(out);
}

/**
 * Pull distinct medication names from free-form prescription text (JSON array).
 */
export async function extractMedicineNamesFromPrescription(
  prescriptionText: string,
): Promise<string[]> {
  const text = prescriptionText.trim();
  if (text.length < 3) return [];

  const raw = await openaiComplete(
    "You extract medication names from prescription text. Output must be valid JSON only.",
    `From this prescription text, list medication/drug names only (no doses, no instructions).\nReturn a JSON array of strings, e.g. ["Amoxicillin","Meloxicam"]. Use empty [] if none.\n\nTEXT:\n${text.slice(0, 8000)}`,
    400,
  );

  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw.replace(/```json\s*|\s*```/g, "").trim());
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((x) => String(x).trim()).filter((s) => s.length >= 2))];
  } catch {
    return [];
  }
}
