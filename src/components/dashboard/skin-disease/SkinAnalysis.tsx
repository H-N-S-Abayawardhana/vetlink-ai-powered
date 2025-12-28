"use client";

import { useState, useEffect } from "react";
import MLApiService, {
  PredictionResult,
  parseDiseaseName,
} from "@/services/skin-disease-detection/mlApi";
import type { Pet } from "@/lib/pets";
import { createSkinDiseaseRecord } from "@/lib/skin-disease-records";
import ImageUpload from "./ImageUpload";
import CameraCapture from "./CameraCapture";

interface SkinAnalysisProps {
  selectedPet?: Pet | null;
  onChangePet?: () => void;
  onClearPet?: () => void;
}

function getPetAvatarSrc(pet: Pet | null | undefined): string | null {
  if (!pet) return null;
  const anyPet = pet as any;
  return anyPet.avatarDataUrl || anyPet.avatarUrl || null;
}

export default function SkinAnalysis({
  selectedPet,
  onChangePet,
  onClearPet,
}: SkinAnalysisProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    setApiStatus("checking");
    try {
      const health = await MLApiService.healthCheck();
      if (health.status === "healthy" && health.model_loaded) {
        setApiStatus("online");
      } else {
        setApiStatus("offline");
      }
    } catch {
      setApiStatus("offline");
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setPrediction(null);
    setSaveStatus("idle");
    setSaveError(null);

    // Display image preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Make prediction
    setLoading(true);
    try {
      const result = await MLApiService.predictFromFile(file);
      setPrediction(result);

      // If backend says image is invalid / not in-distribution, stop here.
      if (result.valid === false) {
        setLoading(false);
        return;
      }

      // Save scan record to pet history (best-effort) when a pet is selected
      if (selectedPet?.id && result.prediction) {
        setSaveStatus("saving");
        try {
          await createSkinDiseaseRecord(selectedPet.id, {
            file,
            disease: result.prediction.disease,
            confidence: result.prediction.confidence,
            allProbabilities: result.prediction.all_probabilities,
          });
          setSaveStatus("saved");
        } catch (e) {
          console.error("Failed saving skin disease record:", e);
          setSaveStatus("error");
          setSaveError(
            e instanceof Error ? e.message : "Failed to save scan record",
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze image. Please try again or check your internet connection.",
      );
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    setError(null);
    setPrediction(null);
    setSaveStatus("idle");
    setSaveError(null);

    // Display image preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Make prediction
    setLoading(true);
    try {
      const result = await MLApiService.predictFromFile(file);
      setPrediction(result);

      // If backend says image is invalid / not in-distribution, stop here.
      if (result.valid === false) {
        setLoading(false);
        return;
      }

      // Save scan record to pet history (best-effort) when a pet is selected
      if (selectedPet?.id && result.prediction) {
        setSaveStatus("saving");
        try {
          await createSkinDiseaseRecord(selectedPet.id, {
            file,
            disease: result.prediction.disease,
            confidence: result.prediction.confidence,
            allProbabilities: result.prediction.all_probabilities,
          });
          setSaveStatus("saved");
        } catch (e) {
          console.error("Failed saving skin disease record:", e);
          setSaveStatus("error");
          setSaveError(
            e instanceof Error ? e.message : "Failed to save scan record",
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze image. Please try again or check your internet connection.",
      );
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setPrediction(null);
    setError(null);
    setLoading(false);
    setSaveStatus("idle");
    setSaveError(null);
  };

  const formatDiseaseName = (disease: string) => {
    return disease
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get severity badge styling
  const getSeverityBadge = (severity: "mild" | "severe" | null) => {
    if (!severity) return null;

    const isSevere = severity === "severe";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
          isSevere
            ? "bg-red-100 text-red-800 border border-red-300"
            : "bg-yellow-100 text-yellow-800 border border-yellow-300"
        }`}
      >
        {isSevere ? (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {isSevere ? "Severe" : "Mild"}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header with API Status */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🐕 Dog Skin Disease Detection
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Upload an image or use your camera to detect skin conditions using
              AI-powered analysis
            </p>

            {(selectedPet || onChangePet || onClearPet) && (
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
                    (results will show only the affected photo)
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
            )}

            {!selectedPet && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-900 font-medium">
                  Tip: Register/select your pet to automatically save scan
                  history (date, detected condition, and affected photo) to the
                  pet profile.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div
              className={`w-3 h-3 rounded-full ${
                apiStatus === "online"
                  ? "bg-green-500"
                  : apiStatus === "offline"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {apiStatus === "online"
                ? "API Online"
                : apiStatus === "offline"
                  ? "API Offline"
                  : "Checking..."}
            </span>
          </div>
        </div>
      </div>

      {/* API Offline Warning */}
      {apiStatus === "offline" && (
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3 sm:p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mr-2 sm:mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-orange-800">
                The ML API is currently unavailable. The Hugging Face Space may
                be sleeping.
              </p>
              <button
                onClick={checkApiHealth}
                className="mt-2 text-xs sm:text-sm text-orange-700 hover:text-orange-900 underline"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!selectedImage && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm sm:text-base">Upload Image</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("camera")}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === "camera"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm sm:text-base">Use Camera</span>
              </div>
            </button>
          </div>

          {activeTab === "upload" && (
            <ImageUpload onImageSelect={handleFileUpload} />
          )}
          {activeTab === "camera" && (
            <CameraCapture onCapture={handleCameraCapture} />
          )}
        </div>
      )}

      {/* Results Section */}
      {selectedImage && (
        <div className="space-y-4 sm:space-y-6">
          {/* Invalid Image State (OOD gate) */}
          {prediction?.valid === false && (
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 sm:p-6">
              <div className="flex">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-orange-800">
                    Invalid image
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-700 mt-1 break-words">
                    {prediction.reason ||
                      "This doesn’t look like a dog skin close-up. Please upload a clear photo of the affected skin area."}
                  </p>
                  <div className="mt-2 text-xs text-orange-700">
                    Similarity:{" "}
                    {prediction.similarity != null
                      ? prediction.similarity.toFixed(3)
                      : "—"}
                    {prediction.threshold != null
                      ? ` (threshold ${prediction.threshold.toFixed(3)})`
                      : ""}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs sm:text-sm font-medium text-orange-800 mb-2">
                      Tips:
                    </p>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-orange-700 space-y-1">
                      <li>Use good lighting (no flash)</li>
                      <li>Fill the frame with the affected skin</li>
                      <li>Avoid background objects and human skin</li>
                      <li>Take 2–3 angles and choose the clearest</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    Saving this scan to {selectedPet.name}&apos;s history…
                  </span>
                </div>
              ) : saveStatus === "saved" ? (
                <span>
                  Saved to {selectedPet.name}&apos;s skin disease history.
                </span>
              ) : (
                <div className="space-y-1">
                  <div>
                    Couldn&apos;t save this scan to history (analysis result is
                    still shown).
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

            {/* Affected Photo */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Affected Photo
                </h2>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage}
                  alt="Affected area"
                  className="w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 object-contain rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">
                Analyzing image with AI model...
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Using ViT-B/16 model on Hugging Face Spaces
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 sm:p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-red-800">
                    Analysis Failed
                  </h3>
                  <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                    {error}
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm font-medium text-red-800 mb-2">
                      Possible causes:
                    </p>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-red-700 space-y-1">
                      <li>
                        The Hugging Face Space may be sleeping (first request
                        takes longer)
                      </li>
                      <li>Check your internet connection</li>
                      <li>Try uploading a different image</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Results */}
          {prediction?.prediction && prediction.valid !== false && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 sm:p-6 md:p-8 border border-blue-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Detection Results
              </h2>

              {/* Main Prediction */}
              <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Detected Condition
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 break-words">
                        {prediction.prediction.parsed?.disease ||
                          formatDiseaseName(prediction.prediction.disease)}
                      </p>
                      {prediction.prediction.parsed?.severity &&
                        getSeverityBadge(prediction.prediction.parsed.severity)}
                    </div>
                    {prediction.prediction.parsed?.severity && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Severity Level:{" "}
                        <span className="font-semibold capitalize">
                          {prediction.prediction.parsed.severity}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Confidence Level
                    </p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                      {(prediction.prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${prediction.prediction.confidence * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* All Probabilities */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center text-base sm:text-lg">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  All Detected Probabilities
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(prediction.prediction.all_probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([disease, prob]) => {
                      const parsed = parseDiseaseName(disease);
                      return (
                        <div key={disease} className="group">
                          <div className="flex justify-between items-center mb-1 sm:mb-2 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors break-words">
                                {parsed.disease}
                              </span>
                              {parsed.severity && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                    parsed.severity === "severe"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {parsed.severity}
                                </span>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 sm:h-2.5 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 md:p-5 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <div className="flex">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mr-2 sm:mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">
                      Important Medical Disclaimer
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-700">
                      This AI analysis is for informational purposes only and
                      should not replace professional veterinary diagnosis.
                      Please consult with a qualified veterinarian for proper
                      examination, diagnosis, and treatment of your pet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={reset}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center text-sm sm:text-base cursor-pointer"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="whitespace-nowrap">Analyze Another Image</span>
            </button>

            {prediction && (
              <button
                onClick={() => window.print()}
                className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center text-sm sm:text-base cursor-pointer"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span className="whitespace-nowrap">Print Results</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
