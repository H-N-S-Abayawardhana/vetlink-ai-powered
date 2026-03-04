"use client";

interface AnalyzingPopupProps {
  open: boolean;
}

export default function AnalyzingPopup({ open }: AnalyzingPopupProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analyzing-title"
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center p-4"
    >
      {/* Blurred backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Focus trap / centering wrapper */}
      <div className="relative z-10 flex min-h-full items-center justify-center text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white px-6 pt-6 pb-6 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
          <div>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="size-6 animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                id="analyzing-title"
                className="text-base font-semibold text-gray-900"
              >
                Analyzing
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Our AI is examining the skin image. This may take a few
                  seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
