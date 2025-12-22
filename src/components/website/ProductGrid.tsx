"use client";

import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  onAddToCart,
}: {
  products: any[];
  onAddToCart?: (p: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
