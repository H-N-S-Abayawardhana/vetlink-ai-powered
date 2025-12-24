// Diet utilities and recommendation engine for dogs
// Supports BCS-based categories, RER calculation and plan generation

export type ActivityLevel = "couch_potato" | "normal" | "active" | "working";
export type LifeStage = "puppy" | "adult" | "senior";

export interface DietPlanInput {
  id?: string | number;
  name: string;
  breed?: string | null;
  weightKg: number;
  ageYears?: number | null;
  bcs?: number | null; // 1-9
  activityLevel?: ActivityLevel | null;
  lifeStage?: LifeStage | null;
}

export interface DietPlan {
  petId?: string | number;
  generatedAt: string;
  petName: string;
  breed?: string | null;
  weightKg: number;
  ageYears?: number | null;
  bcs?: number | null;
  bcsCategory?: string;
  rerKcal: number;
  dailyCalories: number;
  feedingFrequency: number;
  portions: {
    cupsPerMeal?: number;
    gramsPerMeal?: number;
    kcalPerMeal?: number;
  };
  recommendedFoodTypes: string[];
  foodsToAvoid: string[];
  treatAllowanceKcal: number;
  exerciseMinutesPerDay: number;
  proteinGuidance: string;
  fatGuidance: string;
  waterMlPerDay: number;
  notes: string[];
}

export const TOXIC_FOODS = [
  "chocolate",
  "grapes",
  "raisins",
  "onions",
  "garlic",
  "xylitol",
  "avocado",
  "macadamia nuts",
  "alcohol",
  "caffeine",
];

export function calculateRER(weightKg: number) {
  // RER = 70 * (body weight in kg)^0.75
  return 70 * Math.pow(weightKg, 0.75);
}

export function activityMultiplier(level: ActivityLevel | undefined | null) {
  switch (level) {
    case "couch_potato":
      return 1.2;
    case "normal":
      return 1.6;
    case "active":
      return 2.0;
    case "working":
      return 3.0;
    default:
      return 1.6;
  }
}

export function bcsCategoryFromScore(score: number | null | undefined) {
  if (score == null) return null;
  if (score <= 3) return "Underweight";
  if (score <= 5) return "Ideal";
  if (score <= 7) return "Overweight";
  return "Obese";
}

export function estimateLifeStage(ageYears?: number | null): LifeStage {
  if (ageYears == null) return "adult";
  if (ageYears < 1) return "puppy";
  if (ageYears >= 7) return "senior";
  return "adult";
}

export function generateDietPlan(input: DietPlanInput): DietPlan {
  const now = new Date().toISOString();
  const lifeStage = input.lifeStage || estimateLifeStage(input.ageYears);
  const bcsCategory = bcsCategoryFromScore(input.bcs) || "Unknown";

  const rer = Math.round(calculateRER(input.weightKg));
  const multiplier = activityMultiplier(input.activityLevel);
  let dailyCalories = Math.round(rer * multiplier);

  const notes: string[] = [];

  // Adjust by BCS
  if (input.bcs == null) {
    notes.push(
      "BCS missing — use the BCS Calculator to assess body condition.",
    );
  } else if (input.bcs <= 3) {
    // underweight - increase calories
    dailyCalories = Math.round(dailyCalories * 1.2);
    notes.push(
      "Underweight: high-calorie, nutrient-dense diet; more frequent feeding; focus on protein.",
    );
  } else if (input.bcs <= 5) {
    // ideal
    notes.push("Maintain current energy intake and regular exercise.");
  } else if (input.bcs <= 7) {
    // overweight
    dailyCalories = Math.round(dailyCalories * 0.85);
    notes.push(
      "Overweight: controlled calories, reduced fat, increased fiber, increased activity.",
    );
  } else {
    // obese
    dailyCalories = Math.round(dailyCalories * 0.75);
    notes.push(
      "Obese: strict calorie-deficit plan with high-fiber weight-management foods.",
    );
  }

  // Life stage adjustments
  let proteinGuidance = "18-25% (adult)";
  let fatGuidance = "10-15% (adult)";
  if (lifeStage === "puppy") {
    dailyCalories = Math.round(dailyCalories * 1.25);
    proteinGuidance = "22-32% (puppy growth)";
    fatGuidance = "12-20% (puppy)";
    notes.push("Puppy: growth-focused nutrition with higher protein and fat.");
  } else if (lifeStage === "senior") {
    dailyCalories = Math.round(dailyCalories * 0.95);
    notes.push(
      "Senior: consider lower calorie intake and joint-support nutrients.",
    );
  }

  // Feeding frequency
  const feedingFrequency = lifeStage === "puppy" ? 3 : 2;

  // Portion estimation: assume ~350 kcal per cup dry equivalent and ~100 g per cup
  const kcalPerCup = 350;
  const gramsPerCup = 100;
  const cupsPerDay = Math.max(
    0.1,
    Math.round((dailyCalories / kcalPerCup) * 10) / 10,
  );
  const cupsPerMeal = Math.round((cupsPerDay / feedingFrequency) * 10) / 10;
  const gramsPerMeal = Math.round(cupsPerMeal * gramsPerCup);

  // Treat allowance - 10% of daily calories
  const treatAllowanceKcal = Math.round(dailyCalories * 0.1);

  // Exercise guidance
  let exerciseMinutes = 30;
  switch (input.activityLevel) {
    case "couch_potato":
      exerciseMinutes = 20;
      break;
    case "normal":
      exerciseMinutes = 30;
      break;
    case "active":
      exerciseMinutes = 60;
      break;
    case "working":
      exerciseMinutes = 90;
      break;
    default:
      exerciseMinutes = 30;
      break;
  }

  // Water: ~1 oz per lb -> convert to ml
  const waterMl = Math.round((input.weightKg / 0.45359237) * 29.5735);

  // Suggested food types
  const recommendedFoodTypes: string[] = [];
  if (input.bcs != null && input.bcs <= 3)
    recommendedFoodTypes.push(
      "High-calorie, nutrient-dense (growth/puppy style)",
    );
  if (input.bcs != null && input.bcs >= 6)
    recommendedFoodTypes.push("High-fiber weight management diet");
  recommendedFoodTypes.push(
    "Dry kibble (measure by cup)",
    "Wet food (as supplement)",
    "Combination feeding",
  );

  const plan: DietPlan = {
    petId: input.id,
    generatedAt: now,
    petName: input.name,
    breed: input.breed || null,
    weightKg: input.weightKg,
    ageYears: input.ageYears ?? null,
    bcs: input.bcs ?? null,
    bcsCategory: bcsCategoryFromScore(input.bcs) || undefined,
    rerKcal: rer,
    dailyCalories,
    feedingFrequency,
    portions: {
      cupsPerMeal: cupsPerMeal,
      gramsPerMeal: gramsPerMeal,
      kcalPerMeal: Math.round(dailyCalories / feedingFrequency),
    },
    recommendedFoodTypes,
    foodsToAvoid: TOXIC_FOODS,
    treatAllowanceKcal: treatAllowanceKcal,
    exerciseMinutesPerDay: exerciseMinutes,
    proteinGuidance,
    fatGuidance,
    waterMlPerDay: waterMl,
    notes,
  };

  return plan;
}

const diet = {
  calculateRER,
  generateDietPlan,
  TOXIC_FOODS,
  bcsCategoryFromScore,
};

export default diet;
