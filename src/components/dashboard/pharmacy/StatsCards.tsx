"use client";

import React from "react";

interface Stat {
  title: string;
  value: string | number;
  change?: string;
  color?: string;
}

export default function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">{s.title}</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {s.value}
              </div>
            </div>
            <div
              className={`text-sm font-semibold ${s.color || "text-green-600"}`}
            >
              {s.change ?? ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
