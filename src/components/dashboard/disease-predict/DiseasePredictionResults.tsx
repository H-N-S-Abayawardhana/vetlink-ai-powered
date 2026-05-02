"use client";

import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Heart,
} from "lucide-react";
import type {
  DiseasePredictionResult,
  DiseaseType,
  RiskLevel,
} from "@/types/disease-prediction";
import { DISEASE_INFO } from "@/types/disease-prediction";

interface DiseasePredictionResultsProps {
  result: DiseasePredictionResult;
  petName?: string;
  onNewAnalysis: () => void;
  onClose: () => void;
}

export default function DiseasePredictionResults({
  result,
  petName,
  onNewAnalysis,
  onClose,
}: DiseasePredictionResultsProps) {
  const [expandedDisease, setExpandedDisease] = React.useState<string | null>(
    null,
  );

  const riskCount = result.predictions.filter(
    (prediction) => prediction.risk_level !== "Low" || prediction.is_positive,
  ).length;

  const getRiskIcon = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case "High":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "Moderate":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "Low":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getRiskBadgeClasses = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case "High":
        return "border-red-200 bg-red-50 text-red-700";
      case "Moderate":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "Low":
        return "border-green-200 bg-green-50 text-green-700";
    }
  };

  const toggleExpand = (disease: string) => {
    setExpandedDisease(expandedDisease === disease ? null : disease);
  };

  const getDiseaseBadge = (disease: string) => {
    switch (disease) {
      case "Diabetes":
        return "DB";
      case "Pancreatitis":
        return "PN";
      case "Hyperlipidemia":
        return "HL";
      case "Urolithiasis":
        return "UR";
      default:
        return "AI";
    }
  };

  const getDiseaseDetails = (disease: DiseaseType) => {
    switch (disease) {
      case "Diabetes":
        return {
          description:
            "Diabetes mellitus affects how the body regulates blood sugar. In dogs, risk can increase with obesity, low activity, and older age.",
          symptoms: [
            "Increased thirst and frequent urination",
            "Increased appetite with weight loss",
            "Low energy/lethargy",
            "Recurrent infections (e.g., urinary tract)",
            "Cloudy eyes/cataracts (sometimes)",
          ],
          whatToDo: [
            "Contact a veterinarian for confirmation (blood glucose and urine tests)",
            "Follow a vet-guided feeding plan and weight management",
            "If diagnosed: follow prescribed insulin and home monitoring plan",
            "Seek urgent care if vomiting, severe lethargy, or dehydration occurs",
          ],
        };
      case "Pancreatitis":
        return {
          description:
            "Pancreatitis is inflammation of the pancreas and can range from mild to life-threatening. It is often associated with high-fat meals and obesity.",
          symptoms: [
            "Vomiting and nausea",
            "Abdominal pain (hunched posture, discomfort when touched)",
            "Loss of appetite",
            "Diarrhea",
            "Lethargy and dehydration",
          ],
          whatToDo: [
            "Avoid fatty foods and table scraps; use vet-approved diets",
            "See a veterinarian for evaluation (exam and blood tests)",
            "If severe vomiting, pain, or weakness: seek urgent care",
            "Only give medications as prescribed (some drugs can worsen GI issues)",
          ],
        };
      case "Hyperlipidemia":
        return {
          description:
            "Hyperlipidemia means elevated fats (lipids) in the blood. It can be influenced by diet and weight, and may be associated with other conditions.",
          symptoms: [
            "Often no obvious signs (found on blood tests)",
            "Digestive upset (vomiting/diarrhea) in some cases",
            "Lethargy",
            "Possible pancreatitis episodes (related)",
          ],
          whatToDo: [
            "Discuss a fasting lipid profile with your veterinarian",
            "Start a vet-guided weight management and low-fat feeding plan",
            "Check for underlying causes (e.g., endocrine disease) if recommended",
            "Re-test lipids to track response to diet and lifestyle changes",
          ],
        };
      case "Urolithiasis":
        return {
          description:
            "Urolithiasis refers to urinary stones, which can irritate the urinary tract or cause blockage. Hydration and urinary habits can affect risk.",
          symptoms: [
            "Frequent urination or straining",
            "Blood in urine",
            "Accidents in the house",
            "Pain or discomfort while urinating",
            "Inability to urinate (emergency)",
          ],
          whatToDo: [
            "Encourage water intake; follow vet advice on diet and urinary health",
            "See a veterinarian for urinalysis and imaging if symptoms appear",
            "Treat urinary blockage as an emergency (immediate vet care)",
            "Follow prevention plans if stones were diagnosed previously",
          ],
        };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-5 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Assessment results
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Disease Risk Analysis Complete
              </h2>
              <p className="text-sm text-gray-500">
                {petName
                  ? `Results for ${petName}`
                  : "Multi-disease risk assessment results"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <div
          className={`rounded-lg border p-5 ${
            result.has_risk
              ? "border-red-200 bg-red-50/70"
              : "border-green-200 bg-green-50/70"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div
              className={`space-y-2 ${
                result.has_risk ? "" : "flex flex-col items-center text-center"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  result.has_risk ? "" : "justify-center"
                }`}
              >
                {result.has_risk ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <Heart className="w-5 h-5 text-green-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {result.has_risk
                    ? "Health Risks Detected"
                    : "No Significant Risks"}
                </h3>
              </div>
              {result.highest_risk_disease && result.has_risk && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Highest concern:</span>{" "}
                  <span className="font-semibold text-red-700">
                    {result.highest_risk_disease}
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:min-w-[320px]">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  Age group
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {result.pet_profile.age_group}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  Weight status
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {result.pet_profile.weight_status}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  {result.has_risk ? "Diseases at risk" : "Status"}
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    result.has_risk ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {result.has_risk ? riskCount : "Good"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Disease risk assessment
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {result.predictions.length} conditions analyzed.
            </p>
          </div>

          <div className="space-y-3">
            {result.predictions.map((prediction) => {
              const diseaseInfo = DISEASE_INFO[prediction.disease];
              const isExpanded = expandedDisease === prediction.disease;
              const isPositive = prediction.is_positive;

              return (
                <div
                  key={prediction.disease}
                  className={`rounded-lg border overflow-hidden transition-colors ${
                    isPositive
                      ? "border-red-200"
                      : "border-gray-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(prediction.disease)}
                    className={`w-full px-4 py-4 text-left transition-colors cursor-pointer ${
                      isPositive
                        ? "bg-red-50/60 hover:bg-red-50"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                            diseaseInfo?.color?.bg ?? "bg-gray-50"
                          } ${diseaseInfo?.color?.border ?? "border-gray-200"}`}
                        >
                          <span
                            className={`text-sm font-semibold ${
                              diseaseInfo?.color?.text ?? "text-gray-700"
                            }`}
                          >
                            {getDiseaseBadge(prediction.disease)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {prediction.disease}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {diseaseInfo?.description || ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <div className="min-w-[84px] text-left lg:text-right">
                          <p className="text-2xl font-semibold text-gray-900">
                            {prediction.probability.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            probability
                          </p>
                        </div>

                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${getRiskBadgeClasses(prediction.risk_level)}`}
                        >
                          {getRiskIcon(prediction.risk_level)}
                          {prediction.risk_level}
                        </div>

                        {isPositive && (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
                            Positive
                          </span>
                        )}

                        <span className="text-xs text-gray-500">
                          {isExpanded ? "Hide details" : "View details"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white p-4">
                      {(() => {
                        const details = getDiseaseDetails(prediction.disease);
                        return (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                About {prediction.disease}
                              </p>
                              <p className="mt-2 text-sm text-gray-600">
                                {details.description}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Common symptoms
                              </p>
                              <ul className="mt-2 space-y-2">
                                {details.symptoms.map((s, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                What to do if suspected/affected
                              </p>
                              <ul className="mt-2 space-y-2">
                                {details.whatToDo.map((a, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    <span>{a}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <span className="font-medium">Important:</span> This AI analysis
              is for informational purposes only and should not replace
              professional veterinary diagnosis. Please consult a licensed
              veterinarian for proper medical evaluation and treatment.
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 border-t border-gray-200 pt-5">
          <button
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to pet selection
          </button>
          <button
            onClick={onNewAnalysis}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New analysis
          </button>
        </div>
      </div>
    </div>
  );
}
