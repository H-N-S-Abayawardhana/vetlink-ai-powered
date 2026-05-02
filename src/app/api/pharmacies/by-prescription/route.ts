import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import {
  extractMedicineNamesFromPrescription,
  resolveMedicineGenericName,
} from "@/lib/medicine-generic-resolve";

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

function mapProduct(row: InventoryRow, matchedViaGeneric: boolean) {
  return {
    id: row.inventory_item_id,
    name: row.name,
    generic_name: row.generic_name || "",
    form: row.form || "",
    strength: row.strength || "",
    stock: row.stock ?? 0,
    price: Number(row.price) || 0,
    expiry: row.expiry_date
      ? row.expiry_date.toISOString().split("T")[0]
      : null,
    image: row.image_url || null,
    pharmacyId: row.pharmacy_id,
    pharmacyName: row.pharmacy_name || "",
    pharmacyAddress: row.pharmacy_address || "",
    pickup_available: Boolean(row.pickup_available),
    delivery_available: Boolean(row.delivery_available),
    delivery_fee: row.delivery_fee != null ? Number(row.delivery_fee) : 0,
    matched_via_generic: matchedViaGeneric,
  };
}

const BASE_SELECT = `
      SELECT
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
      WHERE i.stock > 0`;

/**
 * POST /api/pharmacies/by-prescription
 * Body: { text: string, medicineNames?: string[] }
 * Matches inventory by name/generic appearing in prescription text; if a named
 * drug has no row, resolves generic (Google + OpenAI when configured) and matches again.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const medicineNamesRaw = Array.isArray(body.medicineNames)
      ? body.medicineNames
      : [];

    if (!text) {
      return NextResponse.json(
        { error: "Prescription text is required" },
        { status: 400 },
      );
    }

    const merged = new Map<string, { row: InventoryRow; viaGeneric: boolean }>();
    const genericResolveCache = new Map<string, string | null>();

    const addRows = (rows: InventoryRow[], viaGeneric: boolean) => {
      for (const row of rows) {
        const id = row.inventory_item_id;
        const prev = merged.get(id);
        if (!prev || (!prev.viaGeneric && viaGeneric)) {
          merged.set(id, { row, viaGeneric: prev?.viaGeneric || viaGeneric });
        }
      }
    };

    // 1) Direct: prescription text contains inventory trade name or stored generic
    const primary = await pool.query<InventoryRow>(
      `${BASE_SELECT}
        AND (
          LOWER($1) LIKE '%' || LOWER(TRIM(i.name)) || '%'
          OR (
            TRIM(COALESCE(i.generic_name, '')) <> ''
            AND LOWER($1) LIKE '%' || LOWER(TRIM(i.generic_name)) || '%'
          )
        )
      ORDER BY i.name, p.name`,
      [text],
    );
    addRows(primary.rows, false);

    // 2) Per medicine: brand/synonym on Rx may not substring-match DB name — resolve generic
    const fromBody = medicineNamesRaw
      .map((s: unknown) => String(s).trim())
      .filter((s: string) => s.length >= 2);
    let fromAi: string[] = [];
    if (process.env.OPENAI_API_KEY) {
      try {
        fromAi = await extractMedicineNamesFromPrescription(text);
      } catch {
        fromAi = [];
      }
    }
    const nameSet = new Set<string>([...fromBody, ...fromAi]);

    for (const rawName of nameSet) {
      const n = rawName.trim();
      if (n.length < 2) continue;

      const byLabel = await pool.query<InventoryRow>(
        `${BASE_SELECT}
          AND (
            POSITION(LOWER($1::text) IN LOWER(i.name)) > 0
            OR POSITION(LOWER($1::text) IN LOWER(COALESCE(i.generic_name, ''))) > 0
          )
        ORDER BY i.name, p.name`,
        [n],
      );
      if (byLabel.rows.length > 0) {
        addRows(byLabel.rows, false);
        continue;
      }

      let resolved: string | null;
      if (genericResolveCache.has(n)) {
        resolved = genericResolveCache.get(n) ?? null;
      } else {
        resolved = await resolveMedicineGenericName(n);
        genericResolveCache.set(n, resolved);
      }
      if (!resolved) continue;

      const byGeneric = await pool.query<InventoryRow>(
        `${BASE_SELECT}
          AND (
            POSITION(LOWER($1::text) IN LOWER(i.name)) > 0
            OR POSITION(LOWER($1::text) IN LOWER(COALESCE(i.generic_name, ''))) > 0
          )
        ORDER BY i.name, p.name`,
        [resolved],
      );
      if (byGeneric.rows.length > 0) {
        addRows(byGeneric.rows, true);
      }
    }

    const products = [...merged.values()].map(({ row, viaGeneric }) =>
      mapProduct(row, viaGeneric),
    );

    products.sort((a, b) =>
      `${a.name} ${a.pharmacyName}`.localeCompare(`${b.name} ${b.pharmacyName}`),
    );

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error finding products by prescription:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("generic_name") && msg.includes("does not exist")) {
      return NextResponse.json(
        {
          error:
            "Database migration required: run scripts/add-pharmacy-inventory-generic-name.sql",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to find products" },
      { status: 500 },
    );
  }
}
