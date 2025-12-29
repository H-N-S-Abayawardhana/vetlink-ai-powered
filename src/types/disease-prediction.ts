// Types for Multi-Disease Prediction System

export type BreedSize = 'Small' | 'Medium' | 'Large';
export type Sex = 'Male' | 'Female';
export type TickPrevention = 'None' | 'Irregular' | 'Regular';
export type DietType = 'Commercial' | 'Homemade' | 'Mixed';
export type ExerciseLevel = 'Low' | 'Moderate' | 'High';
export type Environment = 'Indoor' | 'Outdoor' | 'Mixed' | 'Suburban' | 'Rural' | 'Urban';
export type RiskLevel = 'Low' | 'Moderate' | 'High';

// The 6 diseases the model can predict
export type DiseaseType =
  | "Tick-Borne Disease"
  | "Filariasis"
  | "Diabetes Mellitus Type 2"
  | "Obesity-Related Metabolic Dysfunction"
  | "Urolithiasis"
  | "Healthy";

// Input data for disease prediction
export interface DiseasePredictionInput {
  // Demographic Information
  age_years: number;
  breed_size: BreedSize;
  sex: Sex;
  is_neutered: boolean;

  // Health Metrics
  body_condition_score: number; // 1-9 scale

  // Clinical Signs (Symptoms)
  pale_gums: boolean;
  skin_lesions: boolean;
  polyuria: boolean; // Excessive urination

  // Prevention & Care
  tick_prevention: TickPrevention;
  heartworm_prevention: boolean;
  diet_type: DietType;
  exercise_level: ExerciseLevel;
  environment: Environment;

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
  // Demographic Information
  age_years: string;
  breed_size: BreedSize | "";
  sex: Sex | "";
  is_neutered: "yes" | "no" | "";

  // Health Metrics
  body_condition_score: number | null;

  // Clinical Signs
  pale_gums: "yes" | "no" | "";
  skin_lesions: "yes" | "no" | "";
  polyuria: "yes" | "no" | "";

  // Prevention & Care
  tick_prevention: TickPrevention | "";
  heartworm_prevention: "yes" | "no" | "";
  diet_type: DietType | "";
  exercise_level: ExerciseLevel | "";
  environment: Environment | "";
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
    !formState.breed_size ||
    !formState.sex ||
    !formState.is_neutered ||
    formState.body_condition_score === null ||
    !formState.pale_gums ||
    !formState.skin_lesions ||
    !formState.polyuria ||
    !formState.tick_prevention ||
    !formState.heartworm_prevention ||
    !formState.diet_type ||
    !formState.exercise_level ||
    !formState.environment
  ) {
    return null;
  }

  return {
    age_years: parseInt(formState.age_years, 10),
    breed_size: formState.breed_size,
    sex: formState.sex,
    is_neutered: formState.is_neutered === "yes",
    body_condition_score: formState.body_condition_score,
    pale_gums: formState.pale_gums === "yes",
    skin_lesions: formState.skin_lesions === "yes",
    polyuria: formState.polyuria === "yes",
    tick_prevention: formState.tick_prevention,
    heartworm_prevention: formState.heartworm_prevention === "yes",
    diet_type: formState.diet_type,
    exercise_level: formState.exercise_level,
    environment: formState.environment,
    pet_id: petId,
  };
}

// Initial form state
export const initialFormState: DiseasePredictionFormState = {
  age_years: "",
  breed_size: "",
  sex: "",
  is_neutered: "",
  body_condition_score: null,
  pale_gums: "",
  skin_lesions: "",
  polyuria: "",
  tick_prevention: "",
  heartworm_prevention: "",
  diet_type: "",
  exercise_level: "",
  environment: "",
};

// Disease metadata for UI
export const DISEASE_INFO: Record<DiseaseType, DiseaseInfo> = {
  "Tick-Borne Disease": {
    name: "Tick-Borne Disease",
    description:
      "Diseases transmitted by ticks (e.g., Lyme disease, Ehrlichiosis)",
    icon: "🦠",
    color: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
  },
  Filariasis: {
    name: "Filariasis",
    description: "Heartworm and other parasitic infections",
    icon: "🪱",
    color: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
  },
  "Diabetes Mellitus Type 2": {
    name: "Diabetes Mellitus Type 2",
    description: "Metabolic disorder affecting blood sugar",
    icon: "💉",
    color: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
  },
  "Obesity-Related Metabolic Dysfunction": {
    name: "Obesity-Related Metabolic Dysfunction",
    description: "Health issues from excess weight",
    icon: "⚖️",
    color: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
  },
  Urolithiasis: {
    name: "Urolithiasis",
    description: "Urinary stones/crystals",
    icon: "💎",
    color: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
    },
  },
  Healthy: {
    name: "Healthy",
    description: "Patient is overall healthy",
    icon: "✅",
    color: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
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
