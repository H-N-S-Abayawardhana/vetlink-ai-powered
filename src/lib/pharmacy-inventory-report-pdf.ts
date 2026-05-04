import { jsPDF } from "jspdf";
import { formatLKR } from "@/lib/currency";
import { VETLINK_LOGO_LIGHT } from "@/lib/brand-assets";

export type InventoryReportRow = {
  name: string;
  generic_name?: string;
  form: string;
  strength?: string;
  stock: number;
  expiry?: string | null;
  price: number;
};

export type PharmacyInventoryReportInput = {
  pharmacyName: string;
  generatedAt: Date;
  rows: InventoryReportRow[];
  summary: {
    totalItems: number;
    lowStock: number;
    expiringSoon: number;
    totalValue: number;
  };
};

const BRAND: [number, number, number] = [30, 64, 175];
const ACCENT: [number, number, number] = [59, 130, 246];
const MUTED: [number, number, number] = [75, 85, 99];
const MARGIN = 40;
const FRAME_INSET = 14;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function truncate(s: string, max: number): string {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function rowStatus(stock: number, expiry: string | null | undefined): string {
  const parts: string[] = [];
  if (stock < 10) parts.push("Low stock");
  if (!expiry) return parts.join(", ") || "OK";
  const d = new Date(expiry);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(d);
  exp.setHours(0, 0, 0, 0);
  const days = Math.ceil(
    (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) parts.push("Expired");
  else if (days > 0 && days <= 30) parts.push("Expiring soon");
  return parts.join(", ") || "OK";
}

function drawPageFrames(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(165, 180, 198);
    doc.setLineWidth(1.1);
    doc.roundedRect(
      FRAME_INSET,
      FRAME_INSET,
      pageWidth - 2 * FRAME_INSET,
      pageHeight - 2 * FRAME_INSET,
      3,
      3,
      "S",
    );
  }
}

function drawFooters(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, pageHeight - 32, pageWidth - MARGIN, pageHeight - 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 148, 158);
    doc.text(
      "VetLink · Pharmacy inventory snapshot · For internal stock control",
      MARGIN,
      pageHeight - 18,
    );
    doc.text(`Page ${i} of ${n}`, pageWidth / 2, pageHeight - 18, {
      align: "center",
    });
  }
}

/**
 * Stock & valuation snapshot for a pharmacy — suitable for audits and reorder planning.
 */
export async function generatePharmacyInventoryReportPdf(
  input: PharmacyInventoryReportInput,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentBottom = pageHeight - FRAME_INSET - 44;
  const maxW = pageWidth - 2 * MARGIN;

  const COL = {
    name: MARGIN,
    generic: MARGIN + 138,
    form: MARGIN + 228,
    stock: MARGIN + 318,
    expiry: MARGIN + 358,
    unit: MARGIN + 438,
    line: MARGIN + 518,
    status: MARGIN + 598,
  };

  let y = 0;

  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y - 2, maxW, 22, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 18, MARGIN + maxW, y + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Item", COL.name, y + 12);
    doc.text("Generic (INN)", COL.generic, y + 12);
    doc.text("Form / strength", COL.form, y + 12);
    doc.text("Stock", COL.stock, y + 12);
    doc.text("Expiry", COL.expiry, y + 12);
    doc.text("Unit price", COL.unit, y + 12);
    doc.text("Line value", COL.line, y + 12);
    doc.text("Status", COL.status, y + 12);
    y += 26;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= contentBottom) return;
    doc.addPage();
    y = MARGIN + 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND);
    doc.text("Inventory detail (continued)", MARGIN, y);
    y += 20;
    drawTableHeader();
  };

  // --- Header band ---
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 88, "F");

  try {
    const logoResponse = await fetch(VETLINK_LOGO_LIGHT, { cache: "no-cache" });
    if (logoResponse.ok) {
      const blob = await logoResponse.blob();
      const logoUrl = URL.createObjectURL(blob);
      const logoImg = await loadImage(logoUrl);
      URL.revokeObjectURL(logoUrl);
      if (logoImg) {
        doc.addImage(logoImg, "PNG", MARGIN, 24, 36, 14);
      }
    }
  } catch {
    /* optional logo */
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Stock & valuation report", MARGIN + 44, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Pharmacy inventory snapshot", MARGIN + 44, 56);

  doc.setFontSize(10);
  const phName = truncate(input.pharmacyName, 80);
  doc.text(phName, MARGIN, 74);

  doc.setTextColor(...MUTED);
  const genStr = input.generatedAt.toLocaleString();
  doc.text(`Generated: ${genStr}`, pageWidth - MARGIN, 74, { align: "right" });

  y = 108;

  // Summary strip
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, maxW, 52, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(MARGIN, y, maxW, 52, 4, 4, "S");

  const boxW = maxW / 4;
  const sumY = y + 18;
  const metrics: [string, string][] = [
    ["Total line items", String(input.summary.totalItems)],
    ["Low stock (<10 units)", String(input.summary.lowStock)],
    ["Expiring within 30 days", String(input.summary.expiringSoon)],
    ["Total inventory value", formatLKR(input.summary.totalValue)],
  ];
  metrics.forEach(([label, val], i) => {
    const x = MARGIN + i * boxW + 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label, x, sumY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(val, x, sumY + 18);
  });

  y += 68;

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND);
  doc.text("Inventory detail", MARGIN, y);
  y += 18;

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const sorted = [...input.rows].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  for (let i = 0; i < sorted.length; i += 1) {
    const r = sorted[i];
    ensureSpace(20);
    const formStr = [r.form, r.strength].filter(Boolean).join(" · ");
    const expStr = r.expiry ? new Date(r.expiry).toLocaleDateString() : "—";
    const lineVal = r.stock * r.price;
    const status = rowStatus(r.stock, r.expiry ?? null);

    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(MARGIN, y - 10, maxW, 18, "F");
    }

    doc.setTextColor(55, 65, 81);
    doc.text(truncate(r.name, 22), COL.name, y);
    doc.setTextColor(...MUTED);
    doc.text(truncate(r.generic_name || "—", 18), COL.generic, y);
    doc.text(truncate(formStr, 20), COL.form, y);
    doc.setTextColor(
      r.stock < 10 ? 220 : 55,
      r.stock < 10 ? 38 : 65,
      r.stock < 10 ? 38 : 81,
    );
    doc.text(String(r.stock), COL.stock, y);
    doc.setTextColor(...MUTED);
    doc.text(expStr, COL.expiry, y);
    doc.text(truncate(formatLKR(r.price), 14), COL.unit, y);
    doc.setTextColor(55, 65, 81);
    doc.text(truncate(formatLKR(lineVal), 14), COL.line, y);
    doc.setFontSize(7.5);
    doc.text(truncate(status, 24), COL.status, y);
    doc.setFontSize(8);

    y += 18;
  }

  if (sorted.length === 0) {
    ensureSpace(24);
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text("No inventory rows to display.", MARGIN, y);
    y += 20;
  }

  drawPageFrames(doc);
  drawFooters(doc);

  const stamp = input.generatedAt.toISOString().slice(0, 10);
  doc.save(`vetlink-inventory-stock-report-${stamp}.pdf`);
}

function csvEscape(cell: string): string {
  const t = String(cell ?? "");
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export function downloadPharmacyInventoryCsv(
  input: PharmacyInventoryReportInput,
): void {
  const headers = [
    "Item name",
    "Generic (INN)",
    "Form",
    "Strength",
    "Stock",
    "Expiry (ISO)",
    "Unit price (LKR)",
    "Line value (LKR)",
    "Status flags",
  ];

  const sorted = [...input.rows].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  const lines = [
    headers.join(","),
    ...sorted.map((r) => {
      const lineVal = r.stock * r.price;
      const expiryIso = r.expiry
        ? new Date(r.expiry).toISOString().slice(0, 10)
        : "";
      return [
        csvEscape(r.name),
        csvEscape(r.generic_name || ""),
        csvEscape(r.form),
        csvEscape(r.strength || ""),
        csvEscape(String(r.stock)),
        csvEscape(expiryIso),
        csvEscape(String(r.price)),
        csvEscape(String(Math.round(lineVal * 100) / 100)),
        csvEscape(rowStatus(r.stock, r.expiry ?? null)),
      ].join(",");
    }),
  ];

  const meta = [
    `# VetLink pharmacy inventory export`,
    `# Pharmacy: ${input.pharmacyName}`,
    `# Generated: ${input.generatedAt.toISOString()}`,
    `# Total items: ${input.summary.totalItems}; Low stock: ${input.summary.lowStock}; Expiring soon: ${input.summary.expiringSoon}; Total value LKR: ${input.summary.totalValue}`,
    "",
  ].join("\n");

  const bom = "\ufeff";
  const csv = bom + meta + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vetlink-inventory-export-${input.generatedAt.toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
