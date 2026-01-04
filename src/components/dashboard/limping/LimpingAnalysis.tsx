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
  Download,
} from "lucide-react";
import { compressVideoSimple } from "@/lib/video-compression";
import { jsPDF } from "jspdf";

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

// ✅ FIXED: Match actual Python API response
interface LimpingResult {
  prediction: "Normal" | "Limping";
  confidence: number;
  symmetry_indices: {
    SI_overall: number;
    SI_front: number;
    SI_back: number;
  };
  leg_status: {
    front_legs: string;
    back_legs: string;
  };
  stride_measurements: {
    left_front: number;
    right_front: number;
    left_back: number;
    right_back: number;
  };
  frames_analyzed: number;
}

interface AnalysisResult {
  dogInfo: {
    age: string;
    weight_category: string;
    age_group: string;
  };
  inputData: {
    age: string;
    weight_category: string;
    limping_detected: string;
    pain_while_walking: string;
    difficulty_standing: string;
    reduced_activity: string;
    joint_swelling: string;
  };
  prediction: {
    primary_disease: string;
    confidence: number;
    risk_profile: string;
    mobility_status: string;
    recommendations: string[];
    disease_probabilities?: {
      "Hip Dysplasia": number;
      "Osteoarthritis": number;
      "IVDD": number;
      "Normal": number;
      "Patellar Luxation": number;
    };
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

    if (!file.type.startsWith("video/")) {
      onError?.("Please select a valid video file (MP4, MOV, or WebM)");
      return;
    }

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
          <p className="text-xs text-amber-600 mt-2 font-medium">
            Large videos will be automatically compressed before upload
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
  limpingResult?: LimpingResult | null;
  selectedPet?: Pet | null;
}) => {
  const calculateWeightCategory = (
    weightKg: number | null | undefined,
  ): string => {
    if (weightKg == null) return "";
    if (weightKg < 10) return "Light";
    if (weightKg <= 25) return "Medium";
    return "Heavy";
  };

  const [formData, setFormData] = useState<HealthFormData>({
    age_years:
      selectedPet?.ageYears != null ? String(selectedPet.ageYears) : "",
    weight_category: calculateWeightCategory(selectedPet?.weightKg),
    limping_detected: "",
    pain_while_walking: "",
    difficulty_standing: "",
    reduced_activity: "",
    joint_swelling: "",
  });

  // ✅ FIXED: Use correct field name
  React.useEffect(() => {
    if (limpingResult?.prediction) {
      setFormData((prev) => ({
        ...prev,
        limping_detected: limpingResult.prediction === "Limping" ? "1" : "0",
      }));
    }
  }, [limpingResult]);

  React.useEffect(() => {
    if (selectedPet) {
      setFormData((prev) => ({
        ...prev,
        age_years:
          selectedPet.ageYears != null
            ? String(selectedPet.ageYears)
            : prev.age_years,
        weight_category:
          calculateWeightCategory(selectedPet.weightKg) || prev.weight_category,
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

            {/* ✅ FIXED: Use correct field name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limping Detected *
                {limpingResult && (
                  <span
                    className={`ml-2 text-xs font-normal ${
                      limpingResult.prediction === "Limping"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    (Video: {limpingResult.prediction})
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
  const [limpingResult, setLimpingResult] = useState<LimpingResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleVideoSelect = async (file: File) => {
    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setAnalysisResult(null);
    setError(null);
    setLimpingResult(null);

    let videoToUpload = file;
    const fileSizeMB = file.size / (1024 * 1024);

    // Compress video if it's larger than 30MB
    if (fileSizeMB > 30) {
      setIsCompressing(true);
      try {
        console.log(`Compressing video from ${fileSizeMB.toFixed(2)} MB...`);
        videoToUpload = await compressVideoSimple(file, { maxSizeMB: 50 });
        const compressedSizeMB = videoToUpload.size / (1024 * 1024);
        console.log(`Compressed to ${compressedSizeMB.toFixed(2)} MB`);
      } catch (compressionError) {
        console.warn("Video compression failed, using original file:", compressionError);
        // Continue with original file if compression fails
      } finally {
        setIsCompressing(false);
      }
    }

    setIsAnalyzingVideo(true);
    try {
      const formData = new FormData();
      formData.append("video", videoToUpload);

      const response = await fetch("/api/limping/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Handle 413 error specifically (Payload Too Large)
        if (response.status === 413) {
          const fileSizeMB = videoToUpload.size / (1024 * 1024);
          throw new Error(
            `Video file is too large (${fileSizeMB.toFixed(2)} MB). The server cannot accept files this large. Please try:\n\n1. Compress the video using a video compression tool\n2. Record a shorter video (30-60 seconds)\n3. Reduce the video quality/resolution\n\nMaximum recommended file size is 30 MB.`,
          );
        }

        // Try to parse error response
        let errorMessage = "Failed to analyze video";
        const contentType = response.headers.get("content-type");
        
        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // Try to get text response
            const errorText = await response.text();
            if (errorText && errorText.trim().length > 0) {
              // Check if it looks like HTML (common for 413 errors)
              if (errorText.trim().startsWith("<")) {
                errorMessage = `Server error (${response.status}): Request entity too large. Please use a smaller video file.`;
              } else {
                errorMessage = errorText.substring(0, 500);
              }
            } else {
              errorMessage = `Server error (${response.status}). Please try again with a smaller video file.`;
            }
          }
        } catch (parseError) {
          // If all parsing fails, use status-based message
          if (response.status >= 500) {
            errorMessage = `Server error (${response.status}). Please try again later.`;
          } else if (response.status >= 400) {
            errorMessage = `Request error (${response.status}). Please check your video file and try again.`;
          } else {
            errorMessage = `Unexpected error (${response.status}). Please try again.`;
          }
        }
        throw new Error(errorMessage);
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
      // ✅ FIXED: Use correct field name
      const limpingDetected =
        limpingResult?.prediction === "Limping"
          ? "1"
          : limpingResult?.prediction === "Normal"
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
        inputData: {
          age: formData.age_years,
          weight_category: formData.weight_category,
          limping_detected: limpingDetected === "1" ? "Yes" : "No",
          pain_while_walking: formData.pain_while_walking === "1" ? "Yes" : "No",
          difficulty_standing: formData.difficulty_standing === "1" ? "Yes" : "No",
          reduced_activity: formData.reduced_activity === "1" ? "Yes" : "No",
          joint_swelling: formData.joint_swelling === "1" ? "Yes" : "No",
        },
        prediction: {
          primary_disease: data.prediction.predicted_disease,
          confidence: data.prediction.confidence,
          risk_profile: data.prediction.risk_profile,
          mobility_status: data.prediction.mobility_status,
          recommendations: data.prediction.recommendations,
          disease_probabilities: data.prediction.disease_probabilities || undefined,
        },
      };

      setAnalysisResult(result);

      // Save to pets table if pet is selected
      if (selectedPet?.id && selectedVideo) {
        setSaveStatus("saving");
        try {
          const saveFormData = new FormData();
          saveFormData.append("video", selectedVideo);
          // ✅ FIXED: Use correct field names
          saveFormData.append("limpingClass", limpingResult?.prediction || "");
          saveFormData.append(
            "limpingConfidence",
            String(limpingResult?.confidence || ""),
          );
          saveFormData.append(
            "limpingSiFront",
            String(limpingResult?.symmetry_indices?.SI_front || ""),
          );
          saveFormData.append(
            "limpingSiBack",
            String(limpingResult?.symmetry_indices?.SI_back || ""),
          );
          saveFormData.append(
            "limpingSiOverall",
            String(limpingResult?.symmetry_indices?.SI_overall || ""),
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

  const generatePDFReport = () => {
    if (!analysisResult || !limpingResult) {
      alert("No analysis data available to generate report");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Helper function to add text with word wrap
      const addWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number = 6,
      ): number => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * lineHeight;
      };

      // Helper to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Header background
      doc.setFillColor(37, 99, 235); // Blue
      doc.rect(0, 0, pageWidth, 45, "F");

      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Pet Mobility & Limping Detection Report", margin, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const petName = selectedPet?.name || "Unknown Pet";
      doc.text(`Pet: ${petName}`, margin, 30);
      const reportDate = new Date().toLocaleString();
      doc.text(`Generated: ${reportDate}`, margin, 38);

      yPos = 55;

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Pet Information Section
      doc.setFillColor(239, 246, 255); // Light blue background
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, "F");

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(29, 78, 216);
      doc.text("Pet Information", margin + 5, yPos + 10);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Age: ${analysisResult.dogInfo.age} years (${analysisResult.dogInfo.age_group})`,
        margin + 5,
        yPos + 20,
      );
      doc.text(
        `Weight Category: ${analysisResult.dogInfo.weight_category}`,
        margin + 100,
        yPos + 20,
      );

      yPos += 45;

      // Input Data Section
      checkNewPage(60);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text("Input Data", margin, yPos);
      yPos += 8;

      doc.setFillColor(249, 250, 251); // Light gray background
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      const inputData = [
        `Limping Detected: ${analysisResult.inputData.limping_detected}`,
        `Pain While Walking: ${analysisResult.inputData.pain_while_walking}`,
        `Difficulty Standing: ${analysisResult.inputData.difficulty_standing}`,
        `Reduced Activity: ${analysisResult.inputData.reduced_activity}`,
        `Joint Swelling: ${analysisResult.inputData.joint_swelling}`,
      ];

      inputData.forEach((item, index) => {
        doc.text(item, margin + 5, yPos + 8 + index * 8);
      });

      yPos += 60;

      // Limping Detection Results Section
      checkNewPage(100);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text("Limping Detection Analysis", margin, yPos);
      yPos += 8;

      doc.setFillColor(254, 243, 199); // Light yellow background
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 80, 3, 3, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Detection Result:", margin + 5, yPos + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(
        `Prediction: ${limpingResult.prediction}`,
        margin + 5,
        yPos + 18,
      );
      doc.text(
        `Confidence: ${limpingResult.confidence.toFixed(2)}%`,
        margin + 5,
        yPos + 26,
      );
      doc.text(
        `Frames Analyzed: ${limpingResult.frames_analyzed || "N/A"}`,
        margin + 5,
        yPos + 34,
      );

      // Symmetry Indices
      if (limpingResult.symmetry_indices) {
        doc.setFont("helvetica", "bold");
        doc.text("Symmetry Indices:", margin + 5, yPos + 46);
        doc.setFont("helvetica", "normal");
        doc.text(
          `SI Overall: ${limpingResult.symmetry_indices.SI_overall.toFixed(2)}%`,
          margin + 5,
          yPos + 54,
        );
        doc.text(
          `SI Front: ${limpingResult.symmetry_indices.SI_front.toFixed(2)}%`,
          margin + 70,
          yPos + 54,
        );
        doc.text(
          `SI Back: ${limpingResult.symmetry_indices.SI_back.toFixed(2)}%`,
          margin + 120,
          yPos + 54,
        );
      }

      // Leg Status
      if (limpingResult.leg_status) {
        doc.text(
          `Front Legs: ${limpingResult.leg_status.front_legs}`,
          margin + 5,
          yPos + 62,
        );
        doc.text(
          `Back Legs: ${limpingResult.leg_status.back_legs}`,
          margin + 70,
          yPos + 62,
        );
      }

      // Stride Measurements
      if (limpingResult.stride_measurements) {
        doc.setFont("helvetica", "bold");
        doc.text("Stride Measurements:", margin + 5, yPos + 70);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Left Front: ${limpingResult.stride_measurements.left_front.toFixed(2)}`,
          margin + 5,
          yPos + 78,
        );
        doc.text(
          `Right Front: ${limpingResult.stride_measurements.right_front.toFixed(2)}`,
          margin + 60,
          yPos + 78,
        );
        doc.text(
          `Left Back: ${limpingResult.stride_measurements.left_back.toFixed(2)}`,
          margin + 5,
          yPos + 86,
        );
        doc.text(
          `Right Back: ${limpingResult.stride_measurements.right_back.toFixed(2)}`,
          margin + 60,
          yPos + 86,
        );
      }

      yPos += 100;

      // Disease Prediction Results Section
      checkNewPage(80);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text("Disease Prediction Results", margin, yPos);
      yPos += 8;

      // Primary Diagnosis
      doc.setFillColor(219, 234, 254); // Light blue background
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, "F");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(29, 78, 216);
      doc.text("Primary Diagnosis:", margin + 5, yPos + 10);
      doc.text(
        analysisResult.prediction.primary_disease,
        margin + 60,
        yPos + 10,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(
        `Risk Probability: ${analysisResult.prediction.confidence.toFixed(2)}%`,
        margin + 5,
        yPos + 20,
      );
      doc.text(
        `Risk Level: ${analysisResult.prediction.risk_profile}`,
        margin + 80,
        yPos + 20,
      );
      doc.text(
        `Mobility Status: ${analysisResult.prediction.mobility_status}`,
        margin + 130,
        yPos + 20,
      );

      yPos += 35;

      // All Disease Probabilities
      checkNewPage(50);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text("Disease Risk Probabilities:", margin, yPos);
      yPos += 8;

      let diseases: [string, number][];
      if (analysisResult.prediction.disease_probabilities) {
        diseases = Object.entries(analysisResult.prediction.disease_probabilities).sort(
          ([, a], [, b]) => (b as number) - (a as number),
        ) as [string, number][];
      } else {
        // Fallback: create probabilities for all diseases
        const primaryProb = analysisResult.prediction.confidence;
        const remainingProb = (100 - primaryProb) / 4;
        const diseaseList: [string, number][] = [
          ["Hip Dysplasia", analysisResult.prediction.primary_disease === "Hip Dysplasia" ? primaryProb : remainingProb],
          ["Osteoarthritis", analysisResult.prediction.primary_disease === "Osteoarthritis" ? primaryProb : remainingProb],
          ["IVDD", analysisResult.prediction.primary_disease === "IVDD" ? primaryProb : remainingProb],
          ["Normal", analysisResult.prediction.primary_disease === "Normal" ? primaryProb : remainingProb],
          ["Patellar Luxation", analysisResult.prediction.primary_disease === "Patellar Luxation" ? primaryProb : remainingProb],
        ];
        diseases = diseaseList.sort(([, a], [, b]) => (a as number) - (b as number)).reverse();
      }

      diseases.forEach(([disease, probability]) => {
        checkNewPage(12);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const isPrimary = disease === analysisResult.prediction.primary_disease;
        doc.setTextColor(isPrimary ? 29 : 55, isPrimary ? 78 : 65, isPrimary ? 216 : 81);
        doc.text(
          `${disease}: ${probability.toFixed(2)}%`,
          margin + 5,
          yPos,
        );
        yPos += 8;
      });

      yPos += 5;

      // Recommendations Section
      if (
        analysisResult.prediction.recommendations &&
        analysisResult.prediction.recommendations.length > 0
      ) {
        checkNewPage(50);
        doc.setFillColor(220, 252, 231); // Light green background
        const recHeight = 20 + analysisResult.prediction.recommendations.length * 8;
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, recHeight, 3, 3, "F");

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(21, 128, 61);
        doc.text("Veterinary Recommendations", margin + 5, yPos + 10);

        yPos += 16;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);

        analysisResult.prediction.recommendations.forEach((rec, index) => {
          checkNewPage(10);
          const bulletText = `${index + 1}. ${rec}`;
          yPos = addWrappedText(
            bulletText,
            margin + 5,
            yPos,
            pageWidth - 2 * margin - 10,
            5,
          );
          yPos += 2;
        });
      }

      // Footer
      yPos = pageHeight - 25;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "italic");
      doc.text(
        "This report is generated by VetLink AI Limping Detection & Disease Prediction System.",
        margin,
        yPos + 8,
      );
      doc.text(
        "Please consult a veterinarian for professional medical advice.",
        margin,
        yPos + 14,
      );

      // VetLink branding
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("VetLink", pageWidth - margin - 20, yPos + 11);

      // Save the PDF
      const fileName = `Limping_Detection_Report_${petName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      alert("Failed to generate PDF report. Please try again.");
    }
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
                  {selectedPet.breed && (
                    <span className="text-gray-500">
                      {" "}
                      • {selectedPet.breed}
                    </span>
                  )}
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
            onError={(errorMsg) => setError(errorMsg)}
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
                  {saveError && (
                    <div className="text-xs break-words opacity-90">
                      {saveError}
                    </div>
                  )}
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

                {(isCompressing || isAnalyzingVideo) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      <span className="text-sm text-blue-800">
                        {isCompressing
                          ? "Compressing video to reduce file size..."
                          : "Analyzing video for limping detection..."}
                      </span>
                    </div>
                  </div>
                )}

                {limpingResult && !isAnalyzingVideo && (
                  <div
                    className={`mt-4 p-3 rounded-lg border ${
                      limpingResult.prediction === "Limping"
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`font-semibold ${
                            limpingResult.prediction === "Limping"
                              ? "text-red-800"
                              : "text-green-800"
                          }`}
                        >
                          {limpingResult.prediction === "Limping"
                            ? "Limping Detected"
                            : "Normal Gait"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Confidence: {limpingResult.confidence?.toFixed(1)}%
                          {limpingResult.symmetry_indices?.SI_overall !=
                            null && (
                            <>
                              {" "}
                              | SI Overall:{" "}
                              {limpingResult.symmetry_indices.SI_overall.toFixed(
                                1,
                              )}
                              %
                            </>
                          )}
                        </p>
                        {limpingResult.frames_analyzed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Frames analyzed: {limpingResult.frames_analyzed}
                          </p>
                        )}
                      </div>
                      <CheckCircle
                        className={`w-5 h-5 ${
                          limpingResult.prediction === "Limping"
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
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Disease Prediction Results
                </h2>
                <button
                  onClick={generatePDFReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span className="whitespace-nowrap">Download Report</span>
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {/* Input Data Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Input Data Preview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {analysisResult.inputData.age} years
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Weight Category:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {analysisResult.inputData.weight_category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Limping Detected:</span>
                      <span
                        className={`ml-2 font-medium ${
                          analysisResult.inputData.limping_detected === "Yes"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {analysisResult.inputData.limping_detected}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pain While Walking:</span>
                      <span
                        className={`ml-2 font-medium ${
                          analysisResult.inputData.pain_while_walking === "Yes"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {analysisResult.inputData.pain_while_walking}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Difficulty Standing:</span>
                      <span
                        className={`ml-2 font-medium ${
                          analysisResult.inputData.difficulty_standing === "Yes"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {analysisResult.inputData.difficulty_standing}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reduced Activity:</span>
                      <span
                        className={`ml-2 font-medium ${
                          analysisResult.inputData.reduced_activity === "Yes"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {analysisResult.inputData.reduced_activity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Joint Swelling:</span>
                      <span
                        className={`ml-2 font-medium ${
                          analysisResult.inputData.joint_swelling === "Yes"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {analysisResult.inputData.joint_swelling}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Diagnosis */}
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
                      <p className="text-xs text-gray-600 mb-1">Risk Probability</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {analysisResult.prediction.confidence.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* All Disease Probabilities */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Disease Risk Probabilities
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.prediction.disease_probabilities
                      ? Object.entries(analysisResult.prediction.disease_probabilities)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([disease, probability]) => {
                            const isPrimary = disease === analysisResult.prediction.primary_disease;
                            return (
                              <div
                                key={disease}
                                className={`flex items-center justify-between p-2 rounded-lg ${
                                  isPrimary
                                    ? "bg-blue-50 border border-blue-200"
                                    : "bg-gray-50"
                                }`}
                              >
                                <span className="text-sm font-medium text-gray-900">
                                  {disease}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    isPrimary ? "text-blue-600" : "text-gray-700"
                                  }`}
                                >
                                  {(probability as number).toFixed(2)}%
                                </span>
                              </div>
                            );
                          })
                      : // Fallback: Show all diseases with primary highlighted
                        [
                          "Hip Dysplasia",
                          "Osteoarthritis",
                          "IVDD",
                          "Normal",
                          "Patellar Luxation",
                        ].map((disease) => {
                          const isPrimary = disease === analysisResult.prediction.primary_disease;
                          const probValue = isPrimary
                            ? analysisResult.prediction.confidence
                            : (100 - analysisResult.prediction.confidence) / 4;
                          return (
                            <div
                              key={disease}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                isPrimary
                                  ? "bg-blue-50 border border-blue-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {disease}
                              </span>
                              <span
                                className={`text-sm font-semibold ${
                                  isPrimary ? "text-blue-600" : "text-gray-700"
                                }`}
                              >
                                {probValue.toFixed(2)}%
                              </span>
                            </div>
                          );
                        })}
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
