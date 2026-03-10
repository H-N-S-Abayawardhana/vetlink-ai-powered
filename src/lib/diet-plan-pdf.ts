import { jsPDF } from "jspdf";

type DietPlanPdfInput = {
  plan: any;
  pet: any;
};

export function generateDietPlanPdf({ plan, pet }: DietPlanPdfInput) {
  if (!plan) {
    throw new Error("No plan provided for PDF generation");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentTop = 136;
  const contentBottom = pageHeight - 56;
  const maxWidth = pageWidth - 2 * margin;
  const brandColor: [number, number, number] = [30, 64, 175];
  const accentColor: [number, number, number] = [59, 130, 246];
  const mutedText: [number, number, number] = [75, 85, 99];
  let y = contentTop;

  const ensureSpace = (requiredSpace = 24) => {
    if (y + requiredSpace <= contentBottom) return;
    doc.addPage();
    drawPageHeader(false);
    y = contentTop;
  };

  const drawWrappedText = (
    text: string,
    x: number,
    width: number,
    lineHeight = 20,
  ) => {
    const lines = doc.splitTextToSize(text || "-", width);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight + 4);
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  const drawPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      doc.setFillColor(...brandColor);
      doc.rect(0, 0, pageWidth, 88, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Pet Diet Plan Report", margin, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("VetLink Smart Pet Healthcare", margin, 58);
    }

    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date(plan.generatedAt || Date.now()).toLocaleString()}`,
      margin,
      isFirstPage ? 104 : 96,
    );

    doc.setDrawColor(...accentColor);
    doc.setLineWidth(1);
    doc.line(
      margin,
      isFirstPage ? 116 : 108,
      pageWidth - margin,
      isFirstPage ? 116 : 108,
    );
  };

  const drawSectionHeader = (title: string) => {
    y += 10;
    ensureSpace(48);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y - 16, maxWidth, 28, 4, 4, "F");
    doc.setTextColor(...brandColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.text(title, margin + 12, y + 3);
    y += 24;
  };

  const drawField = (
    label: string,
    value: string | number | null | undefined,
  ) => {
    const displayValue =
      value === null || value === undefined || value === ""
        ? "-"
        : String(value);
    const valueLines = doc.splitTextToSize(displayValue, maxWidth - 150);
    const rowHeight = Math.max(16, valueLines.length * 19);
    ensureSpace(rowHeight + 10);

    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${label}:`, margin + 10, y + 3);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedText);
    doc.setFontSize(11);
    valueLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 150, y + 3 + index * 19);
    });

    y += rowHeight + 6;
  };

  const drawBulletList = (items: string[], marker = "-") => {
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, maxWidth - 36);
      const rowHeight = Math.max(16, lines.length * 19);
      ensureSpace(rowHeight + 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedText);
      doc.setFontSize(11);
      doc.text(marker, margin + 10, y);
      lines.forEach((line: string, index: number) => {
        doc.text(line, margin + 26, y + index * 19);
      });
      y += rowHeight + 4;
    });
    y += 6;
  };

  drawPageHeader(true);

  drawSectionHeader("Pet Overview");
  drawField("Name", pet?.name);
  drawField("Breed", pet?.breed);
  drawField("Age", pet?.ageYears !== undefined ? `${pet.ageYears} years` : "-");
  drawField("Weight", pet?.weightKg !== undefined ? `${pet.weightKg} kg` : "-");
  drawField("Body Condition Score", pet?.bcs ? `${pet.bcs}/9` : "-");
  y += 2;

  drawSectionHeader("Plan Summary");
  drawField("Diet Type", plan.Diet_Type);
  drawField("Meals Per Day", plan.Feeding_Guidelines?.Meals_Per_Day);
  drawField("Treat Allowance", plan.Feeding_Guidelines?.Treat_Allowance);
  y += 2;

  if (plan.Nutrition_Profile) {
    drawSectionHeader("Nutrition Profile");
    drawField("Protein Level", plan.Nutrition_Profile.Protein_Level);
    drawField("Fat Level", plan.Nutrition_Profile.Fat_Level);
    drawField("Carbohydrate Level", plan.Nutrition_Profile.Carb_Level);
  }

  if (plan.Feeding_Guidelines?.Portion_Control_Advice) {
    drawSectionHeader("Feeding Guidelines");
    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    drawWrappedText(
      plan.Feeding_Guidelines.Portion_Control_Advice,
      margin + 10,
      maxWidth - 16,
      20,
    );
    y += 2;
  }

  if (
    Array.isArray(plan.Recommended_Foods) &&
    plan.Recommended_Foods.length > 0
  ) {
    drawSectionHeader("Recommended Foods");
    drawBulletList(plan.Recommended_Foods, "+");
  }

  if (Array.isArray(plan.Foods_to_Avoid) && plan.Foods_to_Avoid.length > 0) {
    drawSectionHeader("Foods to Avoid");
    drawBulletList(plan.Foods_to_Avoid, "x");
  }

  if (plan.Exercise_Recommendation) {
    drawSectionHeader("Exercise Recommendation");
    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    drawWrappedText(
      plan.Exercise_Recommendation,
      margin + 10,
      maxWidth - 16,
      20,
    );
    y += 2;
  }

  if (plan.Notes) {
    drawSectionHeader("Important Notes");
    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    drawWrappedText(plan.Notes, margin + 10, maxWidth - 16, 20);
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);
    doc.text("VetLink Smart Pet Healthcare", margin, pageHeight - 26);
    doc.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 26,
      {
        align: "right",
      },
    );
  }

  const filename = `${(pet?.name || "pet").replace(/\s+/g, "_")}_DietPlan_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
