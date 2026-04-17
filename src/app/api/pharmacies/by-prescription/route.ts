import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

/**
 * POST /api/pharmacies/by-prescription
 * Body: { text: string } - extracted prescription text
 * Returns products (pharmacy_inventory_items) that match the prescription text,
 * each with full pharmacy details (name, address, pickup, delivery).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Prescription text is required" },
        { status: 400 },
      );
    }

    // Get inventory items whose name appears in prescription text (stock > 0)
    // with pharmacy details
    const result = await pool.query(
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
        p.name AS pharmacy_name,
        p.address AS pharmacy_address,
        p.pickup_available,
        p.delivery_available,
        p.delivery_fee
      FROM pharmacy_inventory_items i
      INNER JOIN pharmacies p ON p.id = i.pharmacy_id
      WHERE i.stock > 0
        AND LOWER($1) LIKE '%' || LOWER(TRIM(i.name)) || '%'
      ORDER BY i.name, p.name`,
      [text],
    );

    const products = result.rows.map((row) => ({
      id: row.inventory_item_id,
      name: row.name,
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
    }));

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error finding products by prescription:", error);
    return NextResponse.json(
      { error: "Failed to find products" },
      { status: 500 },
    );
  }
}
