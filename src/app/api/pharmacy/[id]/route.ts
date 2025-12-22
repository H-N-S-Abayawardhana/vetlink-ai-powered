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
    return { medications: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["VETERINARIAN", "SUPER_ADMIN"].includes(session.user.userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json();

    const data = await readData();
    const medications = data.medications || [];

    const idx = medications.findIndex((m: any) => m.id === id);
    if (idx === -1)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = { ...medications[idx], ...body };
    medications[idx] = updated;

    await writeData({ medications });

    return NextResponse.json({ success: true, medication: updated });
  } catch (error) {
    console.error("Error updating medication:", error);
    return NextResponse.json(
      { error: "Failed to update medication" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["VETERINARIAN", "SUPER_ADMIN"].includes(session.user.userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const data = await readData();
    const medications = data.medications || [];

    const idx = medications.findIndex((m: any) => m.id === id);
    if (idx === -1)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deleted = medications.splice(idx, 1)[0];
    await writeData({ medications });

    return NextResponse.json({ success: true, medication: deleted });
  } catch (error) {
    console.error("Error deleting medication:", error);
    return NextResponse.json(
      { error: "Failed to delete medication" },
      { status: 500 },
    );
  }
}
