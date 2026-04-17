"use client";

import React from "react";
import { formatLKR } from "@/lib/currency";

interface Sale {
  id: number;
  medication: string;
  quantity: number;
  price: number;
  date: string;
  customer?: string;
}

export default function RecentSales({ sales }: { sales: Sale[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Recent Sales</div>
        <div className="text-xs text-gray-500">Showing latest</div>
      </div>

      <ul className="space-y-3">
        {sales.map((s) => (
          <li key={s.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
                {s.medication.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {s.medication}
                </div>
                <div className="text-xs text-gray-500">
                  {s.customer ?? "Walk-in"} •{" "}
                  {new Date(s.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-900">
              {s.quantity} × {formatLKR(s.price)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
