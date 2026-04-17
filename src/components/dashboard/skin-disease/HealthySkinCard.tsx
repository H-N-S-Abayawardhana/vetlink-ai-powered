"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";

export interface HealthySkinCardRef {
  getContent: () => { fullText: string };
}

const HealthySkinCard = forwardRef<HealthySkinCardRef>((props, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [fullText, setFullText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateHealthyTips = async () => {
    if (content) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setIsExpanded(true);

    try {
      const response = await fetch("/api/skin-disease/guidance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disease_name: "healthy",
          disease_stage: "Mild",
          card_type: "care_tips",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate tips");
      }

      const data = await response.json();
      const generatedText = data.guidance;
      setFullText(generatedText);

      // Simulate typing effect
      let currentIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        if (currentIndex < generatedText.length) {
          setContent(generatedText.substring(0, currentIndex + 1));
          currentIndex += 1;
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsLoading(false);
        }
      }, 20);
    } catch (err) {
      setIsLoading(false);
      setHasError(true);
      console.error("Error generating healthy tips:", err);
    }
  };

  useImperativeHandle(ref, () => ({
    getContent: () => {
      return { fullText };
    },
  }));

  return (
    <div className="mt-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-600"
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
        Healthy Skin Care
      </h3>

      <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h4 className="font-semibold text-gray-800 text-base sm:text-lg">
                How to Keep Your Dog&apos;s Skin Healthy
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                        typingIntervalRef.current = null;
                      }
                      setIsLoading(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1.5 shadow-sm z-10 cursor-pointer"
                    aria-label="Stop generation"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                    Stop
                  </button>
                </div>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {!content && !isLoading && (
            <button
              onClick={generateHealthyTips}
              className="w-full bg-green-50 hover:bg-green-100 rounded-lg p-4 sm:p-6 border-2 border-green-200 hover:border-green-300 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800 mb-1">
                    Click to get healthy skin care tips
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Learn how to maintain your dog&apos;s healthy skin
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          )}

          {isExpanded && (
            <div className="relative min-h-[60px]">
              {hasError ? (
                <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">
                    Failed to load tips. Please try again.
                  </p>
                </div>
              ) : (
                content && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {content}
                      {isLoading && (
                        <span className="inline-block w-2 h-4 bg-green-600 ml-1 animate-pulse" />
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

HealthySkinCard.displayName = "HealthySkinCard";

export default HealthySkinCard;
