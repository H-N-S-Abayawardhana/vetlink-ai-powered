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

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/pharmacies/match  { items: [{name, qty}], lat, lng, maxDistanceKm }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items = [], lat, lng, maxDistanceKm = 50 } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const data = await readData();
    const pharmacies = data.pharmacies || [];

    // Find pharmacies which have all items available in required qty (default 1)
    const results: any[] = [];

    pharmacies.forEach((p: any) => {
      let hasAll = true;
      const matchedItems: any[] = [];
      let totalPrice = 0;

      for (const it of items) {
        const name = it.name?.toLowerCase?.() || "";
        const qty = it.qty || 1;

        const found = (p.inventory || []).find(
          (inv: any) => (inv.name || "").toLowerCase() === name,
        );
        if (!found || (found.stock || 0) < qty) {
          hasAll = false;
          break;
        }

        matchedItems.push({
          medication: found.name,
          qty,
          unitPrice: found.price,
          total: (found.price || 0) * qty,
        });
        totalPrice += (found.price || 0) * qty;
      }

      if (hasAll) {
        let distance = null;
        if (lat != null && lng != null && p.location) {
          distance = haversineDistance(
            Number(lat),
            Number(lng),
            Number(p.location.lat),
            Number(p.location.lng),
          );
        }
        // If distance is within bounds (if provided), include
        if (distance == null || distance <= maxDistanceKm) {
          results.push({
            id: p.id,
            name: p.name,
            address: p.address,
            contact: p.contact,
            location: p.location,
            delivery: p.delivery,
            distanceKm: distance,
            items: matchedItems,
            totalPrice,
          });
        }
      }
    });

    // Sort by distance then price
    results.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return a.totalPrice - b.totalPrice;
    });

    return NextResponse.json({ success: true, matches: results });
  } catch (error) {
    console.error("Error matching pharmacies:", error);
    return NextResponse.json(
      { error: "Failed to match pharmacies" },
      { status: 500 },
    );
  }
}
