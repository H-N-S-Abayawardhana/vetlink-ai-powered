// Types for Multi-Disease Prediction System

export type BreedSize = "Small" | "Medium" | "Large";
export type DietType = "Dry" | "Wet" | "Mixed" | "Homemade";
export type ActivityLevel = "Low" | "Moderate" | "High";
export type FattyFoodFrequency = "Low" | "Moderate" | "High";
export type TreatFrequency = "Rare" | "Moderate" | "Frequent";
export type WaterIntake = "Low" | "Normal" | "High";
export type Urination = "Normal" | "Frequent" | "Difficult";
export type AppetiteChange = "Decreased" | "Normal" | "Increased";
export type YesNo = "Yes" | "No";
export type DigestiveIssues = "None" | "Mild" | "Severe";
export type RiskLevel = "Low" | "Moderate" | "High";

// The 6 diseases the model can predict
export type DiseaseType =
  | "Diabetes"
  | "Pancreatitis"
  | "Hyperlipidemia"
  | "Urolithiasis";

// Input data for disease prediction
export interface DiseasePredictionInput {
  age_years: number;
  weight_kg: number;
  breed_size: BreedSize;
  neutered_status: YesNo;

  activity_level: ActivityLevel;
  daily_exercise_minutes: number;
  diet_type: DietType;
  fatty_food_frequency: FattyFoodFrequency;
  treat_frequency: TreatFrequency;

  // Health Metrics
  body_condition_score: number; // 1-9 scale

  // Clinical Signs (Symptoms)
  water_intake: WaterIntake;
  urination: Urination;
  appetite_change: AppetiteChange;
  vomiting: YesNo;
  digestive_issues: DigestiveIssues;
  lethargy: YesNo;

  // Optional: Link to pet
  pet_id?: string;
}

// Individual disease prediction result
export interface SingleDiseasePrediction {
  disease: DiseaseType;
  probability: number; // 0-100%
  risk_level: RiskLevel;
  is_positive: boolean;
  key_indicators: string[];
}

// Complete prediction result for all 6 diseases
export interface DiseasePredictionResult {
  // Overall summary
  has_risk: boolean;
  highest_risk_disease: DiseaseType | null;

  // Individual predictions
  predictions: SingleDiseasePrediction[];

  // Recommendations based on results
  recommendations: string[];

  // Input summary
  pet_profile: {
    age_group: "Puppy" | "Adult" | "Senior" | "Geriatric";
    weight_status: "Underweight" | "Ideal" | "Overweight" | "Obese";
    risk_factors_count: number;
  };

  // Timestamp
  analyzed_at: string;

  // Error if any
  error?: string;
}

// Form state for the UI
export interface DiseasePredictionFormState {
  // Basic Information
  age_years: string;
  weight_kg: string;
  breed_size: BreedSize | "";
  neutered_status: YesNo | "";

  // Lifestyle
  activity_level: ActivityLevel | "";
  daily_exercise_minutes: string;
  diet_type: DietType | "";
  fatty_food_frequency: FattyFoodFrequency | "";
  treat_frequency: TreatFrequency | "";

  // Health Metrics
  body_condition_score: number | null;

  // Symptoms
  water_intake: WaterIntake | "";
  urination: Urination | "";
  appetite_change: AppetiteChange | "";
  vomiting: YesNo | "";
  digestive_issues: DigestiveIssues | "";
  lethargy: YesNo | "";
}

// Disease information for display
export interface DiseaseInfo {
  name: DiseaseType;
  description: string;
  icon: string;
  color: {
    bg: string;
    text: string;
    border: string;
  };
}

// Helper to convert form state to API input
export function formStateToApiInput(
  formState: DiseasePredictionFormState,
  petId?: string,
): DiseasePredictionInput | null {
  // Validate all required fields
  if (
    !formState.age_years ||
    !formState.weight_kg ||
    !formState.breed_size ||
    !formState.neutered_status ||
    !formState.activity_level ||
    !formState.daily_exercise_minutes ||
    !formState.diet_type ||
    !formState.fatty_food_frequency ||
    !formState.treat_frequency ||
    formState.body_condition_score === null ||
    !formState.water_intake ||
    !formState.urination ||
    !formState.appetite_change ||
    !formState.vomiting ||
    !formState.digestive_issues ||
    !formState.lethargy
  ) {
    return null;
  }

  return {
    age_years: parseInt(formState.age_years, 10),
    weight_kg: parseFloat(formState.weight_kg),
    breed_size: formState.breed_size,
    neutered_status: formState.neutered_status,
    activity_level: formState.activity_level,
    daily_exercise_minutes: parseInt(formState.daily_exercise_minutes, 10),
    diet_type: formState.diet_type,
    fatty_food_frequency: formState.fatty_food_frequency,
    treat_frequency: formState.treat_frequency,
    body_condition_score: formState.body_condition_score,
    water_intake: formState.water_intake,
    urination: formState.urination,
    appetite_change: formState.appetite_change,
    vomiting: formState.vomiting,
    digestive_issues: formState.digestive_issues,
    lethargy: formState.lethargy,
    pet_id: petId,
  };
}

// Initial form state
export const initialFormState: DiseasePredictionFormState = {
  age_years: "",
  weight_kg: "",
  breed_size: "",
  neutered_status: "",
  activity_level: "",
  daily_exercise_minutes: "",
  diet_type: "",
  fatty_food_frequency: "",
  treat_frequency: "",
  body_condition_score: null,
  water_intake: "",
  urination: "",
  appetite_change: "",
  vomiting: "",
  digestive_issues: "",
  lethargy: "",
};

// Disease metadata for UI
export const DISEASE_INFO: Record<DiseaseType, DiseaseInfo> = {
  Diabetes: {
    name: "Diabetes",
    description: "Risk of diabetes related to obesity and age",
    icon: "💉",
    color: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
  },
  Pancreatitis: {
    name: "Pancreatitis",
    description: "Pancreas inflammation often linked to fatty foods",
    icon: "🫓",
    color: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
  },
  Hyperlipidemia: {
    name: "Hyperlipidemia",
    description: "Elevated blood lipids commonly associated with obesity",
    icon: "🧪",
    color: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
  },
  Urolithiasis: {
    name: "Urolithiasis",
    description: "Urinary stone risk influenced by hydration and urination",
    icon: "💎",
    color: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
    },
  },
};

// Risk level colors
export const RISK_LEVEL_STYLES: Record<
  RiskLevel,
  { bg: string; text: string; border: string }
> = {
  Low: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  Moderate: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  High: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
};

// Risk level emojis
export const RISK_LEVEL_EMOJI: Record<RiskLevel, string> = {
  Low: "🟢",
  Moderate: "🟡",
  High: "🔴",
};
