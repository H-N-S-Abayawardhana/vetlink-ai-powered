'use client';
import { useState } from 'react';


interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

const VideoUpload = ({ onVideoSelect }: VideoUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
      <input
        type="file"
        accept="video/mp4,video/quicktime"
        onChange={handleFileChange}
        className="hidden"
        id="video-upload"
      />
      <label htmlFor="video-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Click to upload video
          </p>
          <p className="text-sm text-gray-500">
            MP4 or MOV (Max 100MB)
          </p>
        </div>
      </label>
    </div>
  );
};

interface HealthInfoFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

interface FormData {
  age_years: string;
  age_months: string;
  weight: string;
  bcs: string;
  food_type: string;
  food_brand: string;
  food_amount: string;
  feeding_time: string;
  supplements: string[];
  supplement_details: string;
}

const HealthInfoForm = ({ onSubmit, onCancel }: HealthInfoFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    age_years: '',
    age_months: '',
    weight: '',
    bcs: '',
    food_type: '',
    food_brand: '',
    food_amount: '',
    feeding_time: '',
    supplements: [],
    supplement_details: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSupplementToggle = (supplement: string) => {
    setFormData(prev => ({
      ...prev,
      supplements: prev.supplements.includes(supplement)
        ? prev.supplements.filter(s => s !== supplement)
        : [...prev.supplements, supplement]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-6xl mx-auto my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Pet Health Information</h2>
                <p className="text-blue-100 text-sm">Help us provide better analysis with your pet's details</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pet Age *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      required
                      value={formData.age_years}
                      onChange={(e) => setFormData({...formData, age_years: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Years"
                    />
                    <p className="text-xs text-gray-500">Years old</p>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      required
                      value={formData.age_months}
                      onChange={(e) => setFormData({...formData, age_months: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Months"
                    />
                    <p className="text-xs text-gray-500">Additional months</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Weight *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="200"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="18.5"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">kg</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Body Condition Score (BCS) *
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 cursor-help" title="1-3: Underweight, 4-5: Ideal, 6-7: Overweight, 8-9: Obese">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    What is this?
                  </span>
                </label>
                <select
                  required
                  value={formData.bcs}
                  onChange={(e) => setFormData({...formData, bcs: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                >
                  <option value="">Select BCS (1-9)</option>
                  <option value="1">1 - Severely Underweight</option>
                  <option value="2">2 - Underweight</option>
                  <option value="3">3 - Thin</option>
                  <option value="4">4 - Ideal (Lower)</option>
                  <option value="5">5 - Ideal (Perfect)</option>
                  <option value="6">6 - Slightly Overweight</option>
                  <option value="7">7 - Overweight</option>
                  <option value="8">8 - Obese</option>
                  <option value="9">9 - Severely Obese</option>
                </select>
              </div>

              {/* Supplements Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Current Supplements</h3>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: 'Glucosamine/Joint Support', icon: '🦴' },
                    { name: 'Omega-3 Fish Oil', icon: '🐟' },
                    { name: 'Multivitamin', icon: '💊' },
                    { name: 'Probiotics', icon: '🦠' },
                    { name: 'Calcium', icon: '🦷' },
                    { name: 'Other', icon: '📋' }
                  ].map(({ name, icon }) => (
                    <label key={name} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={formData.supplements.includes(name)}
                        onChange={() => handleSupplementToggle(name)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1">{name}</span>
                    </label>
                  ))}
                </div>

                {formData.supplements.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Supplement Details *
                    </label>
                    <textarea
                      value={formData.supplement_details}
                      onChange={(e) => setFormData({...formData, supplement_details: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                      placeholder="Please provide dosage and frequency for each supplement...&#10;&#10;e.g.,&#10;• Glucosamine 500mg twice daily&#10;• Omega-3 1000mg once daily&#10;• Multivitamin 1 tablet with breakfast"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Food Intake Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Food Intake</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Food Type *
                  </label>
                  <select
                    required
                    value={formData.food_type}
                    onChange={(e) => setFormData({...formData, food_type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="">Select food type</option>
                    <option value="commercial_dry">🥘 Commercial Dry Food</option>
                    <option value="commercial_wet">🥫 Commercial Wet Food</option>
                    <option value="home_cooked">🍳 Home Cooked</option>
                    <option value="raw">🥩 Raw Diet</option>
                    <option value="mixed">🍽️ Mixed Diet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Brand (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.food_brand}
                    onChange={(e) => setFormData({...formData, food_brand: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="e.g., Royal Canin, Hill's, Purina"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Amount *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.food_amount}
                      onChange={(e) => setFormData({...formData, food_amount: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="e.g., 200g or 2 cups"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include measurement unit</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Last Feeding Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.feeding_time}
                      onChange={(e) => setFormData({...formData, feeding_time: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>Continue to Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AnalysisResult {
  petInfo: {
    age: string;
    weight: string;
    bcs: string;
    bcsStatus: string;
  };
  limping: {
    detected: boolean;
    affectedLeg: string;
    symmetryIndex: number;
    severity: string;
  };
  mobility: {
    score: number;
    distance: number;
    velocity: number;
  };
  insights: string[];
}

interface MobilityAnalysisProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  hasVideo: boolean;
}

const MobilityAnalysis = ({ result, isAnalyzing, hasVideo }: MobilityAnalysisProps) => {
  if (!hasVideo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500">Upload a video and provide health information to see analysis results</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-gray-900">Analyzing mobility patterns...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Mobility Analysis Results</h2>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase">Age</p>
            <p className="text-lg font-semibold text-gray-900">{result.petInfo.age}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Weight</p>
            <p className="text-lg font-semibold text-gray-900">{result.petInfo.weight} kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">BCS</p>
            <p className="text-lg font-semibold text-gray-900">{result.petInfo.bcs}/9</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className="text-lg font-semibold text-gray-900">{result.petInfo.bcsStatus}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Limping Detection</h3>
          {result.limping.detected ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">Limping Detected - {result.limping.affectedLeg}</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Symmetry Index: {result.limping.symmetryIndex}% asymmetry
                  </p>
                  <p className="text-sm text-yellow-700">
                    Severity: {result.limping.severity}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-green-800">No limping detected</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Mobility Score</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Mobility</span>
                <span className="text-lg font-bold text-gray-900">{result.mobility.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    result.mobility.score >= 80 ? 'bg-green-500' :
                    result.mobility.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.mobility.score}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Distance Traveled</p>
                <p className="font-semibold text-gray-900">{result.mobility.distance}m</p>
              </div>
              <div>
                <p className="text-gray-500">Average Velocity</p>
                <p className="font-semibold text-gray-900">{result.mobility.velocity} m/s</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights & Recommendations</h3>
          <ul className="space-y-2">
            {result.insights.map((insight: string, index: number) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Download Report
          </button>
          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Share with Vet
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MobilityDetectionPage() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthData, setHealthData] = useState<FormData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleVideoSelect = (file: File) => {
    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setShowHealthForm(true);
    setAnalysisResult(null);
  };

  const handleHealthFormSubmit = async (formData: FormData) => {
    setHealthData(formData);
    setShowHealthForm(false);
    setIsAnalyzing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const bcsValue = parseInt(formData.bcs);
      const bcsStatus = bcsValue <= 3 ? 'Underweight' : 
                        bcsValue <= 5 ? 'Ideal' : 
                        bcsValue <= 7 ? 'Overweight' : 'Obese';

      setAnalysisResult({
        petInfo: {
          age: `${formData.age_years}y ${formData.age_months}m`,
          weight: formData.weight,
          bcs: formData.bcs,
          bcsStatus: bcsStatus
        },
        limping: {
          detected: true,
          affectedLeg: 'Right Hind Leg',
          symmetryIndex: 23,
          severity: 'Mild'
        },
        mobility: {
          score: 85,
          distance: 12.5,
          velocity: 0.85
        },
        insights: [
          `Weight management recommended (BCS ${formData.bcs}/9 - ${bcsStatus})`,
          'Mild limping detected in right hind leg - monitor for changes',
          formData.supplements.includes('Glucosamine/Joint Support') 
            ? 'Continue current joint supplement regimen' 
            : 'Consider adding joint supplements after vet consultation',
          'Schedule veterinary check-up if limping persists beyond 2 weeks',
          'Keep pet at moderate activity level, avoid strenuous exercise'
        ]
      });
    } catch (error) {
      console.error('Analysis failed:', error);
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
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            Pet Mobility & Limping Detection
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload your pet's walking video and provide health information for comprehensive AI-powered mobility analysis
          </p>
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-8 shadow-xl border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Upload & Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
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
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {healthData && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
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

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            <MobilityAnalysis 
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