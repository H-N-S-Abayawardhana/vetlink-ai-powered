"use client";

import React from "react";
import Image from "next/image";
import { formatLKR } from "@/lib/currency";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

interface Props {
  product: Product;
  onAddToCart?: (p: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
      <div className="h-40 w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
        {product.image ? (
          // Images are placeholders — use local public files or external links
          <Image
            src={product.image}
            alt={product.name}
            width={160}
            height={160}
            className="object-cover h-full w-full"
          />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {product.description || ""}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
          {formatLKR(product.price)}
        </div>
        <div>
          {product.stock > 0 ? (
            <button
              onClick={() => onAddToCart && onAddToCart(product)}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
          ) : (
            <div className="px-3 py-1 text-xs text-red-600 bg-red-50 rounded">
              Out of stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
