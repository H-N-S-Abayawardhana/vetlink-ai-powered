import { jsPDF } from "jspdf";

type DietPlanPdfInput = {
  plan: any;
  pet: any;
};

function humanizeKey(key: string) {
  const normalized = String(key).toLowerCase().trim();
  const dayRange = normalized.match(/^day_(\d+)_(\d+)$/);
  if (dayRange) {
    return `Day ${dayRange[1]}-${dayRange[2]}`;
  }
  const dayPlus = normalized.match(/^day_(\d+)_plus$/);
  if (dayPlus) {
    return `Day ${dayPlus[1]}+`;
  }

  return String(key)
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

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

  const drawKeyValueObject = (title: string, obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    const entries = Object.entries(obj as Record<string, unknown>).filter(
      ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
    );
    if (entries.length === 0) return;
    drawSectionHeader(title);
    for (const [key, value] of entries) {
      drawField(humanizeKey(key), String(value));
    }
    y += 2;
  };

  const drawStringListSection = (title: string, items: unknown, marker = "-") => {
    if (!Array.isArray(items) || items.length === 0) return;
    const safeItems = items
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    if (safeItems.length === 0) return;
    drawSectionHeader(title);
    drawBulletList(safeItems, marker);
  };

  drawPageHeader(true);

  drawSectionHeader("Pet Overview");
  drawField("Name", pet?.name);
  drawField("Breed", pet?.breed);
  drawField("Age", pet?.ageYears !== undefined ? `${pet.ageYears} years` : "-");
  drawField("Weight", pet?.weightKg !== undefined ? `${pet.weightKg} kg` : "-");
  drawField("Body Condition Score", pet?.bcs ? `${pet.bcs}/9` : "-");
  y += 2;

  // 1. Plan Overview
  drawSectionHeader("Plan Overview");
  drawField("Diet Type", plan.kbDietType || plan.Diet_Type);
  drawField(
    "Meals Per Day",
    plan.meals_per_day || plan.Feeding_Guidelines?.Meals_Per_Day,
  );
  drawField("Hydration", plan.hydration);
  drawField("Energy", plan.energy_kcal);
  if (plan.breed_size_category) {
    drawField("Breed Size Category", plan.breed_size_category);
  }
  y += 2;

  // 2. Goal
  if (plan.life_stage_or_goal || plan.diet_goal) {
    drawSectionHeader("Goal");
    drawField("Life Stage / Goal", plan.life_stage_or_goal);
    drawField("Diet Goal", plan.diet_goal);
    y += 2;
  }

  // 3. Dietary Recommendations
  if (plan.dietary_recommendations) {
    drawSectionHeader("Dietary Recommendations");
    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    drawWrappedText(plan.dietary_recommendations, margin + 10, maxWidth - 16, 20);
    y += 2;
  }

  // 4. Nutrition Targets
  if (plan.nutrition_targets && typeof plan.nutrition_targets === "object") {
    const entries = Object.entries(plan.nutrition_targets).filter(
      ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
    );
    if (entries.length > 0) {
      drawSectionHeader("Nutrition Targets");
      for (const [key, value] of entries) {
        drawField(humanizeKey(key), String(value));
      }
      y += 2;
    }
  }

  // 5. Feeding Plan
  if (Array.isArray(plan.feeding_plan) && plan.feeding_plan.length > 0) {
    drawSectionHeader("Feeding Plan");
    const items = plan.feeding_plan
      .map((item: any) => {
        const name = item?.food_item ? String(item.food_item) : "-";
        const amount = item?.amount_g != null ? `${item.amount_g} g` : "-";
        const calories = item?.calories != null ? `${item.calories} kcal` : "-";
        return [name, amount, calories].filter(Boolean).join(" • ");
      })
      .filter(Boolean);
    if (items.length > 0) {
      drawBulletList(items, "-");
    }
    y += 2;
  }

  // 6. Food Options
  if (
    (Array.isArray(plan.commercial_food_options) && plan.commercial_food_options.length > 0) ||
    (Array.isArray(plan.homemade_food_options) && plan.homemade_food_options.length > 0)
  ) {
    drawSectionHeader("Food Options");
    if (Array.isArray(plan.commercial_food_options) && plan.commercial_food_options.length > 0) {
      drawSectionHeader("Commercial");
      drawBulletList(plan.commercial_food_options, "+");
    }
    if (Array.isArray(plan.homemade_food_options) && plan.homemade_food_options.length > 0) {
      drawSectionHeader("Homemade");
      drawBulletList(plan.homemade_food_options, "+");
    }
  }

  // 7. Micronutrient Profile
  if (
    plan.micronutrient_profile &&
    typeof plan.micronutrient_profile === "object" &&
    Object.keys(plan.micronutrient_profile).length > 0
  ) {
    drawSectionHeader("Micronutrient Profile");
    for (const [key, value] of Object.entries(plan.micronutrient_profile)) {
      if (value === null || value === undefined || String(value).trim() === "") continue;
      drawField(humanizeKey(key), String(value));
    }
    y += 2;
  }

  // 8. Breed Considerations
  drawStringListSection(
    "Breed Considerations",
    plan.breed_specific_considerations,
    "-",
  );

  // 9. Meal Timing
  if (plan.meal_timing_guidance) {
    drawSectionHeader("Meal Timing");
    drawField("Feeding Frequency", plan.meal_timing_guidance?.feeding_frequency);
    drawField("Meal Spacing", plan.meal_timing_guidance?.meal_spacing);
    drawField("Bloat Precaution", plan.meal_timing_guidance?.bloat_precaution);
  }

  // 10. Portion & Calorie Guidance
  if (plan.portion_and_calorie_guidance) {
    drawSectionHeader("Portion & Calorie Guidance");
    drawField("Portion Rule", plan.portion_and_calorie_guidance?.portion_rule);
    drawField("Review Interval", plan.portion_and_calorie_guidance?.review_interval);
    if (plan.portion_and_calorie_guidance?.calorie_adjustment) {
      const items = Object.entries(
        plan.portion_and_calorie_guidance.calorie_adjustment as Record<string, unknown>,
      )
        .map(([key, value]) => {
          if (value === null || value === undefined || String(value).trim() === "") return null;
          return `${humanizeKey(key)}: ${String(value)}`;
        })
        .filter(Boolean) as string[];
      if (items.length > 0) {
        drawSectionHeader("Calorie Adjustment");
        drawBulletList(items, "-");
      }
    }
  }

  // 11. Supplement Guidance
  drawKeyValueObject("Supplement Guidance", plan.supplement_guidance);

  // 12. Food Safety
  if (plan.food_safety) {
    drawSectionHeader("Food Safety");
    drawField("Treat Limit", plan.food_safety?.treat_limit);
    drawStringListSection("Avoid Toxic Foods", plan.food_safety?.avoid_toxic_foods, "-");
    drawStringListSection(
      "Preparation Rules",
      plan.food_safety?.preparation_rules,
      "-",
    );
  }

  // 13. Allergy & Sensitivity
  drawKeyValueObject("Allergy & Sensitivity", plan.allergy_and_sensitivity_rules);

  // 14. Transition Plan
  drawKeyValueObject("Transition Plan", plan.transition_plan);

  // 15. Monitoring
  if (plan.monitoring_metrics) {
    drawSectionHeader("Monitoring");
    drawField("Body Condition Score", plan.monitoring_metrics?.body_condition_score);
    drawField("Weight Tracking", plan.monitoring_metrics?.weight_tracking);
    drawField("Stool Score", plan.monitoring_metrics?.stool_score);
    drawStringListSection(
      "Clinical Flags",
      plan.monitoring_metrics?.clinical_flags,
      "-",
    );
  }

  // Glossary (for common abbreviations used in targets/guidance)
  drawSectionHeader("Glossary");
  drawBulletList(
    [
      "RER: Resting Energy Requirement (baseline calories needed at rest).",
      "MER: Maintenance Energy Requirement (estimated daily calories to maintain body weight).",
      "MER ~= 1.6 x RER means MER is estimated as 1.6 times RER (a common general multiplier; it may vary by age/activity/neuter status).",
      "DM: Dry Matter (nutrition values expressed with water removed, used to compare foods with different moisture levels).",
      "IU/kg DM: International Units per kilogram of dry matter.",
      "EPA + DHA: Omega-3 fatty acids (eicosapentaenoic acid + docosahexaenoic acid). ~0.1-0.2% DM means the combined EPA + DHA target is about 0.1-0.2% of the diet on a dry-matter basis.",
    ],
    "-",
  );

  // Legacy fields (if present) for backward compatibility
  if (plan.Nutrition_Profile) {
    drawSectionHeader("Legacy Nutrition Profile");
    drawField("Protein Level", plan.Nutrition_Profile.Protein_Level);
    drawField("Fat Level", plan.Nutrition_Profile.Fat_Level);
    drawField("Carbohydrate Level", plan.Nutrition_Profile.Carb_Level);
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
