import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

/**
 * GET /api/pharmacy/products
 * Returns all products from pharmacy_inventory_items (with stock > 0)
 * joined with pharmacy details for the shopping page.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        p.address AS pharmacy_address
      FROM pharmacy_inventory_items i
      INNER JOIN pharmacies p ON p.id = i.pharmacy_id
      WHERE i.stock > 0
      ORDER BY i.name, p.name`,
    );

    const products = result.rows.map((row) => ({
      id: row.inventory_item_id,
      uuid: row.inventory_item_id,
      name: row.name,
      form: row.form || "",
      strength: row.strength || "",
      stock: row.stock ?? 0,
      price: Number(row.price) || 0,
      expiry: row.expiry_date
        ? row.expiry_date.toISOString().split("T")[0]
        : null,
      pharmacyId: row.pharmacy_id,
      pharmacyName: row.pharmacy_name || "",
      pharmacyAddress: row.pharmacy_address || "",
      image: row.image_url || null,
    }));

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching pharmacy products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
