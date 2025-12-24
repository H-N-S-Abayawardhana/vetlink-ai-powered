import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function GET() {
  const data = await readData();
  return NextResponse.json({ success: true, pharmacies: data.pharmacies });
}

// POST /api/pharmacies - register a new pharmacy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      address,
      location,
      contact,
      delivery = {},
      inventory = [],
    } = body;

    if (!name || !location || !location.lat || !location.lng) {
      return NextResponse.json(
        { error: "Missing required fields: name, location" },
        { status: 400 },
      );
    }

    const data = await readData();
    const pharmacies = data.pharmacies || [];
    const nextId =
      pharmacies.length > 0
        ? Math.max(...pharmacies.map((p: any) => p.id)) + 1
        : 1;

    const newPharmacy = {
      id: nextId,
      name,
      address: address || "",
      location,
      contact: contact || {},
      delivery: { pickup: true, delivery: false, delivery_fee: 0, ...delivery },
      inventory: inventory || [],
      owner_id: session.user.id,
    };

    pharmacies.push(newPharmacy);
    await writeData({ pharmacies });

    return NextResponse.json(
      { success: true, pharmacy: newPharmacy },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registering pharmacy:", error);
    return NextResponse.json(
      { error: "Failed to register pharmacy" },
      { status: 500 },
    );
  }
}
