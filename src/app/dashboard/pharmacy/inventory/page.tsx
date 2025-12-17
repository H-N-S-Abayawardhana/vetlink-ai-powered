"use client";

import React, { useEffect, useState, useRef } from "react";
import ProductGrid from "@/components/website/ProductGrid";
import { formatLKR } from "@/lib/currency";

interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  image?: string;
  description?: string;
}

interface CartItem {
  id: number;
  qty: number;
  product: Product;
}

export default function PharmacyInventoryShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadedPrescription, setUploadedPrescription] = useState<File | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (res.ok) setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    }
    load();
  }, []);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === p.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [{ id: p.id, qty: 1, product: p }, ...prev];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((i) => i.id === id);
      if (idx !== -1) {
        copy[idx].qty += delta;
        if (copy[idx].qty <= 0) {
          copy.splice(idx, 1);
        }
      }
      return copy;
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const total = cart.reduce((acc, i) => acc + i.qty * (i.product.price || 0), 0);

  // derive categories from the loaded products so filter pills always match available data
  const derivedCategories = ["all", ...Array.from(new Set(products.map((p: any) => p.category || 'Uncategorized')))] as string[];

  const categoryIcons: Record<string, string> = {
    all: '✨',
    Food: '🍖',
    Supplements: '💊',
    Preventatives: '🛡️',
    Toys: '🧸',
    'First Aid': '🩺',
    Uncategorized: '✨'
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
              <span>✨</span>
              <span>Premium Pet Healthcare</span>
            </div>
            <h1 className="text-5xl font-bold">🐾 Pet Pharmacy</h1>
            <p className="text-xl text-emerald-100">Quality medicines & supplements for your beloved pets</p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search for medicines, supplements, or health products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-800 shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
                />
                {/* Upload prescription CTA (hidden input + button) */}
                <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start">
                  <input
                    aria-hidden
                    ref={fileInputRef}
                    id="prescription-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadedPrescription(file);
                      setUploadedName(file ? file.name : null);
                    }}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-full text-sm font-semibold hover:bg-emerald-50 border border-white/30 shadow-sm"
                  >
                    📤 Upload your prescription
                  </button>

                  <div className="text-xs text-white/90">
                    {uploadedName ? (
                      <span className="font-medium">Uploaded: <span className="text-sm ml-1 font-normal">{uploadedName}</span></span>
                    ) : (
                      <span className="opacity-80">Upload an image or PDF to find medicines easily</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Category Filter Pills */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              
              {derivedCategories.map((cat) => {
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg scale-105"
                        : "bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200"
                    }`}
                  >
                    <span className="text-lg">{categoryIcons[cat] || '✨'}</span>
                    <span className="font-medium">{cat === 'all' ? 'All Products' : cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div>
              {/* Apply search + category filters before rendering */}
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const filtered = products.filter((p: any) => {
                  const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
                  const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
                  return matchesCategory && matchesQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">No products match your search.</div>
                  );
                }

                return <ProductGrid products={filtered} onAddToCart={addToCart} />;
              })()}
            </div>
          </div>

          {/* Sidebar - Cart & Info */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Shopping Cart */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden sticky top-6">
              {/* Cart Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5">
                <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="text-xl">🛒</span>
                    Shopping Cart
                  </h3>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                    {cart.length} items
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="p-5">
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="mx-auto mb-3 opacity-30 text-5xl">🛒</div>
                      <p className="text-sm">Your cart is empty</p>
                      <p className="text-xs mt-1">Add products to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-auto pr-2">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-emerald-900 text-sm leading-tight">
                                {item.product.name}
                              </h4>
                              <p className="text-xs text-emerald-700 mt-1">
                                {formatLKR(item.product.price)} each
                              </p>
                            </div>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition">🗑️</button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-emerald-300 p-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="hover:bg-emerald-100 p-1 rounded transition">➖</button>
                              <span className="text-sm font-semibold text-emerald-900 w-8 text-center">
                                {item.qty}
                              </span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="hover:bg-emerald-100 p-1 rounded transition">➕</button>
                            </div>
                            <div className="font-bold text-emerald-700">
                              {formatLKR(item.product.price * item.qty)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>

                {/* Cart Total & Checkout */}
                {cart.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Subtotal:</span>
                      <span className="text-2xl font-bold text-emerald-700">{formatLKR(total)}</span>
                    </div>
                    <button className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                      Proceed to Checkout
                    </button>
                    <p className="text-xs text-center text-gray-500">
                      🚚 Free delivery on orders over LKR 5,000
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200 shadow-md">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span>❤️</span>
                Why Choose Us?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Certified veterinary products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Fast & secure delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Expert consultation available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>100% authentic guarantee</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

