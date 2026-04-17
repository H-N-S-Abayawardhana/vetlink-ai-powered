import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "pharmacies.json");

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return { pharmacies: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId: itemIdParam } = await params;
    const pid = parseInt(id, 10);
    const itemId = parseInt(itemIdParam, 10);
    if (isNaN(pid) || isNaN(itemId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json();

    const data = await readData();
    const pharmacies = data.pharmacies || [];
    const pharmacy = pharmacies.find((p: any) => p.id === pid);
    if (!pharmacy)
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );

    const idx = (pharmacy.inventory || []).findIndex(
      (i: any) => i.id === itemId,
    );
    if (idx === -1)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const updated = { ...pharmacy.inventory[idx], ...body };
    pharmacy.inventory[idx] = updated;

    await writeData({ pharmacies });
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
    const { id, itemId: itemIdParam } = await params;
    const pid = parseInt(id, 10);
    const itemId = parseInt(itemIdParam, 10);
    if (isNaN(pid) || isNaN(itemId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const data = await readData();
    const pharmacies = data.pharmacies || [];
    const pharmacy = pharmacies.find((p: any) => p.id === pid);
    if (!pharmacy)
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );

    const idx = (pharmacy.inventory || []).findIndex(
      (i: any) => i.id === itemId,
    );
    if (idx === -1)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const removed = pharmacy.inventory.splice(idx, 1)[0];
    await writeData({ pharmacies });

    return NextResponse.json({ success: true, item: removed });
  } catch (err) {
    console.error("Error deleting inventory item:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
