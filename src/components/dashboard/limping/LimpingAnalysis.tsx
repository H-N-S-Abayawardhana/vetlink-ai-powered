"use client";
import React, { useState } from "react";
import type { Pet } from "@/lib/pets";
import {
  Upload,
  Video,
  Activity,
  AlertCircle,
  CheckCircle,
  FileText,
  X,
} from "lucide-react";

// Type definitions
interface HealthFormData {
  age_years: string;
  weight_category: string;
  limping_detected: string;
  pain_while_walking: string;
  difficulty_standing: string;
  reduced_activity: string;
  joint_swelling: string;
}

interface AnalysisResult {
  dogInfo: {
    age: string;
    weight_category: string;
    age_group: string;
  };
  prediction: {
    primary_disease: string;
    confidence: number;
    risk_profile: string;
    symptom_severity: number;
    pain_severity: number;
    mobility_status: string;
    recommendations: string[];
  };
}

interface LimpingAnalysisProps {
  selectedPet: Pet | null;
  onChangePet: () => void;
  onClearPet: () => void;
}

function getPetAvatarSrc(pet: Pet | null | undefined): string | null {
  if (!pet) return null;
  const anyPet = pet as any;
  return anyPet.avatarDataUrl || anyPet.avatarUrl || null;
}

const VideoUpload = ({
  onVideoSelect,
  onError,
}: {
  onVideoSelect: (file: File) => void;
  onError?: (error: string) => void;
}) => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      onError?.("Please select a valid video file (MP4, MOV, or WebM)");
      return;
    }

    // Validate file size (50MB)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      onError?.(
        `Video file is too large (${fileSizeMB} MB). Maximum file size is 50 MB.`,
      );
      return;
    }

    onVideoSelect(file);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-500 transition-colors">
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileChange}
        className="hidden"
        id="video-upload"
      />
      <label htmlFor="video-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            Click to upload video
          </p>
          <p className="text-sm text-gray-600">MP4, MOV or WebM (Max 50MB)</p>
          <p className="text-xs text-gray-500 mt-1">
            Record 30-60 seconds of natural walking
          </p>
        </div>
      </label>
    </div>
  );
};

const HealthInfoForm = ({
  onSubmit,
  onCancel,
  limpingResult,
  selectedPet,
}: {
  onSubmit: (formData: HealthFormData) => void;
  onCancel: () => void;
  limpingResult?: {
    class: "Normal" | "Limping";
    confidence: number;
    SI_front?: number;
    SI_back?: number;
    SI_overall?: number;
  } | null;
  selectedPet?: Pet | null;
}) => {
  // Helper function to calculate weight category from weight in kg
  const calculateWeightCategory = (weightKg: number | null | undefined): string => {
    if (weightKg == null) return "";
    if (weightKg < 10) return "Light";
    if (weightKg <= 25) return "Medium";
    return "Heavy";
  };

  const [formData, setFormData] = useState<HealthFormData>({
    age_years: selectedPet?.ageYears != null ? String(selectedPet.ageYears) : "",
    weight_category: calculateWeightCategory(selectedPet?.weightKg),
    limping_detected: "",
    pain_while_walking: "",
    difficulty_standing: "",
    reduced_activity: "",
    joint_swelling: "",
  });

  React.useEffect(() => {
    if (limpingResult?.class) {
      setFormData((prev) => ({
        ...prev,
        limping_detected: limpingResult.class === "Limping" ? "1" : "0",
      }));
    }
  }, [limpingResult]);

  // Auto-fill form when selectedPet changes
  React.useEffect(() => {
    if (selectedPet) {
      setFormData((prev) => ({
        ...prev,
        age_years: selectedPet.ageYears != null ? String(selectedPet.ageYears) : prev.age_years,
        weight_category: calculateWeightCategory(selectedPet.weightKg) || prev.weight_category,
      }));
    }
  }, [selectedPet]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const allFilled = Object.values(formData).every((val) => val !== "");
    if (!allFilled) {
      alert("Please fill all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Dog Health Information
                {selectedPet && (
                  <span className="text-base sm:text-lg font-normal text-gray-600 ml-2">
                    - {selectedPet.name}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Required information for disease prediction
                {selectedPet && (
                  <span className="block mt-1 text-xs text-gray-500">
                    Pet information auto-filled from database
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                min="1"
                max="15"
                required
                value={formData.age_years}
                onChange={(e) =>
                  setFormData({ ...formData, age_years: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter age in years (1-15)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Category *
              </label>
              <select
                required
                value={formData.weight_category}
                onChange={(e) =>
                  setFormData({ ...formData, weight_category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select weight category</option>
                <option value="Light">Light (Small dogs, &lt;10kg)</option>
                <option value="Medium">Medium (10-25kg)</option>
                <option value="Heavy">Heavy (Large dogs, &gt;25kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limping Detected *
                {limpingResult && (
                  <span
                    className={`ml-2 text-xs font-normal ${
                      limpingResult.class === "Limping"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    (Video: {limpingResult.class})
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, limping_detected: "1" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.limping_detected === "1"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, limping_detected: "0" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.limping_detected === "0"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain While Walking *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, pain_while_walking: "1" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.pain_while_walking === "1"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, pain_while_walking: "0" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.pain_while_walking === "0"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Standing *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, difficulty_standing: "1" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.difficulty_standing === "1"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, difficulty_standing: "0" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.difficulty_standing === "0"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reduced Activity *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, reduced_activity: "1" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.reduced_activity === "1"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, reduced_activity: "0" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.reduced_activity === "0"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joint Swelling *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, joint_swelling: "1" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.joint_swelling === "1"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, joint_swelling: "0" })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.joint_swelling === "0"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Analyze & Predict Disease
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function LimpingAnalysis({
  selectedPet,
  onChangePet,
  onClearPet,
}: LimpingAnalysisProps) {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthData, setHealthData] = useState<HealthFormData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [limpingResult, setLimpingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleVideoSelect = async (file: File) => {
    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setAnalysisResult(null);
    setError(null);
    setLimpingResult(null);

    setIsAnalyzingVideo(true);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/limping/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze video");
      }

      const data = await response.json();
      setLimpingResult(data.result);
      setShowHealthForm(true);
    } catch (err) {
      console.error("Video analysis failed:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze video");
      setShowHealthForm(true);
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const handleHealthFormSubmit = async (formData: HealthFormData) => {
    setHealthData(formData);
    setShowHealthForm(false);
    setIsAnalyzing(true);
    setError(null);
    setSaveStatus("idle");
    setSaveError(null);

    try {
      const limpingDetected =
        limpingResult?.class === "Limping"
          ? "1"
          : limpingResult?.class === "Normal"
            ? "0"
            : formData.limping_detected;

      const response = await fetch("/api/disease/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limping_detected: limpingDetected,
          age_years: formData.age_years,
          weight_category: formData.weight_category,
          pain_while_walking: formData.pain_while_walking,
          difficulty_standing: formData.difficulty_standing,
          reduced_activity: formData.reduced_activity,
          joint_swelling: formData.joint_swelling,
          limping_analysis_result: limpingResult,
          pet_id: selectedPet?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to predict disease");
      }

      const data = await response.json();

      const age = parseInt(formData.age_years);
      let age_group;
      if (age <= 3) age_group = "Puppy (0-3y)";
      else if (age <= 7) age_group = "Adult (4-7y)";
      else if (age <= 11) age_group = "Senior (8-11y)";
      else age_group = "Geriatric (12+y)";

      const result: AnalysisResult = {
        dogInfo: {
          age: formData.age_years,
          weight_category: formData.weight_category,
          age_group: age_group,
        },
        prediction: {
          primary_disease: data.prediction.predicted_disease,
          confidence: data.prediction.confidence,
          risk_profile: data.prediction.risk_profile,
          symptom_severity: data.prediction.symptom_score,
          pain_severity: data.prediction.pain_severity,
          mobility_status: data.prediction.mobility_status,
          recommendations: data.prediction.recommendations,
        },
      };

      setAnalysisResult(result);

      // Save to pets table if pet is selected
      if (selectedPet?.id && selectedVideo) {
        setSaveStatus("saving");
        try {
          const saveFormData = new FormData();
          saveFormData.append("video", selectedVideo);
          saveFormData.append("limpingClass", limpingResult?.class || "");
          saveFormData.append(
            "limpingConfidence",
            String(limpingResult?.confidence || ""),
          );
          saveFormData.append(
            "limpingSiFront",
            String(limpingResult?.SI_front || ""),
          );
          saveFormData.append(
            "limpingSiBack",
            String(limpingResult?.SI_back || ""),
          );
          saveFormData.append(
            "limpingSiOverall",
            String(limpingResult?.SI_overall || ""),
          );
          saveFormData.append("ageYears", formData.age_years);
          saveFormData.append("weightCategory", formData.weight_category);
          saveFormData.append("limpingDetected", limpingDetected);
          saveFormData.append("painWhileWalking", formData.pain_while_walking);
          saveFormData.append(
            "difficultyStanding",
            formData.difficulty_standing,
          );
          saveFormData.append("reducedActivity", formData.reduced_activity);
          saveFormData.append("jointSwelling", formData.joint_swelling);
          saveFormData.append(
            "predictedDisease",
            data.prediction.predicted_disease,
          );
          saveFormData.append(
            "diseaseConfidence",
            String(data.prediction.confidence),
          );
          saveFormData.append("riskLevel", data.prediction.risk_level);
          saveFormData.append(
            "symptomScore",
            String(data.prediction.symptom_score),
          );
          saveFormData.append(
            "painSeverity",
            String(data.prediction.pain_severity),
          );
          saveFormData.append(
            "recommendations",
            JSON.stringify(data.prediction.recommendations),
          );

          const saveResponse = await fetch(
            `/api/pets/${selectedPet.id}/limping`,
            {
              method: "POST",
              body: saveFormData,
            },
          );

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(errorData.error || "Failed to save limping record");
          }

          setSaveStatus("saved");
        } catch (e) {
          console.error("Failed saving limping record:", e);
          setSaveStatus("error");
          setSaveError(
            e instanceof Error ? e.message : "Failed to save limping record",
          );
        }
      }
    } catch (err) {
      console.error("Disease prediction failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to predict disease",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setShowHealthForm(false);
    setHealthData(null);
    setAnalysisResult(null);
    setLimpingResult(null);
    setError(null);
    setIsAnalyzing(false);
    setIsAnalyzingVideo(false);
    setSaveStatus("idle");
    setSaveError(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Pet Mobility & Limping Detection
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Upload a video of your pet walking to detect limping and predict
              potential mobility diseases using AI-powered analysis
            </p>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {selectedPet ? (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Selected pet:</span>{" "}
                  {selectedPet.name}
                  {selectedPet.breed ? (
                    <span className="text-gray-500">
                      {" "}
                      • {selectedPet.breed}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Selected pet:</span> None
                  (results will show only the video analysis)
                </div>
              )}

              <div className="flex items-center gap-2">
                {onChangePet && (
                  <button
                    type="button"
                    onClick={onChangePet}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Change pet
                  </button>
                )}
                {selectedPet && onClearPet && (
                  <button
                    type="button"
                    onClick={onClearPet}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {!selectedPet && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-900 font-medium">
                  Tip: Select your pet to automatically save analysis history
                  (date, detected condition, and video) to the pet profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && !videoPreview && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 sm:p-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-red-800">
                Upload Error
              </h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Upload Section */}
      {!videoPreview && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <VideoUpload
            onVideoSelect={handleVideoSelect}
            onError={(errorMsg) => {
              setError(errorMsg);
            }}
          />
        </div>
      )}

      {/* Results Section */}
      {videoPreview && (
        <div className="space-y-4 sm:space-y-6">
          {/* Save Status (when pet selected) */}
          {selectedPet && saveStatus !== "idle" && (
            <div
              className={`rounded-lg border p-3 sm:p-4 text-sm ${
                saveStatus === "saving"
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : saveStatus === "saved"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-orange-50 border-orange-200 text-orange-800"
              }`}
            >
              {saveStatus === "saving" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  <span>
                    Saving this analysis to {selectedPet.name}&apos;s history…
                  </span>
                </div>
              ) : saveStatus === "saved" ? (
                <span>
                  Saved to {selectedPet.name}&apos;s limping detection history.
                </span>
              ) : (
                <div className="space-y-1">
                  <div>
                    Couldn&apos;t save this analysis to history (analysis result
                    is still shown).
                  </div>
                  {saveError ? (
                    <div className="text-xs break-words opacity-90">
                      {saveError}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div
            className={`grid gap-4 sm:gap-6 ${selectedPet ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
          >
            {/* Pet Details (optional) */}
            {selectedPet && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Pet Details
                  </h2>
                </div>
                <div className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getPetAvatarSrc(selectedPet) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getPetAvatarSrc(selectedPet) as string}
                          alt={`${selectedPet.name} photo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🐕</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold text-gray-900 truncate">
                        {selectedPet.name}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-semibold">Breed:</span>{" "}
                        {selectedPet.breed || "—"}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-semibold">Age:</span>{" "}
                        {selectedPet.ageYears != null
                          ? `${selectedPet.ageYears} ${selectedPet.ageYears === 1 ? "year" : "years"}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Preview */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Video
                </h2>
                <button
                  onClick={reset}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Reset
                </button>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 rounded-lg"
                />

                {isAnalyzingVideo && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      <span className="text-sm text-blue-800">
                        Analyzing video for limping detection...
                      </span>
                    </div>
                  </div>
                )}

                {limpingResult && !isAnalyzingVideo && (
                  <div
                    className={`mt-4 p-3 rounded-lg border ${
                      limpingResult.class === "Limping"
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`font-semibold ${
                            limpingResult.class === "Limping"
                              ? "text-red-800"
                              : "text-green-800"
                          }`}
                        >
                          {limpingResult.class === "Limping"
                            ? "Limping Detected"
                            : "Normal Gait"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Confidence: {limpingResult.confidence?.toFixed(1)}%
                          {limpingResult.SI_overall != null && (
                            <>
                              {" "}
                              | SI Overall:{" "}
                              {limpingResult.SI_overall.toFixed(1)}%
                            </>
                          )}
                        </p>
                      </div>
                      <CheckCircle
                        className={`w-5 h-5 ${
                          limpingResult.class === "Limping"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          Analysis Failed
                        </p>
                        <p className="text-xs text-red-700 mt-1 break-words">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {healthData && !error && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">
                        Health information complete
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">
                Analyzing symptoms and predicting disease...
              </p>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && !isAnalyzing && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Disease Prediction Results
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        Primary Diagnosis
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {analysisResult.prediction.primary_disease}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Confidence</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {analysisResult.prediction.confidence}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Symptom Severity</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {analysisResult.prediction.symptom_severity}/4
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pain Severity</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {analysisResult.prediction.pain_severity}/4
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Mobility Status</p>
                  <p
                    className={`text-base font-semibold ${
                      analysisResult.prediction.mobility_status === "Impaired"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {analysisResult.prediction.mobility_status}
                  </p>
                </div>

                {analysisResult.prediction.recommendations &&
                  analysisResult.prediction.recommendations.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Veterinary Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.prediction.recommendations.map(
                          (rec: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Health Form Modal */}
      {showHealthForm && (
        <HealthInfoForm
          onSubmit={handleHealthFormSubmit}
          onCancel={() => setShowHealthForm(false)}
          limpingResult={limpingResult}
          selectedPet={selectedPet}
        />
      )}
    </div>
  );
}
