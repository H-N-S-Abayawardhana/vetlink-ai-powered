import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { uploadInventoryImageToS3 } from "@/lib/s3";
import { resolveMedicineGenericName } from "@/lib/medicine-generic-resolve";

// GET - Fetch inventory items for a pharmacy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paramId } = await params;

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [paramId],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];

    // Check if user owns the pharmacy or is admin
    const userRole = (session.user as any)?.userRole || "USER";
    if (pharmacy.owner_id !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get inventory items (image_url optional - run migration if missing)
    const result = await pool.query(
      `SELECT 
        id,
        pharmacy_id,
        name,
        form,
        strength,
        stock,
        price,
        expiry_date,
        image_url,
        COALESCE(generic_name, '') AS generic_name,
        created_at,
        updated_at
      FROM pharmacy_inventory_items
      WHERE pharmacy_id = $1::uuid
      ORDER BY created_at DESC`,
      [paramId],
    );

    // Transform to match expected format
    const inventory = result.rows.map((row) => ({
      id: parseInt(row.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
      uuid: row.id, // Store UUID for updates
      name: row.name,
      form: row.form,
      strength: row.strength || "",
      stock: row.stock || 0,
      expiry: row.expiry_date
        ? row.expiry_date.toISOString().split("T")[0]
        : null,
      price: row.price ? Number(row.price) : 0,
      image_url: row.image_url || null,
      generic_name: String((row as { generic_name?: string }).generic_name ?? ""),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

// POST - Add inventory item to pharmacy (JSON or multipart/form-data with optional image)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paramId } = await params;
    const contentType = request.headers.get("content-type") || "";
    let name: string;
    let form: string;
    let strength: string | null = null;
    let stock = 0;
    let expiry: string | null = null;
    let price = 0;
    let imageUrl: string | null = null;
    let genericName: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = (formData.get("name") as string)?.trim() || "";
      form = (formData.get("form") as string)?.trim() || "";
      strength = (formData.get("strength") as string)?.trim() || null;
      const g = (formData.get("generic_name") as string)?.trim();
      genericName = g || null;
      stock = Math.max(0, Number(formData.get("stock")) || 0);
      const expiryVal = formData.get("expiry");
      expiry =
        expiryVal && String(expiryVal).trim() ? String(expiryVal).trim() : null;
      price = Math.max(0, Number(formData.get("price")) || 0);

      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
          ? ext
          : "jpg";
        const filename = `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
        const mime = file.type || "image/jpeg";
        imageUrl = await uploadInventoryImageToS3(buffer, filename, mime);
      }
    } else {
      const body = await request.json();
      name = body.name?.trim() || "";
      form = body.form?.trim() || "";
      strength = body.strength?.trim() || null;
      stock = Number(body.stock) || 0;
      expiry = body.expiry?.trim() || null;
      price = Number(body.price) || 0;
      const g = typeof body.generic_name === "string" ? body.generic_name.trim() : "";
      genericName = g || null;
    }

    if (!name || !form) {
      return NextResponse.json(
        { error: "Missing required fields: name and form" },
        { status: 400 },
      );
    }

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [paramId],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (pharmacy.owner_id !== session.user.id && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let genericResolved = genericName;
    if (!genericResolved && process.env.OPENAI_API_KEY) {
      try {
        genericResolved = await resolveMedicineGenericName(name);
      } catch {
        genericResolved = null;
      }
    }

    // Insert inventory item (image_url column: run ALTER TABLE pharmacy_inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT; if needed)
    const result = await pool.query(
      `INSERT INTO pharmacy_inventory_items (
        pharmacy_id,
        name,
        form,
        strength,
        stock,
        price,
        expiry_date,
        image_url,
        generic_name,
        created_at,
        updated_at
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        paramId,
        name,
        form,
        strength || null,
        stock,
        price,
        expiry || null,
        imageUrl || null,
        genericResolved || null,
      ],
    );

    const itemRow = result.rows[0];

    const newItem = {
      id: parseInt(itemRow.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
      uuid: itemRow.id,
      name: itemRow.name,
      form: itemRow.form,
      strength: itemRow.strength || "",
      stock: itemRow.stock || 0,
      expiry: itemRow.expiry_date
        ? itemRow.expiry_date.toISOString().split("T")[0]
        : null,
      price: itemRow.price ? Number(itemRow.price) : 0,
      image_url: itemRow.image_url || null,
      generic_name: (itemRow as { generic_name?: string | null }).generic_name || "",
    };

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error adding inventory:", error);

    if (error instanceof Error) {
      if (error.message.includes("foreign key")) {
        return NextResponse.json(
          { error: "Invalid pharmacy ID" },
          { status: 400 },
        );
      }
      if (error.message.includes('column "image_url" does not exist')) {
        return NextResponse.json(
          {
            error:
              "Database migration required. Run: ALTER TABLE pharmacy_inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;",
          },
          { status: 500 },
        );
      }
      if (
        error.message.includes("generic_name") &&
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Database migration required: run scripts/add-pharmacy-inventory-generic-name.sql",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
