import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

/** Matches Postgres `uuid` text form (hex with hyphens), not RFC variant–strict */
const UUID_HEX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
  return UUID_HEX_RE.test(s);
}

function rowToClientItem(row: {
  id: string;
  name: string;
  form: string;
  strength?: string | null;
  stock: number;
  price: unknown;
  expiry_date: Date | null;
  image_url?: string | null;
  generic_name?: string | null;
}) {
  return {
    id: parseInt(row.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
    uuid: row.id,
    name: row.name,
    form: row.form,
    strength: row.strength || "",
    stock: row.stock || 0,
    expiry: row.expiry_date
      ? row.expiry_date.toISOString().split("T")[0]
      : null,
    price: row.price ? Number(row.price) : 0,
    image_url: row.image_url || null,
    generic_name: String(row.generic_name ?? ""),
  };
}

async function assertPharmacyAccess(
  pharmacyId: string,
  sessionUserId: string,
  userRole: string,
) {
  const pharmacyCheck = await pool.query(
    "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
    [pharmacyId],
  );
  if (pharmacyCheck.rows.length === 0) {
    return { error: "Pharmacy not found" as const, status: 404 as const };
  }
  const pharmacy = pharmacyCheck.rows[0];
  if (pharmacy.owner_id !== sessionUserId && userRole !== "SUPER_ADMIN") {
    return { error: "Forbidden" as const, status: 403 as const };
  }
  return { pharmacy };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: pharmacyId, itemId } = await params;
    const userRole = (session.user as { userRole?: string })?.userRole || "USER";

    if (!isUuid(pharmacyId) || !isUuid(itemId)) {
      return NextResponse.json(
        { error: "Invalid id — refresh the page and try again" },
        { status: 400 },
      );
    }

    const access = await assertPharmacyAccess(
      pharmacyId,
      session.user.id as string,
      userRole,
    );
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = await request.json();
    const name = body.name?.trim();
    const form = body.form?.trim();
    if (!name || !form) {
      return NextResponse.json(
        { error: "Missing required fields: name and form" },
        { status: 400 },
      );
    }

    const strength =
      body.strength === undefined || body.strength === null
        ? null
        : String(body.strength).trim() || null;
    const stock = Math.max(0, Number(body.stock) || 0);
    const price = Math.max(0, Number(body.price) || 0);
    const expiry =
      body.expiry && String(body.expiry).trim()
        ? String(body.expiry).trim()
        : null;
    const genericName =
      typeof body.generic_name === "string"
        ? body.generic_name.trim() || null
        : null;

    const result = await pool.query(
      `UPDATE pharmacy_inventory_items
       SET
         name = $3,
         form = $4,
         strength = $5,
         stock = $6,
         price = $7,
         expiry_date = $8,
         generic_name = $9,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid AND pharmacy_id = $2::uuid
       RETURNING
         id,
         name,
         form,
         strength,
         stock,
         price,
         expiry_date,
         image_url,
         generic_name`,
      [
        itemId,
        pharmacyId,
        name,
        form,
        strength,
        stock,
        price,
        expiry,
        genericName,
      ],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = rowToClientItem(result.rows[0]);
    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error("Error updating inventory item:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: pharmacyId, itemId } = await params;
    const userRole = (session.user as { userRole?: string })?.userRole || "USER";

    if (!isUuid(pharmacyId) || !isUuid(itemId)) {
      return NextResponse.json(
        { error: "Invalid id — refresh the page and try again" },
        { status: 400 },
      );
    }

    const access = await assertPharmacyAccess(
      pharmacyId,
      session.user.id as string,
      userRole,
    );
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const del = await pool.query(
      `DELETE FROM pharmacy_inventory_items
       WHERE id = $1::uuid AND pharmacy_id = $2::uuid
       RETURNING id`,
      [itemId, pharmacyId],
    );

    if (del.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting inventory item:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
