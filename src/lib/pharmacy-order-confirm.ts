import pool from "@/lib/db";

/**
 * Confirms a pharmacy order that was created with prepareForPayment (status pending_payment).
 * Deducts stock, records sales, and sets order status to "paid".
 * Idempotent: if order is already "paid", no-op.
 */
export async function confirmPharmacyOrderPayment(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRow = await client.query(
      `SELECT id, status, order_date FROM pharmacy_orders WHERE id = $1::uuid`,
      [orderId],
    );
    if (orderRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Order not found" };
    }
    const order = orderRow.rows[0];
    if (order.status !== "pending_payment") {
      await client.query("ROLLBACK");
      return { success: true }; // already confirmed
    }

    const orderDate = order.order_date;
    const itemsRows = await client.query(
      `SELECT order_id, inventory_item_id, pharmacy_id, quantity, unit_price, total_price
       FROM pharmacy_order_items WHERE order_id = $1::uuid`,
      [orderId],
    );

    for (const row of itemsRows.rows) {
      await client.query(
        `UPDATE pharmacy_inventory_items
         SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2::uuid`,
        [row.quantity, row.inventory_item_id],
      );
      const nameRow = await client.query(
        `SELECT name FROM pharmacy_inventory_items WHERE id = $1::uuid`,
        [row.inventory_item_id],
      );
      const itemName = nameRow.rows[0]?.name || "Medicine";
      await client.query(
        `INSERT INTO pharmacy_medicine_sales (
          pharmacy_id, inventory_item_id, medicine_id, sale_date,
          quantity_sold, price_at_sale, promotion_active, created_at, updated_at
        ) VALUES ($1::uuid, $2::uuid, $3, $4::date, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          row.pharmacy_id,
          row.inventory_item_id,
          itemName,
          orderDate,
          row.quantity,
          row.unit_price,
          false,
        ],
      );
    }

    await client.query(
      `UPDATE pharmacy_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2::uuid`,
      ["paid", orderId],
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("confirmPharmacyOrderPayment error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to confirm order",
    };
  } finally {
    client.release();
  }
}
