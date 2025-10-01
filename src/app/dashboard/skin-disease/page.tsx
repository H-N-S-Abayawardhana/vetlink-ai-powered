'use client';

import { useState } from 'react';
import ImageUpload from '@/components/dashboard/skin-disease/ImageUpload';
import CameraCapture from '@/components/dashboard/skin-disease/CameraCapture';
import SkinAnalysis from '@/components/dashboard/skin-disease/SkinAnalysis';
import Instructions from '@/components/dashboard/skin-disease/Instructions';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

export default function SkinDiseaseDetectionPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate API call - replace with actual analysis logic
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock analysis result
      setAnalysisResult({
        confidence: 85,
        condition: 'Possible Dermatitis',
        description: 'The image shows signs of skin irritation that may indicate dermatitis. Please consult with a veterinarian for proper diagnosis and treatment.',
        recommendations: [
          'Keep the affected area clean and dry',
          'Avoid scratching or rubbing the area',
          'Monitor for any changes in the condition',
          'Schedule a veterinary appointment for proper diagnosis'
        ],
        severity: 'moderate'
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Skin Disease Detection
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload or capture an image of your pet's skin for AI-powered analysis
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <Instructions />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Input */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                      activeTab === 'upload'
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Image
                  </button>
                  <button
                    onClick={() => setActiveTab('camera')}
                    className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                      activeTab === 'camera'
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'upload' ? (
                  <ImageUpload onImageSelect={handleImageSelect} />
                ) : (
                  <CameraCapture onImageCapture={handleImageSelect} />
                )}
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Image Preview</h3>
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Selected skin image"
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analyze Image
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Analysis Results */}
          <div>
            <SkinAnalysis 
              result={analysisResult} 
              isAnalyzing={isAnalyzing}
              hasImage={!!imagePreview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
