import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DATA_FILE = path.join(process.cwd(), "src", "data", "pharmacy.json");

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    // If file missing or invalid, return default
    return { medications: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  try {
    const data = await readData();
    // Also return a small summary of totals for dashboard
    const totalStock = (data.medications || []).reduce(
      (acc: number, m: any) => acc + (m.stock || 0),
      0,
    );
    const totalItems = (data.medications || []).length;

    return NextResponse.json({
      success: true,
      medications: data.medications,
      summary: { totalStock, totalItems },
    });
  } catch (error) {
    console.error("Error reading pharmacy data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only VETERINARIAN and SUPER_ADMIN can create medications
    if (!["VETERINARIAN", "SUPER_ADMIN"].includes(session.user.userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      form,
      strength,
      stock = 0,
      expiry,
      description = "",
      price = 0,
    } = body;

    if (!name || !form) {
      return NextResponse.json(
        { error: "Missing required fields: name and form" },
        { status: 400 },
      );
    }

    const data = await readData();
    const medications = data.medications || [];

    const nextId =
      medications.length > 0
        ? Math.max(...medications.map((m: any) => m.id)) + 1
        : 1;

    const newMed = {
      id: nextId,
      name,
      form,
      strength: strength || "",
      stock,
      expiry: expiry || null,
      description,
      price,
    };

    medications.unshift(newMed);
    await writeData({ medications });

    return NextResponse.json(
      { success: true, medication: newMed },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating medication:", error);
    return NextResponse.json(
      { error: "Failed to create medication" },
      { status: 500 },
    );
  }
}
