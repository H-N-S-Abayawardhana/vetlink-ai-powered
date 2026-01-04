import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// POST /api/pharmacy/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, delivery_address, delivery_method } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and cannot be empty" },
        { status: 400 },
      );
    }

    // Validate each item
    for (const item of items) {
      if (
        !item.pharmacyId ||
        !item.inventoryItemId ||
        !item.quantity ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid item data. Each item must have pharmacyId, inventoryItemId, and quantity > 0" },
          { status: 400 },
        );
      }
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderId = crypto.randomUUID();
      const userId = parseInt(session.user.id as string, 10);
      const orderDate = new Date();

      // Create order record
      const orderResult = await client.query(
        `INSERT INTO pharmacy_orders (
          id,
          user_id,
          order_date,
          status,
          delivery_address,
          delivery_method,
          total_amount,
          created_at,
          updated_at
        ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          orderId,
          userId,
          orderDate,
          "pending",
          delivery_address || null,
          delivery_method || "pickup",
          0, // Will be calculated
        ],
      );

      let totalAmount = 0;
      const orderItems = [];

      // Process each item
      for (const item of items) {
        // Verify inventory item exists and has enough stock
        const inventoryCheck = await client.query(
          `SELECT 
            id,
            pharmacy_id,
            name,
            stock,
            price
          FROM pharmacy_inventory_items
          WHERE id = $1::uuid AND pharmacy_id = $2::uuid`,
          [item.inventoryItemId, item.pharmacyId],
        );

        if (inventoryCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: `Inventory item ${item.inventoryItemId} not found` },
            { status: 404 },
          );
        }

        const inventoryItem = inventoryCheck.rows[0];

        // Check stock availability
        if (inventoryItem.stock < item.quantity) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.stock}, Requested: ${item.quantity}`,
            },
            { status: 400 },
          );
        }

        // Calculate item total
        const itemTotal = Number(inventoryItem.price) * item.quantity;
        totalAmount += itemTotal;

        // Create order item
        const orderItemResult = await client.query(
          `INSERT INTO pharmacy_order_items (
            order_id,
            inventory_item_id,
            pharmacy_id,
            quantity,
            unit_price,
            total_price,
            created_at
          ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            orderId,
            item.inventoryItemId,
            item.pharmacyId,
            item.quantity,
            inventoryItem.price,
            itemTotal,
          ],
        );

        // Update inventory stock
        await client.query(
          `UPDATE pharmacy_inventory_items
          SET stock = stock - $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2::uuid`,
          [item.quantity, item.inventoryItemId],
        );

        // Record sale for demand prediction
        await client.query(
          `INSERT INTO pharmacy_medicine_sales (
            pharmacy_id,
            inventory_item_id,
            medicine_id,
            sale_date,
            quantity_sold,
            price_at_sale,
            promotion_active,
            created_at,
            updated_at
          ) VALUES ($1::uuid, $2::uuid, $3, $4::date, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            item.pharmacyId,
            item.inventoryItemId,
            inventoryItem.name,
            orderDate,
            item.quantity,
            inventoryItem.price,
            false,
          ],
        );

        orderItems.push({
          id: orderItemResult.rows[0].id,
          inventoryItemId: item.inventoryItemId,
          name: inventoryItem.name,
          quantity: item.quantity,
          unitPrice: Number(inventoryItem.price),
          totalPrice: itemTotal,
        });
      }

      // Update order total
      await client.query(
        `UPDATE pharmacy_orders
        SET total_amount = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2::uuid`,
        [totalAmount, orderId],
      );

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          order: {
            id: orderId,
            userId,
            orderDate,
            status: "pending",
            totalAmount,
            items: orderItems,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/pharmacy/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
        o.id,
        o.order_date,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.delivery_method,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM pharmacy_orders o
      LEFT JOIN pharmacy_order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50`,
      [parseInt(session.user.id as string, 10)],
    );

    const orders = result.rows.map((row) => ({
      id: row.id,
      orderDate: row.order_date,
      status: row.status,
      totalAmount: Number(row.total_amount),
      deliveryAddress: row.delivery_address,
      deliveryMethod: row.delivery_method,
      itemCount: parseInt(row.item_count),
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

