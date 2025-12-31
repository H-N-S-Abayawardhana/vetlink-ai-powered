"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";

interface AIGuidanceCardsProps {
  diseaseName: string;
  diseaseStage: "Mild" | "Severe" | null;
}

export interface AIGuidanceCardsRef {
  getCardContents: () => Record<string, { fullText: string }>;
}

type CardType = "disease_info" | "stage_meaning" | "care_tips";

interface CardContent {
  fullText: string;
  displayedText: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  isExpanded: boolean;
}

const AIGuidanceCards = forwardRef<AIGuidanceCardsRef, AIGuidanceCardsProps>(
  ({ diseaseName, diseaseStage }, ref) => {
    const [cardContents, setCardContents] = useState<
      Record<CardType, CardContent>
    >({
      disease_info: {
        fullText: "",
        displayedText: "",
        isLoading: false,
        hasError: false,
        isExpanded: false,
      },
      stage_meaning: {
        fullText: "",
        displayedText: "",
        isLoading: false,
        hasError: false,
        isExpanded: false,
      },
      care_tips: {
        fullText: "",
        displayedText: "",
        isLoading: false,
        hasError: false,
        isExpanded: false,
      },
    });

    const [activeCard, setActiveCard] = useState<CardType | null>(null);

    // Expose card contents via ref
    useImperativeHandle(ref, () => ({
      getCardContents: () => {
        return {
          disease_info: { fullText: cardContents.disease_info.fullText },
          stage_meaning: { fullText: cardContents.stage_meaning.fullText },
          care_tips: { fullText: cardContents.care_tips.fullText },
        };
      },
    }));

    const typingIntervals = useRef<Record<CardType, NodeJS.Timeout | null>>({
      disease_info: null,
      stage_meaning: null,
      care_tips: null,
    });
    const abortControllers = useRef<Record<CardType, AbortController | null>>({
      disease_info: null,
      stage_meaning: null,
      care_tips: null,
    });

    const stopGeneration = (cardType: CardType) => {
      // Clear typing interval
      if (typingIntervals.current[cardType]) {
        clearInterval(typingIntervals.current[cardType]!);
        typingIntervals.current[cardType] = null;
      }

      // Abort fetch request
      if (abortControllers.current[cardType]) {
        abortControllers.current[cardType]?.abort();
        abortControllers.current[cardType] = null;
      }

      // Update state
      setCardContents((prev) => ({
        ...prev,
        [cardType]: {
          ...prev[cardType],
          isLoading: false,
          displayedText:
            prev[cardType].fullText || prev[cardType].displayedText,
        },
      }));
      setActiveCard(null);
    };

    const handleCardClick = async (cardType: CardType) => {
      // If content already exists, just toggle expansion
      if (cardContents[cardType].fullText) {
        setCardContents((prev) => ({
          ...prev,
          [cardType]: {
            ...prev[cardType],
            isExpanded: !prev[cardType].isExpanded,
          },
        }));
        return;
      }

      // If another card is loading, don't allow new requests
      if (activeCard && activeCard !== cardType) {
        return;
      }

      setActiveCard(cardType);
      setCardContents((prev) => ({
        ...prev,
        [cardType]: {
          ...prev[cardType],
          isLoading: true,
          hasError: false,
          displayedText: "",
          isExpanded: true, // Auto-expand when loading
        },
      }));

      // Create AbortController for this request
      const abortController = new AbortController();
      abortControllers.current[cardType] = abortController;

      try {
        const response = await fetch("/api/skin-disease/guidance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disease_name: diseaseName,
            disease_stage: diseaseStage || "Mild",
            card_type: cardType,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate guidance");
        }

        const data = await response.json();
        const fullText = data.guidance;

        // Store the full text (keep isLoading: true during typing animation)
        setCardContents((prev) => ({
          ...prev,
          [cardType]: {
            ...prev[cardType],
            fullText,
            // Keep isLoading: true so stop button stays visible during typing
          },
        }));

        // Simulate typing effect
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setCardContents((prev) => ({
              ...prev,
              [cardType]: {
                ...prev[cardType],
                displayedText: fullText.substring(0, currentIndex + 1),
              },
            }));
            currentIndex += 1; // Type one character at a time
          } else {
            clearInterval(typingInterval);
            typingIntervals.current[cardType] = null;
            // Set isLoading to false only when typing animation completes
            setCardContents((prev) => ({
              ...prev,
              [cardType]: {
                ...prev[cardType],
                isLoading: false,
              },
            }));
            setActiveCard(null);
          }
        }, 20); // Adjust speed: lower = faster (20ms per character)

        // Store interval reference
        typingIntervals.current[cardType] = typingInterval;
      } catch (err) {
        // Don't show error if it was aborted
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setCardContents((prev) => ({
          ...prev,
          [cardType]: {
            ...prev[cardType],
            isLoading: false,
            hasError: true,
            errorMessage:
              err instanceof Error
                ? err.message
                : "Failed to generate guidance. Please try again.",
          },
        }));
        setActiveCard(null);
        console.error("Guidance generation error:", err);
      } finally {
        // Clean up
        abortControllers.current[cardType] = null;
      }
    };

    const getCardTitle = (cardType: CardType): string => {
      switch (cardType) {
        case "disease_info":
          return "What is this disease?";
        case "stage_meaning":
          return `What does ${diseaseStage || "Mild"} mean?`;
        case "care_tips":
          return "Basic care tips";
        default:
          return "";
      }
    };

    const getCardIcon = (cardType: CardType) => {
      switch (cardType) {
        case "disease_info":
          return (
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        case "stage_meaning":
          return (
            <svg
              className="w-5 h-5 text-purple-600"
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
          );
        case "care_tips":
          return (
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
          );
      }
    };

    const getCardColor = (cardType: CardType) => {
      switch (cardType) {
        case "disease_info":
          return {
            border: "border-blue-500",
            bg: "bg-blue-50",
            text: "text-blue-600",
          };
        case "stage_meaning":
          return {
            border: "border-purple-500",
            bg: "bg-purple-50",
            text: "text-purple-600",
          };
        case "care_tips":
          return {
            border: "border-green-500",
            bg: "bg-green-50",
            text: "text-green-600",
          };
      }
    };

    const renderCardContent = (cardType: CardType) => {
      const content = cardContents[cardType];
      const colors = getCardColor(cardType);

      if (content.hasError) {
        return (
          <div
            className={`mt-4 p-4 rounded-lg ${colors.bg} border ${colors.border}`}
          >
            <p className="text-sm text-red-600">
              {content.errorMessage || "Failed to load guidance"}
            </p>
          </div>
        );
      }

      if (content.isLoading || content.displayedText || content.fullText) {
        const textToShow = content.displayedText || content.fullText;
        // For single paragraph, just display as is
        const displayText = textToShow.trim();

        return (
          <div className="mt-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {displayText}
              {content.isLoading && (
                <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
              )}
            </p>
          </div>
        );
      }

      return null;
    };

    const isCardDisabled = (cardType: CardType): boolean => {
      // Disable if another card is actively loading
      return activeCard !== null && activeCard !== cardType;
    };

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          AI Health Assistant
        </h3>

        {/* Clickable Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["disease_info", "stage_meaning", "care_tips"] as CardType[]).map(
            (cardType) => {
              const content = cardContents[cardType];
              const disabled = isCardDisabled(cardType);
              const hasContent = content.fullText || content.displayedText;
              const colors = getCardColor(cardType);

              return (
                <button
                  key={cardType}
                  onClick={() => handleCardClick(cardType)}
                  disabled={disabled || content.isLoading}
                  className={`
                  bg-white rounded-lg shadow-md p-4 sm:p-6 
                  hover:shadow-lg transition-all 
                  border-2 ${
                    hasContent
                      ? `${colors.border}`
                      : "border-transparent hover:border-gray-300"
                  }
                  text-left w-full
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  ${content.isLoading ? "cursor-wait" : ""}
                `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getCardIcon(cardType)}
                        <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                          {getCardTitle(cardType)}
                        </h4>
                      </div>
                      {!hasContent && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Click to get AI health guidance
                        </p>
                      )}
                    </div>
                    {content.isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent flex-shrink-0" />
                    ) : hasContent ? (
                      <svg
                        className={`w-5 h-5 ${colors.text} flex-shrink-0`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
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
                    )}
                  </div>
                </button>
              );
            },
          )}
        </div>

        {/* Expanded Content Cards - Show all responses below */}
        <div className="space-y-4 mt-6">
          {(["disease_info", "stage_meaning", "care_tips"] as CardType[]).map(
            (cardType) => {
              const content = cardContents[cardType];
              const colors = getCardColor(cardType);
              const hasContent = content.fullText || content.displayedText;
              const shouldShow =
                hasContent || content.isLoading || content.hasError;

              // Only show cards that have content, are loading, or have errors
              if (!shouldShow) {
                return null;
              }

              return (
                <div
                  key={cardType}
                  className={`bg-white rounded-lg shadow-md border-l-4 ${colors.border} transition-all`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCardIcon(cardType)}
                        <h4 className="font-semibold text-gray-800 text-base sm:text-lg">
                          {getCardTitle(cardType)}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCardContents((prev) => ({
                              ...prev,
                              [cardType]: {
                                ...prev[cardType],
                                isExpanded: !prev[cardType].isExpanded,
                              },
                            }))
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          aria-label={
                            content.isExpanded ? "Collapse" : "Expand"
                          }
                        >
                          {content.isExpanded ? (
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
                    {(content.isExpanded || content.isLoading) && (
                      <div className="relative min-h-[60px]">
                        {renderCardContent(cardType)}
                        {content.isLoading &&
                          !content.displayedText &&
                          !content.fullText && (
                            <div className="mt-4 text-sm text-gray-500">
                              Generating content...
                            </div>
                          )}
                        {/* Stop button - always visible when loading, even during typing animation */}
                        {content.isLoading && (
                          <div className="flex justify-end mt-4 sticky bottom-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                stopGeneration(cardType);
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
                      </div>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    );
  },
);

AIGuidanceCards.displayName = "AIGuidanceCards";

export default AIGuidanceCards;
