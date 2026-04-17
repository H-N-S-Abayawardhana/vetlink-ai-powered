"use client";

import React from "react";

interface Props {
  values: number[];
  labels?: string[];
}

// Minimal and dependency-free SVG bar + line chart used for admin dashboard preview
export default function SalesChart({ values, labels = [] }: Props) {
  const width = 600;
  const height = 180;
  const padding = 20;
  const max = Math.max(...values, 1);
  const barWidth = (width - padding * 2) / values.length - 6;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-sm text-gray-500 mb-2">Sales (last 7 days)</div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <g>
          {values.map((v, i) => {
            const x = padding + i * (barWidth + 6);
            const barHeight = (v / max) * (height - 60);
            const y = height - padding - barHeight;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="#60a5fa"
                  opacity={0.9}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 14}
                  fontSize={11}
                  fill="#374151"
                  textAnchor="middle"
                >
                  {labels[i] ?? ""}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
