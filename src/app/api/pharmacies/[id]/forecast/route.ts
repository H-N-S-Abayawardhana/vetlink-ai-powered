import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const PHARM_DATA = path.join(process.cwd(), "src", "data", "pharmacies.json");
const SALES_DATA = path.join(
  process.cwd(),
  "src",
  "data",
  "pharmacy-sales.json",
);

async function readJson(p: string) {
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const pid = Number(id);
    if (isNaN(pid))
      return NextResponse.json(
        { error: "Invalid pharmacy id" },
        { status: 400 },
      );

    const pharm = await readJson(PHARM_DATA);
    const sales = await readJson(SALES_DATA);
    if (!pharm || !sales)
      return NextResponse.json({ error: "Data missing" }, { status: 500 });

    const pharmacy = (pharm.pharmacies || []).find((p: any) => p.id === pid);
    if (!pharmacy)
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 },
      );

    // Build simple demand forecast from sales data: use last 30 days count per product
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);

    const counts: Record<string, number> = {};
    (sales.sales || []).forEach((s: any) => {
      const d = new Date(s.date);
      if (d >= cutoff) {
        counts[s.medication] = (counts[s.medication] || 0) + (s.quantity || 0);
      }
    });

    // Recommendation per item in pharmacy inventory
    const recommendations: any[] = [];
    const alerts: any[] = [];

    (pharmacy.inventory || []).forEach((i: any) => {
      const soldLast30 = counts[i.name] || 0;
      // forecast next 30 days = soldLast30 (naive)
      const forecastNext30 = soldLast30;
      const optimal = Math.max(Math.ceil(forecastNext30 * 1.5), 10); // safety stock

      if ((i.stock || 0) < Math.ceil(forecastNext30 * 0.5)) {
        alerts.push({
          type: "low_stock",
          medication: i.name,
          stock: i.stock,
          recommended: optimal,
        });
      }

      if (i.expiry) {
        const expiry = new Date(i.expiry);
        const daysLeft = Math.ceil(
          (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysLeft <= 60) {
          alerts.push({
            type: "expiring",
            medication: i.name,
            daysLeft,
            expiry: i.expiry,
          });
        }
      }

      recommendations.push({
        medication: i.name,
        stock: i.stock,
        forecastNext30,
        optimalStock: optimal,
      });
    });

    // Sales overview
    const totalRevenue = (sales.sales || []).reduce(
      (acc: number, s: any) => acc + (s.price || 0) * (s.quantity || 0),
      0,
    );

    return NextResponse.json({
      success: true,
      pharmacyId: pid,
      recommendations,
      alerts,
      salesOverview: { totalRevenue },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to compute forecast" },
      { status: 500 },
    );
  }
}
