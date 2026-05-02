import { jsPDF } from "jspdf";
import { VETLINK_LOGO_LIGHT } from "@/lib/brand-assets";

export type SkinDiseaseGuidanceSection = {
  title: string;
  body: string;
};

export type SkinDiseaseReportPdfInput = {
  pet: { name: string; breed?: string | null; ageYears?: number | null } | null;
  diseaseDisplay: string;
  severityLabel: string | null;
  confidence: number;
  xaiExplanation: string | null;
  clinicalImageDataUrl: string;
  saliencyImageDataUrl: string | null;
  guidanceSections: SkinDiseaseGuidanceSection[];
  healthySkinSection: SkinDiseaseGuidanceSection | null;
};

const BRAND: [number, number, number] = [30, 64, 175];
const ACCENT: [number, number, number] = [59, 130, 246];
const MUTED: [number, number, number] = [75, 85, 99];
const FRAME_INSET = 14;
const MARGIN = 52;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Outer border + inner rule on every page (call after all content). */
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
    doc.setDrawColor(220, 228, 238);
    doc.setLineWidth(0.45);
    doc.roundedRect(
      FRAME_INSET + 5,
      FRAME_INSET + 5,
      pageWidth - 2 * FRAME_INSET - 10,
      pageHeight - 2 * FRAME_INSET - 10,
      2,
      2,
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
    doc.line(MARGIN, pageHeight - 38, pageWidth - MARGIN, pageHeight - 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 148, 158);
    doc.text(
      "VetLink · Informational report only · Not a veterinary diagnosis",
      MARGIN,
      pageHeight - 26,
    );
    doc.text(`Page ${i} of ${n}`, pageWidth / 2, pageHeight - 14, {
      align: "center",
    });
  }
}

export async function generateSkinDiseaseReportPdf(
  input: SkinDiseaseReportPdfInput,
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - 2 * MARGIN;
  const contentBottom = pageHeight - FRAME_INSET - 48;

  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed <= contentBottom) return;
    doc.addPage();
    drawContinuationHeader();
    y = 92;
  };

  const drawContinuationHeader = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 68, "F");
    doc.setTextColor(...BRAND);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Skin Disease Detection Report", MARGIN, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("(continued)", MARGIN + 198, 38);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, 52, pageWidth - MARGIN, 52);
  };

  const drawSectionHeader = (title: string) => {
    ensureSpace(42);
    y += 8;
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(MARGIN, y - 14, maxWidth, 30, 5, 5, "F");
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(MARGIN, y - 14, maxWidth, 30, 5, 5, "S");
    doc.setTextColor(...BRAND);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, MARGIN + 14, y + 5);
    y += 28;
  };

  const drawField = (
    label: string,
    value: string,
    valueColor?: [number, number, number],
  ) => {
    const valueLines = doc.splitTextToSize(value || "—", maxWidth - 148);
    const rowH = Math.max(18, valueLines.length * 15);
    ensureSpace(rowH + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(`${label}`, MARGIN + 6, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...(valueColor ?? MUTED));
    valueLines.forEach((line: string, idx: number) => {
      doc.text(line, MARGIN + 148, y + 4 + idx * 15);
    });
    y += rowH + 4;
  };

  const drawWrapped = (text: string, lineHeight = 14) => {
    const lines = doc.splitTextToSize(text.trim(), maxWidth - 12);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      doc.text(line, MARGIN + 6, y);
      y += lineHeight;
    });
    y += 6;
  };

  // --- Page 1 header ---
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 92, "F");

  try {
    const logoResponse = await fetch(VETLINK_LOGO_LIGHT, { cache: "no-cache" });
    if (logoResponse.ok) {
      const blob = await logoResponse.blob();
      const logoUrl = URL.createObjectURL(blob);
      const logoImg = await loadImage(logoUrl);
      URL.revokeObjectURL(logoUrl);
      if (logoImg) {
        doc.addImage(logoImg, "PNG", MARGIN, 22, 36, 14);
      }
    }
  } catch {
    /* optional logo */
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Skin Disease Detection Report", MARGIN + 44, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("VetLink Smart Pet Healthcare", MARGIN + 44, 58);

  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  const generated = new Date().toLocaleString();
  doc.text(`Generated: ${generated}`, MARGIN, 108);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN, 118, pageWidth - MARGIN, 118);

  y = 132;

  // Patient & scan meta
  drawSectionHeader("Patient & scan information");
  if (input.pet) {
    drawField("Patient name", input.pet.name);
    drawField("Breed", input.pet.breed || "—");
    drawField(
      "Age",
      input.pet.ageYears != null
        ? `${input.pet.ageYears} ${input.pet.ageYears === 1 ? "year" : "years"}`
        : "—",
    );
  } else {
    drawField("Patient", "Not linked to a pet profile");
  }
  drawField("Scan date & time", generated);

  // AI detection summary
  drawSectionHeader("AI detection summary");
  drawField(
    "Detected condition",
    input.diseaseDisplay,
    input.severityLabel?.toLowerCase() === "severe" ? [185, 28, 28] : ACCENT,
  );
  if (input.severityLabel) {
    const sev = input.severityLabel;
    drawField(
      "Severity",
      sev,
      sev.toLowerCase() === "severe" ? [185, 28, 28] : [180, 130, 10],
    );
  }
  drawField(
    "Confidence",
    `${(input.confidence * 100).toFixed(1)}%`,
    [22, 101, 52],
  );

  // XAI narrative
  if (input.xaiExplanation?.trim()) {
    drawSectionHeader("Clinical rationale (explainable AI)");
    drawWrapped(input.xaiExplanation.trim(), 13);
  }

  // --- Clinical figures (stacked for consistent PDF engines) ---
  const inferFormat = (url: string): "JPEG" | "PNG" =>
    url.includes("png") || url.includes("PNG") ? "PNG" : "JPEG";

  const figMaxW = Math.min(maxWidth - 16, 440);

  const addStackedFigure = (
    img: HTMLImageElement | null,
    caption: string,
    fmt: "JPEG" | "PNG",
  ) => {
    if (!img) return;
    const drawH = (img.height / img.width) * figMaxW;
    const captionGap = 12;
    const captionLineH = 14;
    const disclaimerLineH = 11;
    ensureSpace(drawH + captionGap + captionLineH + disclaimerLineH + 18);
    doc.addImage(img, fmt, MARGIN + 6, y, figMaxW, drawH);
    const captionY = y + drawH + captionGap;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND);
    doc.text(caption, MARGIN + 6, captionY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Image shown at reduced size for the PDF layout.",
      MARGIN + 6,
      captionY + disclaimerLineH,
    );
    y = captionY + disclaimerLineH + 12;
  };

  ensureSpace(56);
  drawSectionHeader("Clinical imaging & saliency");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  drawWrapped(
    "Below are the photograph provided for this scan and the model saliency overlay (when available), illustrating regions that most influenced the automated assessment.",
    12,
  );

  const clinicalImg = await loadImage(input.clinicalImageDataUrl);
  addStackedFigure(
    clinicalImg,
    "Figure 1 — Clinical photograph",
    inferFormat(input.clinicalImageDataUrl),
  );

  if (input.saliencyImageDataUrl) {
    const heatImg = await loadImage(input.saliencyImageDataUrl);
    addStackedFigure(
      heatImg,
      "Figure 2 — Saliency overlay (explainable AI)",
      inferFormat(input.saliencyImageDataUrl),
    );
  } else {
    ensureSpace(28);
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("No saliency image was available for this export.", MARGIN + 6, y);
    y += 20;
  }

  // Guidance sections
  const allGuidance = [
    ...input.guidanceSections,
    ...(input.healthySkinSection ? [input.healthySkinSection] : []),
  ];

  if (allGuidance.length > 0) {
    ensureSpace(48);
    drawSectionHeader("AI health assistant — educational guidance");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    drawWrapped(
      "The following text is general educational information for pet owners. It does not replace examination by a licensed veterinarian.",
      12,
    );

    allGuidance.forEach((sec) => {
      ensureSpace(36);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...ACCENT);
      doc.text(sec.title, MARGIN + 6, y);
      y += 14;
      drawWrapped(sec.body, 13);
    });
  }

  drawPageFrames(doc);
  drawFooters(doc);

  const fileName = `Skin_Disease_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
