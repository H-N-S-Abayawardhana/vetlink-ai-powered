'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onImageCapture: (file: File) => void;
}

export default function CameraCapture({ onImageCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const startCamera = async () => {
    try {
      setError(null);
      setHasCaptured(false);
      setIsVideoReady(false);
      console.log('🔄 Starting camera...');
      
      // Check if we're in the browser and navigator is available
      if (typeof window === 'undefined') {
        setError('Camera access is not available in this environment.');
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        setError('Camera access requires HTTPS. Please access this page via HTTPS or localhost.');
        return;
      }
      
      console.log('📹 Requesting camera access with constraints:', {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      });
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('✅ Camera access granted:', mediaStream);
      console.log('📊 Stream tracks:', mediaStream.getTracks().map(track => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      setStream(mediaStream);
      setIsCameraOn(true);
      
      // Use a small delay to ensure the video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          console.log('🎥 Setting video srcObject...');
          videoRef.current.srcObject = mediaStream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('🎥 Video metadata loaded, starting playback...');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('✅ Video playback started successfully');
                })
                .catch((error) => {
                  console.error('❌ Video playback failed:', error);
                });
            }
          };

          // Additional event listeners for debugging
          videoRef.current.oncanplay = () => {
            console.log('🎥 Video can start playing');
            setIsVideoReady(true);
          };

          videoRef.current.onplay = () => {
            console.log('🎥 Video started playing');
            setIsVideoReady(true);
          };

          videoRef.current.onerror = (error) => {
            console.error('❌ Video error:', error);
          };

          // Force play after a short delay as fallback
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused) {
              console.log('🔄 Attempting to force video playback...');
              videoRef.current.play()
                .then(() => {
                  console.log('✅ Forced video playback successful');
                })
                .catch((error) => {
                  console.error('❌ Forced video playback failed:', error);
                });
            }
          }, 500);
        } else {
          console.error('❌ Video element not found!');
        }
      }, 100);
    } catch (err: any) {
      console.error('❌ Error accessing camera:', err);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints cannot be satisfied.';
      } else if (err.name === 'SecurityError') {
        errorMessage += 'Camera access blocked due to security restrictions.';
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error occurred'}.`;
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && !isCapturing && !hasCaptured) {
      setIsCapturing(true);
      console.log('📸 Capturing photo...');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            console.log('✅ Photo captured successfully');
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            onImageCapture(file);
            setHasCaptured(true);
            setIsCapturing(false);
            // Automatically stop camera after capture
            setTimeout(() => {
              stopCamera();
            }, 1000); // Small delay to show the capture was successful
          } else {
            console.error('❌ Failed to create blob from canvas');
            setIsCapturing(false);
          }
        }, 'image/jpeg', 0.8);
      } else {
        console.error('❌ Failed to get canvas context');
        setIsCapturing(false);
      }
    }
  };

  const switchCamera = () => {
    if (isCameraOn) {
      stopCamera();
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
      setTimeout(startCamera, 100);
    } else {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Effect to handle video element when stream changes
  useEffect(() => {
    if (stream && videoRef.current && isCameraOn) {
      console.log('🎥 useEffect: Setting up video element with stream');
      videoRef.current.srcObject = stream;
      
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        console.log('🎥 useEffect: Video metadata loaded');
        video.play()
          .then(() => {
            console.log('✅ useEffect: Video playback started');
            setIsVideoReady(true);
          })
          .catch((error) => {
            console.error('❌ useEffect: Video playback failed:', error);
          });
      };

      const handleCanPlay = () => {
        console.log('🎥 useEffect: Video can play');
        setIsVideoReady(true);
      };

      const handlePlay = () => {
        console.log('🎥 useEffect: Video is playing');
        setIsVideoReady(true);
      };

      const handleError = (error: any) => {
        console.error('❌ useEffect: Video error:', error);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [stream, isCameraOn]);

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {isCameraOn ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="w-full h-64 sm:h-80 object-cover bg-gray-800"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
            />
            
            {/* Loading indicator overlay */}
            {!isVideoReady ? (
              <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="animate-spin w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm mb-2">Loading camera...</p>
                  <button
                    onClick={() => {
                      if (videoRef.current && stream) {
                        console.log('🔄 Manual video setup triggered');
                        videoRef.current.srcObject = stream;
                        videoRef.current.play()
                          .then(() => {
                            console.log('✅ Manual video playback successful');
                            setIsVideoReady(true);
                          })
                          .catch((error) => {
                            console.error('❌ Manual video playback failed:', error);
                          });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Force Start Video
                  </button>
                </div>
              </div>
            ) : null}
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={switchCamera}
                disabled={isCapturing || hasCaptured}
                className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Switch Camera"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                onClick={capturePhoto}
                disabled={isCapturing || hasCaptured}
                className={`p-4 rounded-full transition-all shadow-lg ${
                  isCapturing 
                    ? 'bg-yellow-500 animate-pulse' 
                    : hasCaptured 
                      ? 'bg-green-500' 
                      : 'bg-white hover:bg-gray-100'
                }`}
                title={hasCaptured ? "Photo Captured!" : isCapturing ? "Capturing..." : "Capture Photo"}
              >
                <div className={`w-8 h-8 rounded-full ${
                  isCapturing 
                    ? 'bg-yellow-600' 
                    : hasCaptured 
                      ? 'bg-green-600' 
                      : 'bg-red-500'
                }`}></div>
              </button>
              
              <button
                onClick={stopCamera}
                disabled={isCapturing}
                className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Stop Camera"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">Camera Ready</p>
              <p className="text-sm opacity-75">Click to start capturing</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!isCameraOn ? (
          <button
            onClick={startCamera}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            disabled={isCapturing}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Camera
          </button>
        )}
        
        <button
          onClick={switchCamera}
          disabled={isCameraOn && (isCapturing || hasCaptured)}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Switch Camera
        </button>
      </div>

      {/* Status Messages */}
      {isCapturing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="animate-spin w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-yellow-800 font-medium">Capturing photo...</p>
          </div>
        </div>
      )}

      {hasCaptured && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 font-medium">Photo captured successfully! Camera will close automatically.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Camera Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              
              {/* Troubleshooting Steps */}
              <div className="mt-3 text-sm text-red-600">
                <p className="font-medium mb-2">Troubleshooting steps:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure you're using HTTPS or localhost</li>
                  <li>Check if camera permissions are allowed in your browser</li>
                  <li>Ensure no other application is using the camera</li>
                  <li>Try refreshing the page and allowing camera access</li>
                  <li>Check if your browser supports camera access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Camera Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Ensure good lighting for clear images
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Hold the camera steady when capturing
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Focus on the affected skin area
          </li>
        </ul>
      </div>
    </div>
  );
}
