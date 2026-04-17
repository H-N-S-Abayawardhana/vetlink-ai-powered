import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "pharmacy-sales.json",
);

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return { sales: [], top: [], chart: { labels: [], values: [] } };
  }
}

export async function GET() {
  try {
    const data = await readData();
    // Build a simple summary
    const totalRevenue = (data.sales || []).reduce(
      (acc: number, s: any) => acc + s.price * s.quantity,
      0,
    );
    const totalOrders = (data.sales || []).length;

    return NextResponse.json({
      success: true,
      dashboard: {
        totalRevenue,
        totalOrders,
        top: data.top || [],
        chart: data.chart || {},
        recent: data.sales || [],
      },
    });
  } catch (error) {
    console.error("Error reading pharmacy dashboard data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}
