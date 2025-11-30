'use client';

import { useState } from 'react';
import MLApiService, { PredictionResult } from '@/services/mlApi';
import ImageUpload from './ImageUpload';
import CameraCapture from './CameraCapture';

export default function SkinAnalysis() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');

  const handleFileUpload = async (file: File) => {
    setError(null);
    setPrediction(null);

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
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to analyze image. Please ensure the backend server is running at http://localhost:5000'
      );
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    setError(null);
    setPrediction(null);

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
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to analyze image. Please ensure the backend server is running at http://localhost:5000'
      );
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setPrediction(null);
    setError(null);
    setLoading(false);
  };

  // Format disease name for display
  const formatDiseaseName = (disease: string) => {
    return disease
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🐕 Dog Skin Disease Detection
        </h1>
        <p className="text-gray-600">
          Upload an image or use your camera to detect skin conditions using AI-powered analysis
        </p>
      </div>

      {/* Tabs */}
      {!selectedImage && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex space-x-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Image
              </div>
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'camera'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use Camera
              </div>
            </button>
          </div>

          {activeTab === 'upload' && <ImageUpload onImageSelect={handleFileUpload} />}
          {activeTab === 'camera' && <CameraCapture onCapture={handleCameraCapture} />}
        </div>
      )}

      {/* Results Section */}
      {selectedImage && (
        <div className="space-y-6">
          {/* Image Preview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Analyzed Image</h2>
            </div>
            <div className="p-6">
              <img
                src={selectedImage}
                alt="Analyzed"
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium text-lg">
                Analyzing image with AI model...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                DINOv2 + ViT is processing your image
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-400"
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
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Analysis Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-800 mb-2">Troubleshooting:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      <li>Make sure the backend server is running (python app.py)</li>
                      <li>Check that it's accessible at http://localhost:5000</li>
                      <li>Verify the model loaded successfully in the backend</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Results */}
          {prediction && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Detection Results
              </h2>

              {/* Main Prediction */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Detected Condition</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatDiseaseName(prediction.prediction.disease)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-2">Confidence Level</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {(prediction.prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${prediction.prediction.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* All Probabilities */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center text-lg">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
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
                <div className="space-y-3">
                  {Object.entries(prediction.prediction.all_probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([disease, prob]) => (
                      <div key={disease} className="group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {formatDiseaseName(disease)}
                          </span>
                          <span className="text-sm font-semibold text-gray-600">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-5 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <div className="flex">
                  <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                      Important Medical Disclaimer
                    </p>
                    <p className="text-sm text-yellow-700">
                      This AI analysis is for informational purposes only and should not replace professional veterinary diagnosis. 
                      Please consult with a qualified veterinarian for proper examination, diagnosis, and treatment of your pet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Analyze Another Image
            </button>
            
            {prediction && (
              <button
                onClick={() => window.print()}
                className="px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Results
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}