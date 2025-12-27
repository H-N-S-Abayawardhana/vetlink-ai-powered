'use client';

import React from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Heart,
  Shield,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import type {
  DiseasePredictionResult,
  SingleDiseasePrediction,
  RiskLevel,
  DiseaseType,
} from '@/types/disease-prediction';
import { DISEASE_INFO, RISK_LEVEL_STYLES, RISK_LEVEL_EMOJI } from '@/types/disease-prediction';

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
  const [expandedDisease, setExpandedDisease] = React.useState<string | null>(null);

  const getRiskIcon = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'High':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'Moderate':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getProgressBarColor = (probability: number) => {
    if (probability >= 60) return 'bg-red-500';
    if (probability >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const toggleExpand = (disease: string) => {
    setExpandedDisease(expandedDisease === disease ? null : disease);
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6): number => {
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
    doc.setFillColor(124, 58, 237); // Purple
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VetLink Disease Risk Report', margin, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${petName ? `Pet: ${petName}` : 'Multi-Disease Risk Assessment'}`, margin, 30);
    doc.text(`Generated: ${new Date(result.analyzed_at).toLocaleString()}`, margin, 38);

    yPos = 55;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Pet Profile Section
    doc.setFillColor(245, 243, 255); // Light purple background
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(88, 28, 135); // Purple text
    doc.text('Pet Profile', margin + 5, yPos + 10);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Age Group: ${result.pet_profile.age_group}`, margin + 5, yPos + 20);
    doc.text(`Weight Status: ${result.pet_profile.weight_status}`, margin + 70, yPos + 20);
    doc.text(`Risk Factors: ${result.pet_profile.risk_factors_count}`, margin + 140, yPos + 20);
    
    yPos += 45;

    // Overall Assessment Section
    const hasHighRisk = result.has_risk && result.highest_risk_disease;
    const assessmentBgColor = hasHighRisk ? [254, 226, 226] : [220, 252, 231];
    doc.setFillColor(assessmentBgColor[0], assessmentBgColor[1], assessmentBgColor[2]); // Red or green background
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const assessmentTextColor = hasHighRisk ? [153, 27, 27] : [21, 128, 61];
    doc.setTextColor(assessmentTextColor[0], assessmentTextColor[1], assessmentTextColor[2]);
    doc.text('Overall Assessment', margin + 5, yPos + 10);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const assessmentText = hasHighRisk 
      ? `⚠️ Risk Detected - Highest Risk: ${result.highest_risk_disease}`
      : '✓ No Significant Disease Risks Detected';
    doc.text(assessmentText, margin + 5, yPos + 22);
    
    yPos += 40;

    // Disease Predictions Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Disease Risk Analysis', margin, yPos);
    yPos += 10;

    result.predictions.forEach((prediction) => {
      checkNewPage(35);
      
      // Disease box
      const isPositive = prediction.is_positive && prediction.disease !== 'Healthy';
      const bgColor = isPositive 
        ? (prediction.risk_level === 'High' ? [254, 226, 226] : [254, 243, 199])
        : [240, 253, 244];
      
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 2, 2, 'F');
      
      // Disease name
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(prediction.disease, margin + 5, yPos + 8);
      
      // Risk level badge
      const riskColors: Record<RiskLevel, number[]> = {
        'High': [220, 38, 38],
        'Moderate': [202, 138, 4],
        'Low': [22, 163, 74]
      };
      const riskColor = riskColors[prediction.risk_level];
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.setFontSize(10);
      doc.text(`${prediction.risk_level} Risk`, margin + 100, yPos + 8);
      
      // Probability
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`Probability: ${prediction.probability.toFixed(1)}%`, margin + 5, yPos + 18);
      
      // Status
      doc.setTextColor(isPositive ? 220 : 22, isPositive ? 38 : 163, isPositive ? 38 : 74);
      doc.text(`Status: ${isPositive ? 'POSITIVE' : 'Negative'}`, margin + 70, yPos + 18);
      
      // Progress bar background
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(margin + 130, yPos + 14, 40, 5, 1, 1, 'F');
      
      // Progress bar fill
      const barWidth = (prediction.probability / 100) * 40;
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.roundedRect(margin + 130, yPos + 14, barWidth, 5, 1, 1, 'F');
      
      yPos += 32;
    });

    // Recommendations Section
    checkNewPage(50);
    yPos += 5;
    
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10 + result.recommendations.length * 8, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('Recommendations', margin + 5, yPos + 8);
    
    yPos += 14;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    result.recommendations.forEach((rec, index) => {
      checkNewPage(10);
      const bulletText = `${index + 1}. ${rec}`;
      yPos = addWrappedText(bulletText, margin + 5, yPos, pageWidth - 2 * margin - 10, 5);
      yPos += 2;
    });

    // Footer
    yPos = pageHeight - 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');
    doc.text('This report is generated by VetLink AI Disease Prediction System.', margin, yPos + 8);
    doc.text('Please consult a veterinarian for professional medical advice.', margin, yPos + 14);
    
    // VetLink branding
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('VetLink', pageWidth - margin - 20, yPos + 11);

    // Save the PDF
    doc.save(`disease-report-${petName || 'pet'}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                🔬 Disease Risk Analysis Complete
              </h2>
              <p className="text-purple-100 text-sm">
                {petName ? `Results for ${petName}` : 'Multi-disease risk assessment results'}
              </p>
            </div>
          </div>
          <p className="text-white/80 text-sm">
            {new Date(result.analyzed_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Summary */}
        <div className={`p-6 rounded-xl border-2 ${
          result.has_risk
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {result.has_risk ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <Heart className="w-6 h-6 text-green-600" />
                )}
                <h3 className="text-xl font-bold text-gray-900">
                  {result.has_risk ? 'Health Risks Detected' : 'No Significant Risks'}
                </h3>
              </div>
              {result.highest_risk_disease && result.has_risk && (
                <p className="text-gray-700">
                  <span className="font-semibold">Highest concern:</span>{' '}
                  <span className="text-red-700 font-bold">{result.highest_risk_disease}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Age Group</p>
                  <p className="font-bold text-gray-900">{result.pet_profile.age_group}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Weight Status</p>
                  <p className="font-bold text-gray-900">{result.pet_profile.weight_status}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Risk Factors</p>
                  <p className={`font-bold ${
                    result.pet_profile.risk_factors_count >= 5
                      ? 'text-red-600'
                      : result.pet_profile.risk_factors_count >= 3
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}>
                    {result.pet_profile.risk_factors_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disease Predictions Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            📊 Disease Risk Assessment ({result.predictions.length} conditions analyzed)
          </h3>

          <div className="space-y-3">
            {result.predictions.map((prediction) => {
              const diseaseInfo = DISEASE_INFO[prediction.disease];
              const riskStyles = RISK_LEVEL_STYLES[prediction.risk_level];
              const isExpanded = expandedDisease === prediction.disease;

              return (
                <div
                  key={prediction.disease}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    prediction.is_positive && prediction.disease !== 'Healthy'
                      ? riskStyles.border
                      : 'border-gray-200'
                  }`}
                >
                  {/* Disease Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(prediction.disease)}
                    className={`w-full p-4 flex items-center justify-between ${
                      prediction.is_positive && prediction.disease !== 'Healthy'
                        ? riskStyles.bg
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{diseaseInfo?.icon || '🔬'}</span>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">{prediction.disease}</p>
                        <p className="text-sm text-gray-600">{diseaseInfo?.description || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Probability */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {prediction.probability.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">probability</p>
                      </div>

                      {/* Risk Badge */}
                      <div className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${
                        riskStyles.bg} ${riskStyles.text}`}>
                        <span>{RISK_LEVEL_EMOJI[prediction.risk_level]}</span>
                        <span>{prediction.risk_level}</span>
                      </div>

                      {/* Status Badge */}
                      {prediction.is_positive && prediction.disease !== 'Healthy' && (
                        <span className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-sm">
                          POSITIVE
                        </span>
                      )}

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 bg-white">
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Risk Probability</span>
                          <span className="font-semibold">{prediction.probability.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressBarColor(prediction.probability)}`}
                            style={{ width: `${prediction.probability}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Low (0-30%)</span>
                          <span>Moderate (30-60%)</span>
                          <span>High (60-100%)</span>
                        </div>
                      </div>

                      {/* Key Indicators */}
                      {prediction.key_indicators.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Key Risk Indicators:
                          </p>
                          <ul className="space-y-1">
                            {prediction.key_indicators.map((indicator, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                {indicator}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            💡 Veterinary Recommendations
          </h3>
          <ul className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Important Disclaimer:</strong> This AI-powered analysis is for informational purposes only 
              and should not replace professional veterinary diagnosis. Please consult a licensed veterinarian 
              for proper medical evaluation and treatment.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
          <button
            onClick={onNewAnalysis}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
