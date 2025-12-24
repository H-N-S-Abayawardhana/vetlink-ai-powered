'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Video, Activity, AlertCircle, CheckCircle, Download, Share2, FileText, X, Info } from 'lucide-react';

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

interface DiseaseRisk {
  disease: string;
  probability: number;
  adjusted_probability: number;
  risk_level: 'High' | 'Medium' | 'Low';
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
    all_disease_risks: DiseaseRisk[];
    symptom_severity: number;
    pain_severity: number;
    mobility_status: string;
    recommendations: string[];
  };
}

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

interface HealthInfoFormProps {
  onSubmit: (formData: HealthFormData) => void;
  onCancel: () => void;
  limpingResult?: {
    class: 'Normal' | 'Limping';
    confidence: number;
  } | null;
}

interface DiseaseAnalysisProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  hasVideo: boolean;
}

type RiskLevel = 'High' | 'Medium' | 'Low';
type DiseaseName = 'Normal' | 'Osteoarthritis' | 'Hip Dysplasia' | 'IVDD' | 'Patellar Luxation';

const VideoUpload = ({ onVideoSelect }: VideoUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-all duration-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileChange}
        className="hidden"
        id="video-upload"
      />
      <label htmlFor="video-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">
            📹 Click to upload video
          </p>
          <p className="text-sm text-gray-600 mb-1">
            MP4, MOV or WebM (Max 100MB)
          </p>
          <p className="text-xs text-gray-500">
            Record 30-60 seconds of natural walking
          </p>
        </div>
      </label>
    </div>
  );
};

const HealthInfoForm = ({ onSubmit, onCancel, limpingResult }: HealthInfoFormProps) => {
  const [formData, setFormData] = useState<HealthFormData>({
    age_years: '',
    weight_category: '',
    limping_detected: '',
    pain_while_walking: '',
    difficulty_standing: '',
    reduced_activity: '',
    joint_swelling: ''
  });

  // Update limping_detected when limpingResult is available
  useEffect(() => {
    if (limpingResult?.class) {
      setFormData(prev => ({
        ...prev,
        limping_detected: limpingResult.class === 'Limping' ? '1' : '0'
      }));
    }
  }, [limpingResult]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const allFilled = Object.values(formData).every(val => val !== '');
    if (!allFilled) {
      alert('Please fill all required fields');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">🐕 Dog Health Information</h2>
                <p className="text-blue-100 text-sm">Required information for disease prediction</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                
                
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1️⃣ Age *
              </label>
              <input
                type="number"
                min="1"
                max="15"
                required
                value={formData.age_years}
                onChange={(e) => setFormData({...formData, age_years: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter age in years (1-15)"
              />
              <p className="text-xs text-gray-500 mt-1">Example: 8 (for 8 years old)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2️⃣ Weight Category*
              </label>
              <select
                required
                value={formData.weight_category}
                onChange={(e) => setFormData({...formData, weight_category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Select weight category</option>
                <option value="Light">🐕 Light (Small dogs, &lt;10kg)</option>
                <option value="Medium">🐕 Medium (10-25kg)</option>
                <option value="Heavy">🐕 Heavy (Large dogs, &gt;25kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                3️⃣ Limping Detected*
                {limpingResult && (
                  <span className={`ml-2 text-xs font-normal ${
                    limpingResult.class === 'Limping' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    (Video analysis: {limpingResult.class})
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, limping_detected: '1'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.limping_detected === '1'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✅ Yes (1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, limping_detected: '0'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.limping_detected === '0'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❌ No (0)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                4️⃣ Pain While Walking*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, pain_while_walking: '1'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.pain_while_walking === '1'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✅ Yes (1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, pain_while_walking: '0'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.pain_while_walking === '0'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❌ No (0)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                5️⃣ Difficulty Standing*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, difficulty_standing: '1'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.difficulty_standing === '1'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✅ Yes (1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, difficulty_standing: '0'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.difficulty_standing === '0'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❌ No (0)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                6️⃣ Reduced Activity*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, reduced_activity: '1'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.reduced_activity === '1'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✅ Yes (1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, reduced_activity: '0'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.reduced_activity === '0'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❌ No (0)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                7️⃣ Joint Swelling*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, joint_swelling: '1'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.joint_swelling === '1'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✅ Yes (1)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, joint_swelling: '0'})}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.joint_swelling === '0'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❌ No (0)
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg"
            >
              🔬 Analyze & Predict Disease
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DiseaseAnalysis = ({ result, isAnalyzing, hasVideo }: DiseaseAnalysisProps) => {
  if (!hasVideo) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg">Upload a video and provide health information</p>
        <p className="text-gray-500 text-sm mt-2">to see AI-powered disease prediction</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-semibold text-gray-900 mb-2">🔬 Analyzing Dog Health...</p>
          <p className="text-gray-600">Processing symptoms & predicting disease</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getRiskColor = (risk: RiskLevel) => {
    if (risk === 'High') return 'text-red-600 bg-red-50 border-red-200';
    if (risk === 'Medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskEmoji = (risk: RiskLevel) => {
    if (risk === 'High') return '🔴';
    if (risk === 'Medium') return '🟡';
    return '🟢';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-5">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-7 h-7" />
          Disease Prediction Results
        </h2>
        <p className="text-indigo-100 text-sm mt-1"></p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                🎯 Primary Diagnosis
              </p>
              <h3 className="text-3xl font-bold text-gray-900">{result.prediction.primary_disease}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Confidence</p>
              <p className="text-3xl font-bold text-indigo-600">{result.prediction.confidence}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-200">
            <div>
              <p className="text-xs text-gray-600 uppercase">Age Group</p>
              <p className="text-lg font-semibold text-gray-900">{result.dogInfo.age_group}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Weight</p>
              <p className="text-lg font-semibold text-gray-900">{result.dogInfo.weight_category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Risk Profile</p>
              <p className={`text-lg font-semibold ${result.prediction.risk_profile === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                {result.prediction.risk_profile}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            📊 All Disease Risk Assessment
          </h3>
          <div className="space-y-3">
            {result.prediction.all_disease_risks.map((disease: DiseaseRisk, idx: number) => (
              <div key={idx} className={`border-2 rounded-xl p-4 ${getRiskColor(disease.risk_level)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getRiskEmoji(disease.risk_level)}</span>
                    <div>
                      <p className="font-bold text-gray-900">{disease.disease}</p>
                      <p className="text-sm">
                        {disease.probability.toFixed(1)}% → {disease.adjusted_probability.toFixed(1)}% (adjusted)
                      </p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-bold ${
                    disease.risk_level === 'High' ? 'bg-red-500 text-white' :
                    disease.risk_level === 'Medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {disease.risk_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            ⚠️ Clinical Indicators
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Symptom Severity</p>
              <p className="text-2xl font-bold text-gray-900">{result.prediction.symptom_severity}/4</p>
            </div>
            <div>
              <p className="text-gray-600">Pain Severity</p>
              <p className="text-2xl font-bold text-gray-900">{result.prediction.pain_severity}/4</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-gray-600">Mobility Status</p>
            <p className={`text-lg font-bold ${result.prediction.mobility_status === 'Impaired' ? 'text-red-600' : 'text-green-600'}`}>
              {result.prediction.mobility_status}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            💡 Veterinary Recommendations
          </h3>
          <ul className="space-y-3">
            {result.prediction.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Download Report
          </button>
          <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            Share with Vet
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function for recommendations
const getRecommendations = (disease: string, symptom_score: number, age: number): string[] => {
  const recs: Record<DiseaseName, string[]> = {
    "Normal": [
      "✅ Dog appears healthy",
      "📊 Continue regular check-ups",
      "🏃 Maintain active lifestyle",
      "⚖️ Monitor weight and activity levels"
    ],
    "Osteoarthritis": symptom_score >= 3 ? [
      "⚠️ Multiple severe symptoms - Urgent attention needed",
      "🏥 Immediate veterinary consultation required",
      "💊 Pain management medication likely needed",
      "🏃 Restrict high-impact activities (running, jumping)",
      "🦴 Start joint supplements (Glucosamine, Chondroitin)",
      "🏊 Consider hydrotherapy/swimming therapy",
      "⚖️ Weight management is critical"
    ] : [
      "📅 Schedule vet check-up within 2 weeks",
      "🚶 Moderate exercise, avoid over-exertion",
      "🦴 Consider joint support supplements",
      "⚖️ Monitor weight closely"
    ],
    "Hip Dysplasia": [
      "🏥 Orthopedic evaluation recommended",
      "📸 X-ray imaging may be necessary",
      "💊 Anti-inflammatory medication",
      "⚖️ Weight reduction if overweight",
      "🏋️ Physical therapy exercises",
      "🦴 Joint supplements recommended"
    ],
    "IVDD": [
      "🚨 URGENT: Immediate vet visit required",
      "🛑 Strict rest - limit all movement",
      "💊 Pain medication essential",
      "📸 MRI/X-ray may be necessary",
      "⚠️ Avoid jumping and stairs completely"
    ],
    "Patellar Luxation": [
      "🏥 Orthopedic surgery consultation",
      "📸 X-rays to assess severity",
      "🛑 Limit physical activity",
      "💊 Pain management",
      "🦴 Joint supplements may help"
    ]
  };
  
  let recommendations = recs[disease as DiseaseName] || recs["Normal"];
  
  if (age > 12) {
    recommendations.push("👴 Senior dog care: More frequent vet visits recommended");
  } else if (age < 3) {
    recommendations.push("🐶 Young dog: Growth monitoring important");
  }
  
  return recommendations;
};

export default function MobilityDetectionPage() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthData, setHealthData] = useState<HealthFormData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [limpingResult, setLimpingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoSelect = async (file: File) => {
    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setAnalysisResult(null);
    setError(null);
    setLimpingResult(null);
    
    // Automatically analyze video for limping detection
    setIsAnalyzingVideo(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/limping/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setLimpingResult(data.result);
      
      // Auto-fill limping_detected based on result
      // Show form after video analysis
      setShowHealthForm(true);
    } catch (err) {
      console.error('Video analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
      // Still show form so user can manually enter data
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

    try {
      // Use limping result from video analysis if available, otherwise use form value
      const limpingDetected = limpingResult?.class === 'Limping' ? '1' : 
                              limpingResult?.class === 'Normal' ? '0' : 
                              formData.limping_detected;

      const response = await fetch('/api/disease/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limping_detected: limpingDetected,
          age_years: formData.age_years,
          weight_category: formData.weight_category,
          pain_while_walking: formData.pain_while_walking,
          difficulty_standing: formData.difficulty_standing,
          reduced_activity: formData.reduced_activity,
          joint_swelling: formData.joint_swelling,
          limping_analysis_result: limpingResult, // Include video analysis results
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to predict disease');
      }

      const data = await response.json();
      
      // Transform API response to match component interface
      const age = parseInt(formData.age_years);
      let age_group;
      if (age <= 3) age_group = 'Puppy (0-3y)';
      else if (age <= 7) age_group = 'Adult (4-7y)';
      else if (age <= 11) age_group = 'Senior (8-11y)';
      else age_group = 'Geriatric (12+y)';

      // For now, we'll create a simplified all_disease_risks array
      // In a full implementation, the API should return all disease risks
      const all_disease_risks: DiseaseRisk[] = [
        {
          disease: data.prediction.predicted_disease,
          probability: data.prediction.confidence,
          adjusted_probability: data.prediction.confidence,
          risk_level: data.prediction.risk_level,
        },
      ];

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
          all_disease_risks: all_disease_risks,
          symptom_severity: data.prediction.symptom_score,
          pain_severity: data.prediction.pain_severity,
          mobility_status: data.prediction.mobility_status,
          recommendations: data.prediction.recommendations,
        },
      };

      setAnalysisResult(result);
    } catch (err) {
      console.error('Disease prediction failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to predict disease');
      alert(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setShowHealthForm(false);
    setHealthData(null);
    setAnalysisResult(null);
    setLimpingResult(null);
    setError(null);
    setIsAnalyzing(false);
    setIsAnalyzingVideo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mb-6 shadow-lg">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            🐕 Pet Mobility & Disease Detection
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload your pet's walking video and provide health information for AI-powered disease prediction
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-8 shadow-xl border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-3">📹 Video Recording Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>Record 30-60 seconds of natural walking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>Ensure good lighting and clear leg visibility</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>Film from the side for full gait cycle</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>Keep camera steady at pet height level</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showHealthForm && (
          <HealthInfoForm 
            onSubmit={handleHealthFormSubmit}
            onCancel={() => setShowHealthForm(false)}
            limpingResult={limpingResult}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Upload className="w-6 h-6 mr-3" />
                  Upload Pet Video
                </h3>
              </div>
              <div className="p-6">
                <VideoUpload onVideoSelect={handleVideoSelect} />
              </div>
            </div>

            {videoPreview && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <Video className="w-6 h-6 mr-3" />
                    Video Preview
                  </h3>
                </div>
                <div className="p-6">
                  <div className="relative group">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full rounded-xl border border-gray-200 shadow-sm"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {isAnalyzingVideo && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                        <p className="text-blue-800 font-medium">Analyzing video for limping detection...</p>
                      </div>
                    </div>
                  )}

                  {limpingResult && !isAnalyzingVideo && (
                    <div className={`mt-6 p-4 rounded-xl border-2 ${
                      limpingResult.class === 'Limping' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold text-lg ${
                            limpingResult.class === 'Limping' ? 'text-red-800' : 'text-green-800'
                          }`}>
                            {limpingResult.class === 'Limping' ? '⚠️ Limping Detected' : '✅ Normal Gait'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Confidence: {limpingResult.confidence?.toFixed(1)}% | 
                            SI Overall: {limpingResult.SI_overall?.toFixed(1)}%
                          </p>
                        </div>
                        <CheckCircle className={`w-6 h-6 ${
                          limpingResult.class === 'Limping' ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {healthData && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">Health Information Complete</p>
                          <p className="text-sm text-green-700">Ready for analysis</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <DiseaseAnalysis 
              result={analysisResult}
              isAnalyzing={isAnalyzing}
              hasVideo={!!videoPreview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}