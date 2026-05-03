import pool from "@/lib/db";

type InventoryRow = {
  inventory_item_id: string;
  pharmacy_id: string;
  name: string;
  form: string | null;
  strength: string | null;
  stock: number;
  price: unknown;
  expiry_date: Date | null;
  image_url: string | null;
  generic_name: string | null;
  pharmacy_name: string | null;
  pharmacy_address: string | null;
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_fee: unknown;
};

type AltNameCacheEntry = {
  expiresAt: number;
  names: string[];
};

const altNameCache = new Map<string, AltNameCacheEntry>();
const ALT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarity(a: string, b: string): number {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.92;
  const dist = levenshtein(x, y);
  return 1 - dist / Math.max(x.length, y.length);
}

async function fetchRxNormBrandNames(genericName: string): Promise<string[]> {
  try {
    const rxcuiUrl = new URL("https://rxnav.nlm.nih.gov/REST/rxcui.json");
    rxcuiUrl.searchParams.set("name", genericName);
    rxcuiUrl.searchParams.set("search", "2");

    const rxcuiRes = await fetch(rxcuiUrl.toString());
    if (!rxcuiRes.ok) return [];
    const rxcuiData = await rxcuiRes.json();
    const rxCuis: string[] = rxcuiData?.idGroup?.rxnormId || [];
    if (rxCuis.length === 0) return [];

    const allBrands = new Set<string>();
    for (const rxcui of rxCuis.slice(0, 5)) {
      const relatedUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=BN`;
      const relatedRes = await fetch(relatedUrl);
      if (!relatedRes.ok) continue;
      const relatedData = await relatedRes.json();
      const groups: Array<{ conceptProperties?: Array<{ name?: string }> }> =
        relatedData?.relatedGroup?.conceptGroup || [];
      for (const g of groups) {
        for (const p of g.conceptProperties || []) {
          if (p?.name) allBrands.add(p.name.trim());
        }
      }
    }
    return [...allBrands];
  } catch {
    return [];
  }
}

async function fetchOpenFdaBrandNames(genericName: string): Promise<string[]> {
  try {
    const url = new URL("https://api.fda.gov/drug/label.json");
    url.searchParams.set("search", `active_ingredient:"${genericName}"`);
    url.searchParams.set("limit", "25");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = await res.json();
    const results: Array<{ openfda?: { brand_name?: string[] } }> =
      data?.results || [];

    const brands = new Set<string>();
    for (const row of results) {
      for (const bn of row?.openfda?.brand_name || []) {
        if (bn?.trim()) brands.add(bn.trim());
      }
    }
    return [...brands];
  } catch {
    return [];
  }
}

async function fetchAlternativeNamesWithAi(
  genericName: string,
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "Return medicine brand/trade names for a given generic. Output valid JSON array only.",
          },
          {
            role: "user",
            content: `Generic name: ${genericName}\nReturn up to 15 commonly used brand names as JSON array of strings. If unknown return [].`,
          },
        ],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return [];
    const parsed = JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function resolveAlternativeNames(genericName: string): Promise<string[]> {
  const key = normalizeName(genericName);
  const cached = altNameCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.names;
  }

  const [rxNorm, openFda] = await Promise.all([
    fetchRxNormBrandNames(genericName),
    fetchOpenFdaBrandNames(genericName),
  ]);

  let names = [...new Set([...rxNorm, ...openFda])];
  if (names.length === 0) {
    names = await fetchAlternativeNamesWithAi(genericName);
  }

  names = [...new Set([genericName, ...names])]
    .map((n) => n.trim())
    .filter((n) => n.length >= 2)
    .slice(0, 50);

  altNameCache.set(key, {
    names,
    expiresAt: Date.now() + ALT_CACHE_TTL_MS,
  });

  return names;
}

export type AlternativeMedicineMatch = {
  row: InventoryRow;
  matchedAlias: string;
  score: number;
  genericName: string;
};

/**
 * getAlternativeMedicines(genericName)
 * 1) Fetches alternative brand names from external APIs (RxNorm/OpenFDA)
 * 2) Falls back to AI when APIs fail/empty
 * 3) Normalizes and fuzzy-matches alternatives against inventory rows
 * 4) Returns matching inventory rows sorted by score
 */
export async function getAlternativeMedicines(
  genericName: string,
): Promise<AlternativeMedicineMatch[]> {
  const g = genericName.trim();
  if (!g) return [];

  const aliases = await resolveAlternativeNames(g);
  if (aliases.length === 0) return [];

  const result = await pool.query<InventoryRow>(
    `SELECT
        i.id AS inventory_item_id,
        i.pharmacy_id,
        i.name,
        i.form,
        i.strength,
        i.stock,
        i.price,
        i.expiry_date,
        i.image_url,
        COALESCE(i.generic_name, '') AS generic_name,
        p.name AS pharmacy_name,
        p.address AS pharmacy_address,
        p.pickup_available,
        p.delivery_available,
        p.delivery_fee
      FROM pharmacy_inventory_items i
      INNER JOIN pharmacies p ON p.id = i.pharmacy_id
      WHERE i.stock > 0`,
  );

  const threshold = 0.72;
  const matches: AlternativeMedicineMatch[] = [];

  for (const row of result.rows) {
    const candidateLabels = [row.name, row.generic_name || ""].filter(Boolean);
    let bestScore = 0;
    let bestAlias = "";

    for (const alias of aliases) {
      for (const candidate of candidateLabels) {
        const s = similarity(alias, candidate);
        if (s > bestScore) {
          bestScore = s;
          bestAlias = alias;
        }
      }
    }

    if (bestScore >= threshold) {
      matches.push({
        row,
        matchedAlias: bestAlias,
        score: Number(bestScore.toFixed(3)),
        genericName: g,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name));
  return matches;
}
