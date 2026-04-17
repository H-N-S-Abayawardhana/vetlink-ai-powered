"use client";

import React from "react";
import { formatLKR } from "@/lib/currency";

interface Product {
  id: number;
  name: string;
  sold: number;
  revenue: number;
}

export default function TopProducts({ products }: { products: Product[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Top Selling</div>
        <div className="text-xs text-gray-500">This month</div>
      </div>

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-green-50 flex items-center justify-center text-green-600 font-semibold">
                {p.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {p.name}
                </div>
                <div className="text-xs text-gray-500">{p.sold} sold</div>
              </div>
            </div>
            <div className="text-sm text-gray-900">{formatLKR(p.revenue)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
