/**
 * Rule-based XAI: builds a reason-based explanation from model outputs only.
 * No LLM — uses confidence and per-class probabilities to explain why this
 * disease and severity were predicted.
 */

export interface XAIInput {
  disease: string;
  severity: string | null;
  confidence: number;
  all_probabilities?: Record<string, number> | null;
  pet?: { name?: string; breed?: string; ageYears?: number } | null;
}

function formatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\//g, " / ");
}

/**
 * Build a short paragraph that explains why the model predicted this disease and severity.
 * Uses only the provided numbers; no hallucination, no external API.
 */
export function buildSkinDiseaseXAIExplanation(input: XAIInput): string {
  const { disease, severity, confidence, all_probabilities, pet } = input;

  const diseaseDisplay = formatLabel(disease);
  const confidencePct =
    typeof confidence === "number" ? (confidence * 100).toFixed(1) : "unknown";

  const parts: string[] = [];

  // 1. What was predicted (disease + severity)
  if (diseaseDisplay.toLowerCase() === "healthy") {
    parts.push(
      `The model classified this image as healthy skin with ${confidencePct}% confidence.`,
    );
  } else {
    const severityPhrase = severity ? ` at ${severity} severity` : "";
    parts.push(
      `The model predicted ${diseaseDisplay}${severityPhrase} with ${confidencePct}% confidence.`,
    );
  }

  // 2. Why: confidence interpretation
  if (typeof confidence === "number") {
    if (confidence >= 0.9) {
      parts.push(
        "The confidence is high, meaning the image features matched this condition clearly.",
      );
    } else if (confidence >= 0.7) {
      parts.push(
        "The confidence is moderate to high, so the image showed signs that fit this condition well.",
      );
    } else if (confidence >= 0.5) {
      parts.push(
        "The confidence is moderate; the image had some features consistent with this condition, but there was more uncertainty.",
      );
    } else {
      parts.push(
        "The confidence is relatively low; consider a follow-up check or a clearer image if possible.",
      );
    }
  }

  // 3. How it compared to other options (from all_probabilities)
  if (
    all_probabilities &&
    typeof all_probabilities === "object" &&
    Object.keys(all_probabilities).length > 1
  ) {
    const sorted = Object.entries(all_probabilities)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .filter(([label]) => label !== disease)
      .slice(0, 3);

    if (sorted.length > 0) {
      const nextOptions = sorted
        .map(
          ([label, p]) =>
            `${formatLabel(label)} (${((p as number) * 100).toFixed(1)}%)`,
        )
        .join(", ");
      parts.push(
        `Other possibilities the model considered were: ${nextOptions}. The predicted condition had the highest score, which is why it was chosen.`,
      );
    }
  }

  // 4. Optional pet context (one line, no medical claims)
  if (pet && (pet.name || pet.breed || pet.ageYears != null)) {
    const petParts: string[] = [];
    if (pet.name) petParts.push(pet.name);
    if (pet.breed) petParts.push(pet.breed);
    if (pet.ageYears != null)
      petParts.push(
        `${pet.ageYears} ${pet.ageYears === 1 ? "year" : "years"} old`,
      );
    parts.push(
      `This result is for ${petParts.join(", ")}. Always discuss any skin concerns with your veterinarian.`,
    );
  } else {
    parts.push(
      "This is for informational use only; please consult a veterinarian for diagnosis and treatment.",
    );
  }

  // Join and clean bold markers if we want plain text (UI can render ** as bold)
  return parts.join(" ");
}
