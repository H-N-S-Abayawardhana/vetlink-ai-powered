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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: paramId } = await params;
  const id = parseInt(paramId, 10);
  if (isNaN(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const data = await readData();
  const pharmacy = (data.pharmacies || []).find((p: any) => p.id === id);
  if (!pharmacy)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    inventory: pharmacy.inventory || [],
  });
}

// Add inventory item to pharmacy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json();
    const { name, form, strength, stock = 0, expiry = null, price = 0 } = body;
    if (!name || !form)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );

    const data = await readData();
    const pharmacies = data.pharmacies || [];
    const pharmacy = pharmacies.find((p: any) => p.id === id);
    if (!pharmacy)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const inv = pharmacy.inventory || [];
    const nextId =
      inv.length > 0 ? Math.max(...inv.map((i: any) => i.id)) + 1 : 1;
    const newItem = {
      id: nextId,
      name,
      form,
      strength: strength || "",
      stock,
      expiry,
      price,
    };

    inv.push(newItem);
    pharmacy.inventory = inv;
    await writeData({ pharmacies });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (err) {
    console.error("Error adding inventory:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
