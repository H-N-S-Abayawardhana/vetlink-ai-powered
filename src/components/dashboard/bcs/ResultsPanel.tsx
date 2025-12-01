"use client";

import React from "react";

interface Props {
  score: number | null;
  petName?: string | null;
}

function scoreCategory(score: number) {
  if (score <= 3) return "Underweight";
  if (score <= 5) return "Ideal";
  if (score <= 7) return "Overweight";
  return "Obese";
}

export default function ResultsPanel({ score, petName }: Props) {
  if (score == null) {
    return (
      <div className="border rounded-md p-4 bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Results</h3>
        <div className="text-sm text-gray-700 mt-2">No result yet. Calculate to see BCS.</div>
      </div>
    );
  }

  const pct = Math.min(Math.max((score / 9) * 100, 0), 100);
  const category = scoreCategory(score);

  return (
    <div className="border rounded-md p-4 space-y-4 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">BCS Result</h3>

      {petName && (
        <div className="text-sm text-gray-900 font-medium">Pet: {petName}</div>
      )}

      <div className="flex items-baseline gap-4">
        <div className="text-5xl font-extrabold text-gray-900">{score}</div>
        <div className="text-sm text-gray-800">
          Category: <span className="font-medium text-gray-900">{category}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full ${
              pct < 40
                ? "bg-blue-500"
                : pct < 65
                ? "bg-green-500"
                : pct < 85
                ? "bg-yellow-500"
                : "bg-red-600"
            } transition-all duration-300`}
          />
        </div>
        <div className="text-sm text-gray-700 mt-1">Score shown on a 1–9 scale</div>
      </div>
    </div>
  );
}
