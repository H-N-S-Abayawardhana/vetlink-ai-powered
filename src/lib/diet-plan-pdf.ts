import { jsPDF } from "jspdf";

type DietPlanPdfInput = {
  plan: any;
  pet: any;
};

type RGB = [number, number, number];

const COLORS = {
  brand: [30, 64, 175] as RGB,
  brandDark: [29, 78, 216] as RGB,
  accent: [59, 130, 246] as RGB,
  text: [31, 41, 55] as RGB,
  muted: [75, 85, 99] as RGB,
  lightText: [107, 114, 128] as RGB,
  border: [229, 231, 235] as RGB,
  softBlue: [239, 246, 255] as RGB,
  softGray: [249, 250, 251] as RGB,
  softAmber: [255, 251, 235] as RGB,
  amberBorder: [253, 230, 138] as RGB,
  greenBorder: [187, 247, 208] as RGB,
  purpleBorder: [221, 214, 254] as RGB,
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

function isPresent(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function safeText(value: unknown) {
  if (!isPresent(value)) return "-";

  return String(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")

    // Normalize common Unicode symbols for jsPDF's default Helvetica font
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/≈/g, "~")
    .replace(/×/g, "x")
    .replace(/÷/g, "/")
    .replace(/±/g, "+/-")

    // Fix already-broken symbol patterns that may appear from copied/encoded text
    .replace(/"e/g, ">=")
    .replace(/"d/g, "<=")
    .replace(/"H/g, "~ ")

    // Clean extra spacing after replacements
    .replace(/\s+/g, " ")
    .trim();
}

function safeFilenamePart(value: unknown) {
  return safeText(value)
    .replace(/[^a-z0-9_-]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function formatDate(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString();
  return date.toLocaleString();
}

function getGlossaryItems(plan: any) {
  const source = safeText(JSON.stringify(plan || {}));
  const items: Array<{ term: string; meaning: string }> = [];

  if (/\bRER\b/.test(source)) {
    items.push({
      term: "RER",
      meaning:
        "Resting Energy Requirement - estimated calories needed for basic body functions at rest.",
    });
  }

  if (/\bMER\b/.test(source)) {
    items.push({
      term: "MER",
      meaning:
        "Maintenance Energy Requirement - estimated total daily calories including normal activity.",
    });
  }

  if (/\bBW\b/.test(source) || /body weight/i.test(source)) {
    items.push({
      term: "BW",
      meaning: "Body Weight, usually measured in kilograms for this plan.",
    });
  }

  if (/\bDM\b/.test(source)) {
    items.push({
      term: "DM",
      meaning:
        "Dry Matter - nutrient values expressed after removing water content.",
    });
  }

  if (/IU\s*\/\s*kg/i.test(source)) {
    items.push({
      term: "IU/kg",
      meaning:
        "International Units per kilogram, commonly used for vitamin measurements.",
    });
  }

  if (/kcal/i.test(source)) {
    items.push({
      term: "kcal",
      meaning: "Kilocalories, the unit commonly used for food energy.",
    });
  }

  if (/g\s*\/\s*kg/i.test(source)) {
    items.push({
      term: "g/kg",
      meaning: "Grams per kilogram of body weight.",
    });
  }

  if (/ad\s*lib/i.test(source)) {
    items.push({
      term: "ad lib",
      meaning:
        "Ad libitum - freely available, such as water available at all times.",
    });
  }

  if (/EPA\s*\+?\s*DHA/i.test(source)) {
    items.push({
      term: "EPA + DHA",
      meaning:
        "Omega-3 fatty acids that support skin, coat, joints, and inflammation control.",
    });
  }

  const unique = new Map<string, string>();
  items.forEach((item) => unique.set(item.term, item.meaning));

  return Array.from(unique.entries()).map(([term, meaning]) => ({
    term,
    meaning,
  }));
}

export function generateDietPlanPdf({ plan, pet }: DietPlanPdfInput) {
  if (!plan) {
    throw new Error("No plan provided for PDF generation");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 42;
  const headerHeight = 92;
  const footerHeight = 46;
  const contentTopFirstPage = 128;
  const contentTopOtherPages = 92;
  const contentBottom = pageHeight - footerHeight;
  const maxWidth = pageWidth - margin * 2;

  let y = contentTopFirstPage;

  const setTextColor = (color: RGB) => doc.setTextColor(...color);
  const setFillColor = (color: RGB) => doc.setFillColor(...color);
  const setDrawColor = (color: RGB) => doc.setDrawColor(...color);

  const drawPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      setFillColor(COLORS.brand);
      doc.rect(0, 0, pageWidth, headerHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      setTextColor([255, 255, 255]);
      doc.text("Pet Diet Plan Report", margin, 38);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("VetLink Smart Pet Healthcare", margin, 58);

      doc.setFontSize(10);
      doc.text(
        `Generated: ${formatDate(plan.generatedAt || Date.now())}`,
        margin,
        76,
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      setTextColor(COLORS.brand);
      doc.text("Pet Diet Plan Report", margin, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setTextColor(COLORS.lightText);
      doc.text(
        `Generated: ${formatDate(plan.generatedAt || Date.now())}`,
        margin,
        58,
      );
    }

    setDrawColor(COLORS.accent);
    doc.setLineWidth(1);
    doc.line(
      margin,
      isFirstPage ? 108 : 70,
      pageWidth - margin,
      isFirstPage ? 108 : 70,
    );
  };

  const addNewPage = () => {
    doc.addPage();
    drawPageHeader(false);
    y = contentTopOtherPages;
  };

  const ensureSpace = (requiredSpace = 28) => {
    if (y + requiredSpace <= contentBottom) return;
    addNewPage();
  };

  const split = (text: unknown, width: number) => {
    return doc.splitTextToSize(safeText(text), Math.max(width, 40)) as string[];
  };

  const labelToUpper = (label: string) => {
    return safeText(label).toUpperCase();
  };

  const drawSectionHeader = (title: string) => {
    ensureSpace(48);

    if (y > contentTopOtherPages + 5) {
      y += 10;
    }

    setFillColor(COLORS.softBlue);
    setDrawColor([219, 234, 254]);
    doc.roundedRect(margin, y, maxWidth, 30, 5, 5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    setTextColor(COLORS.brand);
    doc.text(title, margin + 12, y + 20);

    y += 44;
  };

  const drawParagraph = (text: unknown, options?: { indent?: number }) => {
    const indent = options?.indent ?? 0;
    const x = margin + indent;
    const width = maxWidth - indent;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setTextColor(COLORS.muted);

    const lines = split(text, width);

    lines.forEach((line) => {
      ensureSpace(18);
      doc.text(line, x, y);
      y += 17;
    });

    y += 4;
  };

  const drawField = (
    label: string,
    value: unknown,
    options?: {
      labelWidth?: number;
      background?: RGB;
      border?: RGB;
    },
  ) => {
    if (!isPresent(value)) return;

    const labelWidth = options?.labelWidth ?? 150;
    const rowPaddingX = 10;
    const rowPaddingY = 8;
    const x = margin;
    const valueX = margin + labelWidth;
    const valueWidth = maxWidth - labelWidth - rowPaddingX;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const valueLines = split(value, valueWidth);
    const rowHeight = Math.max(34, valueLines.length * 15 + rowPaddingY * 2);

    ensureSpace(rowHeight + 6);

    setFillColor(options?.background ?? COLORS.softGray);
    setDrawColor(options?.border ?? COLORS.border);
    doc.roundedRect(x, y, maxWidth, rowHeight, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(COLORS.text);
    doc.text(`${label}:`, x + rowPaddingX, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(COLORS.muted);

    valueLines.forEach((line, index) => {
      doc.text(line, valueX, y + 20 + index * 15);
    });

    y += rowHeight + 6;
  };

  const drawTwoColumnFields = (
    fields: Array<{
      label: string;
      value: unknown;
      background?: RGB;
      border?: RGB;
    }>,
  ) => {
    const visibleFields = fields.filter((field) => isPresent(field.value));
    if (visibleFields.length === 0) return;

    const gap = 10;
    const cardWidth = (maxWidth - gap) / 2;

    visibleFields.forEach((field, index) => {
      const col = index % 2;
      const x = margin + col * (cardWidth + gap);

      const valueLines = split(field.value, cardWidth - 20);
      const height = Math.max(54, valueLines.length * 14 + 34);

      if (col === 0) {
        ensureSpace(height + 8);
      }

      setFillColor(field.background ?? COLORS.softGray);
      setDrawColor(field.border ?? COLORS.border);
      doc.roundedRect(x, y, cardWidth, height, 5, 5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setTextColor(COLORS.lightText);
      doc.text(labelToUpper(field.label), x + 10, y + 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      setTextColor(COLORS.text);

      valueLines.forEach((line, lineIndex) => {
        doc.text(line, x + 10, y + 35 + lineIndex * 14);
      });

      if (col === 1 || index === visibleFields.length - 1) {
        y += height + 8;
      }
    });
  };

  const drawBulletList = (items: unknown, marker = "-") => {
    if (!Array.isArray(items)) return;

    const cleanItems = items
      .map((item) => safeText(item))
      .filter((item) => item !== "-");

    if (cleanItems.length === 0) return;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setTextColor(COLORS.muted);

    cleanItems.forEach((item) => {
      const lines = split(item, maxWidth - 28);
      const blockHeight = Math.max(18, lines.length * 15);

      ensureSpace(blockHeight + 8);

      doc.setFont("helvetica", "bold");
      setTextColor(COLORS.brand);
      doc.text(marker, margin + 6, y);

      doc.setFont("helvetica", "normal");
      setTextColor(COLORS.muted);

      lines.forEach((line, index) => {
        doc.text(line, margin + 22, y + index * 15);
      });

      y += blockHeight + 5;
    });

    y += 4;
  };

  const drawKeyValueObject = (title: string, obj: unknown) => {
    if (!obj || typeof obj !== "object") return;

    const entries = Object.entries(obj as Record<string, unknown>).filter(
      ([, value]) => isPresent(value),
    );

    if (entries.length === 0) return;

    drawSectionHeader(title);

    entries.forEach(([key, value]) => {
      drawField(humanizeKey(key), value);
    });

    y += 2;
  };

  const drawStringListSection = (title: string, items: unknown, marker = "-") => {
    if (!Array.isArray(items) || items.length === 0) return;

    const safeItems = items
      .map((item) => safeText(item))
      .filter((item) => item !== "-");

    if (safeItems.length === 0) return;

    drawSectionHeader(title);
    drawBulletList(safeItems, marker);
  };

  const drawMiniHeading = (title: string) => {
    ensureSpace(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setTextColor(COLORS.brand);
    doc.text(title, margin, y);

    y += 18;
  };

  const drawSimpleTable = (
    headers: string[],
    rows: string[][],
    columnWidths: number[],
  ) => {
    if (rows.length === 0) return;

    const tableX = margin;
    const rowPadding = 8;
    const headerHeight = 30;

    ensureSpace(headerHeight + 20);

    setFillColor(COLORS.softBlue);
    setDrawColor([219, 234, 254]);
    doc.roundedRect(tableX, y, maxWidth, headerHeight, 4, 4, "FD");

    let currentX = tableX;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTextColor(COLORS.brand);

    headers.forEach((header, index) => {
      doc.text(header, currentX + rowPadding, y + 19);
      currentX += columnWidths[index];
    });

    y += headerHeight;

    rows.forEach((row) => {
      const cellLines = row.map((cell, index) => {
        return split(cell, columnWidths[index] - rowPadding * 2);
      });

      const maxLines = Math.max(...cellLines.map((lines) => lines.length));
      const rowHeight = Math.max(42, maxLines * 15 + rowPadding * 2);

      ensureSpace(rowHeight + 2);

      setFillColor(COLORS.softGray);
      setDrawColor(COLORS.border);
      doc.rect(tableX, y, maxWidth, rowHeight, "FD");

      currentX = tableX;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setTextColor(COLORS.text);

      cellLines.forEach((lines, cellIndex) => {
        lines.forEach((line, lineIndex) => {
          doc.text(line, currentX + rowPadding, y + 19 + lineIndex * 14);
        });

        currentX += columnWidths[cellIndex];
      });

      y += rowHeight;
    });

    y += 8;
  };

  const drawGlossary = () => {
    const glossary = getGlossaryItems(plan);
    if (glossary.length === 0) return;

    drawSectionHeader("Helpful Terms");

    glossary.forEach((item) => {
      drawField(item.term, item.meaning);
    });
  };

  drawPageHeader(true);

  drawSectionHeader("Pet Overview");
  drawTwoColumnFields([
    {
      label: "Name",
      value: pet?.name,
      background: COLORS.softBlue,
      border: [219, 234, 254],
    },
    {
      label: "Breed",
      value: pet?.breed,
    },
    {
      label: "Age",
      value:
        pet?.ageYears !== undefined && pet?.ageYears !== null
          ? `${pet.ageYears} years`
          : "-",
    },
    {
      label: "Weight",
      value:
        pet?.weightKg !== undefined && pet?.weightKg !== null
          ? `${pet.weightKg} kg`
          : "-",
    },
    {
      label: "Body Condition Score",
      value: pet?.bcs ? `${pet.bcs}/9` : "-",
      background: [250, 245, 255],
      border: COLORS.purpleBorder,
    },
    {
      label: "Activity Level",
      value: pet?.activityLevel || pet?.activity_level,
    },
  ]);

  drawSectionHeader("Plan Overview");
  drawTwoColumnFields([
    {
      label: "Diet Type",
      value: plan.kbDietType || plan.Diet_Type,
      background: COLORS.softBlue,
      border: [219, 234, 254],
    },
    {
      label: "Meals Per Day",
      value: plan.meals_per_day || plan.Feeding_Guidelines?.Meals_Per_Day,
    },
    {
      label: "Energy",
      value: plan.energy_kcal,
      background: COLORS.softAmber,
      border: COLORS.amberBorder,
    },
    {
      label: "Hydration",
      value: plan.hydration,
      background: [240, 253, 244],
      border: COLORS.greenBorder,
    },
    {
      label: "Breed Size",
      value: plan.breed_size_category,
    },
    {
      label: "Weight Used",
      value:
        plan.reference_body_weight_kg !== null &&
        plan.reference_body_weight_kg !== undefined
          ? `${plan.reference_body_weight_kg} kg`
          : undefined,
    },
    {
      label: "Total / Day",
      value:
        plan.total_daily_amount_g !== null &&
        plan.total_daily_amount_g !== undefined
          ? `${plan.total_daily_amount_g} g`
          : undefined,
    },
    {
      label: "Total / Day (g/kg)",
      value: plan.total_daily_amount_g_per_kg_body_weight,
    },
  ]);

  if (plan.life_stage_or_goal || plan.diet_goal) {
    drawSectionHeader("Goal");
    drawTwoColumnFields([
      {
        label: "Life Stage / Goal",
        value: plan.life_stage_or_goal,
      },
      {
        label: "Diet Goal",
        value: plan.diet_goal,
      },
    ]);
  }

  if (plan.dietary_recommendations) {
    drawSectionHeader("Dietary Recommendations");
    drawParagraph(plan.dietary_recommendations, { indent: 4 });
  }

  if (plan.nutrition_targets && typeof plan.nutrition_targets === "object") {
    const entries = Object.entries(plan.nutrition_targets).filter(([, value]) =>
      isPresent(value),
    );

    if (entries.length > 0) {
      drawSectionHeader("Nutrition Targets");

      entries.forEach(([key, value]) => {
        drawField(humanizeKey(key), value);
      });
    }
  }

  if (Array.isArray(plan.feeding_plan) && plan.feeding_plan.length > 0) {
    drawSectionHeader("Feeding Plan");

    const rows = plan.feeding_plan.map((item: any) => [
      safeText(item?.food_item),
      safeText(item?.role),
      item?.amount_g !== null && item?.amount_g !== undefined
        ? `${item.amount_g} g`
        : "-",
      item?.amount_g_per_kg_body_weight !== null &&
      item?.amount_g_per_kg_body_weight !== undefined
        ? `${item.amount_g_per_kg_body_weight}`
        : "-",
      item?.calories !== null && item?.calories !== undefined
        ? `${item.calories} kcal`
        : "-",
    ]);

    drawSimpleTable(
      ["Food", "Role", "Amount", "g/kg BW", "Calories"],
      rows,
      [150, 115, 82, 82, maxWidth - 150 - 115 - 82 - 82],
    );
  }

  if (
    (Array.isArray(plan.commercial_food_options) &&
      plan.commercial_food_options.length > 0) ||
    (Array.isArray(plan.homemade_food_options) &&
      plan.homemade_food_options.length > 0)
  ) {
    drawSectionHeader("Food Options");

    if (
      Array.isArray(plan.commercial_food_options) &&
      plan.commercial_food_options.length > 0
    ) {
      drawMiniHeading("Commercial Options");
      drawBulletList(plan.commercial_food_options, "+");
    }

    if (
      Array.isArray(plan.homemade_food_options) &&
      plan.homemade_food_options.length > 0
    ) {
      drawMiniHeading("Homemade Options");
      drawBulletList(plan.homemade_food_options, "+");
    }
  }

  if (
    plan.micronutrient_profile &&
    typeof plan.micronutrient_profile === "object"
  ) {
    const entries = Object.entries(plan.micronutrient_profile).filter(
      ([, value]) => isPresent(value),
    );

    if (entries.length > 0) {
      drawSectionHeader("Micronutrient Profile");

      entries.forEach(([key, value]) => {
        drawField(humanizeKey(key), value, {
          background: [250, 245, 255],
          border: COLORS.purpleBorder,
        });
      });
    }
  }

  drawStringListSection(
    "Breed Considerations",
    plan.breed_specific_considerations,
    "-",
  );

  if (plan.meal_timing_guidance) {
    drawSectionHeader("Meal Timing");

    drawTwoColumnFields([
      {
        label: "Feeding Frequency",
        value: plan.meal_timing_guidance?.feeding_frequency,
      },
      {
        label: "Meal Spacing",
        value: plan.meal_timing_guidance?.meal_spacing,
      },
      {
        label: "Bloat Precaution",
        value: plan.meal_timing_guidance?.bloat_precaution,
        background: COLORS.softAmber,
        border: COLORS.amberBorder,
      },
    ]);
  }

  if (plan.portion_and_calorie_guidance) {
    drawSectionHeader("Portion & Calorie Guidance");

    drawTwoColumnFields([
      {
        label: "Portion Rule",
        value: plan.portion_and_calorie_guidance?.portion_rule,
        background: COLORS.softBlue,
        border: [219, 234, 254],
      },
      {
        label: "Review Interval",
        value: plan.portion_and_calorie_guidance?.review_interval,
      },
    ]);
  }

  drawKeyValueObject("Supplement Guidance", plan.supplement_guidance);

  if (plan.food_safety) {
    drawSectionHeader("Food Safety");

    if (plan.food_safety?.treat_limit) {
      drawField("Treat Limit", plan.food_safety.treat_limit, {
        background: COLORS.softAmber,
        border: COLORS.amberBorder,
      });
    }

    if (
      Array.isArray(plan.food_safety?.avoid_toxic_foods) &&
      plan.food_safety.avoid_toxic_foods.length > 0
    ) {
      drawMiniHeading("Avoid Toxic Foods");
      drawBulletList(plan.food_safety.avoid_toxic_foods, "-");
    }

    if (
      Array.isArray(plan.food_safety?.preparation_rules) &&
      plan.food_safety.preparation_rules.length > 0
    ) {
      drawMiniHeading("Preparation Rules");
      drawBulletList(plan.food_safety.preparation_rules, "-");
    }
  }

  drawKeyValueObject(
    "Allergy & Sensitivity",
    plan.allergy_and_sensitivity_rules,
  );

  drawKeyValueObject("Transition Plan", plan.transition_plan);

  if (plan.monitoring_metrics) {
    drawSectionHeader("Monitoring");

    drawTwoColumnFields([
      {
        label: "Body Condition Score",
        value: plan.monitoring_metrics?.body_condition_score,
      },
      {
        label: "Weight Tracking",
        value: plan.monitoring_metrics?.weight_tracking,
      },
      {
        label: "Stool Score",
        value: plan.monitoring_metrics?.stool_score,
      },
    ]);

    if (
      Array.isArray(plan.monitoring_metrics?.clinical_flags) &&
      plan.monitoring_metrics.clinical_flags.length > 0
    ) {
      drawMiniHeading("Clinical Flags");
      drawBulletList(plan.monitoring_metrics.clinical_flags, "-");
    }
  }

  drawStringListSection(
    "Veterinary Review Recommended",
    plan.veterinary_review_required_for,
    "-",
  );

  if (plan.Nutrition_Profile) {
    drawSectionHeader("Legacy Nutrition Profile");

    drawTwoColumnFields([
      {
        label: "Protein Level",
        value: plan.Nutrition_Profile.Protein_Level,
      },
      {
        label: "Fat Level",
        value: plan.Nutrition_Profile.Fat_Level,
      },
      {
        label: "Carbohydrate Level",
        value: plan.Nutrition_Profile.Carb_Level,
      },
    ]);
  }

  drawGlossary();

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    setDrawColor(COLORS.border);
    doc.setLineWidth(0.8);
    doc.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTextColor(COLORS.lightText);

    doc.text("VetLink Smart Pet Healthcare", margin, pageHeight - 22);

    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 22, {
      align: "right",
    });
  }

  const petName = safeFilenamePart(pet?.name || plan.petName || "pet");

  const filename = `${petName}_DietPlan_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  doc.save(filename);
}