import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

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
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const pharmacy = pharmacyCheck.rows[0];

    // Check if user owns the pharmacy or is admin
    const userRole = (session.user as any)?.userRole || "USER";
    if (
      pharmacy.owner_id !== session.user.id &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get inventory items
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

// POST - Add inventory item to pharmacy
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
    const body = await request.json();
    const { name, form, strength, stock = 0, expiry = null, price = 0 } = body;

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
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (
      pharmacy.owner_id !== session.user.id &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert inventory item
    const result = await pool.query(
      `INSERT INTO pharmacy_inventory_items (
        pharmacy_id,
        name,
        form,
        strength,
        stock,
        price,
        expiry_date,
        created_at,
        updated_at
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        paramId,
        name,
        form,
        strength || null,
        stock,
        price,
        expiry || null,
      ],
    );

    const itemRow = result.rows[0];

    // Transform to match expected format
    const newItem = {
      id: parseInt(itemRow.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
      uuid: itemRow.id, // Store UUID for future updates
      name: itemRow.name,
      form: itemRow.form,
      strength: itemRow.strength || "",
      stock: itemRow.stock || 0,
      expiry: itemRow.expiry_date
        ? itemRow.expiry_date.toISOString().split("T")[0]
        : null,
      price: itemRow.price ? Number(itemRow.price) : 0,
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
    }

    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 },
    );
  }
}

// PUT - Update inventory item
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string; itemId: string }> },
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id, itemId: itemIdParam } = await params;
//     const body = await request.json();

//     // Verify pharmacy exists and user has access
//     const pharmacyCheck = await pool.query(
//       "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
//       [id],
//     );

//     if (pharmacyCheck.rows.length === 0) {
//       return NextResponse.json(
//         { error: "Pharmacy not found" },
//         { status: 404 },
//       );
//     }

//     const pharmacy = pharmacyCheck.rows[0];
//     const userRole = (session.user as any)?.userRole || "USER";

//     if (
//       pharmacy.owner_id !== session.user.id &&
//       userRole !== "SUPER_ADMIN"
//     ) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     // Update inventory item - itemIdParam should be UUID
//     const result = await pool.query(
//       `UPDATE pharmacy_inventory_items
//        SET 
//          name = COALESCE($1, name),
//          form = COALESCE($2, form),
//          strength = COALESCE($3, strength),
//          stock = COALESCE($4, stock),
//          price = COALESCE($5, price),
//          expiry_date = COALESCE($6::date, expiry_date),
//          updated_at = CURRENT_TIMESTAMP
//        WHERE id = $7::uuid AND pharmacy_id = $8::uuid
//        RETURNING *`,
//       [
//         body.name || null,
//         body.form || null,
//         body.strength || null,
//         body.stock !== undefined ? body.stock : null,
//         body.price !== undefined ? body.price : null,
//         body.expiry || null,
//         itemIdParam, // UUID
//         id, // pharmacy_id UUID
//       ],
//     );

//     if (result.rows.length === 0) {
//       return NextResponse.json({ error: "Item not found" }, { status: 404 });
//     }

//     const itemRow = result.rows[0];

//     const updated = {
//       id: parseInt(itemRow.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
//       uuid: itemRow.id,
//       name: itemRow.name,
//       form: itemRow.form,
//       strength: itemRow.strength || "",
//       stock: itemRow.stock || 0,
//       expiry: itemRow.expiry_date
//         ? itemRow.expiry_date.toISOString().split("T")[0]
//         : null,
//       price: itemRow.price ? Number(itemRow.price) : 0,
//     };

//     return NextResponse.json({ success: true, item: updated });
//   } catch (error) {
//     console.error("Error updating inventory item:", error);
//     return NextResponse.json(
//       { error: "Failed to update" },
//       { status: 500 },
//     );
//   }
// }

// // DELETE - Delete inventory item
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string; itemId: string }> },
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id, itemId: itemIdParam } = await params;

//     // Verify pharmacy exists and user has access
//     const pharmacyCheck = await pool.query(
//       "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
//       [id],
//     );

//     if (pharmacyCheck.rows.length === 0) {
//       return NextResponse.json(
//         { error: "Pharmacy not found" },
//         { status: 404 },
//       );
//     }

//     const pharmacy = pharmacyCheck.rows[0];
//     const userRole = (session.user as any)?.userRole || "USER";

//     if (
//       pharmacy.owner_id !== session.user.id &&
//       userRole !== "SUPER_ADMIN"
//     ) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     // Delete inventory item - itemIdParam should be UUID
//     const result = await pool.query(
//       `DELETE FROM pharmacy_inventory_items
//        WHERE id = $1::uuid AND pharmacy_id = $2::uuid
//        RETURNING *`,
//       [itemIdParam, id],
//     );

//     if (result.rows.length === 0) {
//       return NextResponse.json({ error: "Item not found" }, { status: 404 });
//     }

//     const removedRow = result.rows[0];
//     const removed = {
//       id: parseInt(removedRow.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
//       name: removedRow.name,
//       form: removedRow.form,
//       strength: removedRow.strength || "",
//       stock: removedRow.stock || 0,
//       expiry: removedRow.expiry_date
//         ? removedRow.expiry_date.toISOString().split("T")[0]
//         : null,
//       price: removedRow.price ? Number(removedRow.price) : 0,
//     };

//     return NextResponse.json({ success: true, item: removed });
//   } catch (error) {
//     console.error("Error deleting inventory item:", error);
//     return NextResponse.json(
//       { error: "Failed to delete" },
//       { status: 500 },
//     );
//   }
// }




// PUT - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, itemId: itemIdParam } = await params;
    const body = await request.json();

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [id],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (
      pharmacy.owner_id !== session.user.id &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update inventory item - itemIdParam is UUID from route params
    const result = await pool.query(
      `UPDATE pharmacy_inventory_items
       SET 
         name = COALESCE($1, name),
         form = COALESCE($2, form),
         strength = COALESCE($3, strength),
         stock = COALESCE($4, stock),
         price = COALESCE($5, price),
         expiry_date = COALESCE($6::date, expiry_date),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7::uuid AND pharmacy_id = $8::uuid
       RETURNING *`,
      [
        body.name || null,
        body.form || null,
        body.strength || null,
        body.stock !== undefined ? body.stock : null,
        body.price !== undefined ? body.price : null,
        body.expiry || null,
        itemIdParam, // UUID from route params
        id, // pharmacy_id UUID
      ],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const itemRow = result.rows[0];

    const updated = {
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
    };

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 },
    );
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, itemId: itemIdParam } = await params;

    // Verify pharmacy exists and user has access
    const pharmacyCheck = await pool.query(
      "SELECT id, owner_id FROM pharmacies WHERE id = $1::uuid",
      [id],
    );

    if (pharmacyCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const pharmacy = pharmacyCheck.rows[0];
    const userRole = (session.user as any)?.userRole || "USER";

    if (
      pharmacy.owner_id !== session.user.id &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete inventory item - itemIdParam is UUID from route params
    const result = await pool.query(
      `DELETE FROM pharmacy_inventory_items
       WHERE id = $1::uuid AND pharmacy_id = $2::uuid
       RETURNING *`,
      [itemIdParam, id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const removedRow = result.rows[0];
    const removed = {
      id: parseInt(removedRow.id.replace(/-/g, "").substring(0, 8), 16) % 1000000,
      name: removedRow.name,
      form: removedRow.form,
      strength: removedRow.strength || "",
      stock: removedRow.stock || 0,
      expiry: removedRow.expiry_date
        ? removedRow.expiry_date.toISOString().split("T")[0]
        : null,
      price: removedRow.price ? Number(removedRow.price) : 0,
    };

    return NextResponse.json({ success: true, item: removed });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 },
    );
  }
}