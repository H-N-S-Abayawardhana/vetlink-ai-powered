import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src", "data", "products.json");

async function read() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { products: [] };
  }
}

export async function GET() {
  const data = await read();
  return NextResponse.json({ success: true, products: data.products });
}
