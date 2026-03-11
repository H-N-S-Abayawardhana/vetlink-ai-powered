"use client";

import Image from "next/image";
import Link from "next/link";
import { formatLKR } from "@/lib/currency";
import type { PharmacyCartItem } from "@/lib/pharmacyCart";
import { ShoppingCart, XCircle, Trash2, Minus, Plus } from "lucide-react";

interface PharmacyCartModalProps {
  cart: PharmacyCartItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRemove: (productId: string, pharmacyId: string) => void;
  onUpdateQuantity: (
    productId: string,
    pharmacyId: string,
    delta: number,
  ) => void;
  onProceed?: () => void;
  proceedHref?: string;
  proceedLabel?: string;
  subtitle?: string;
}

export default function PharmacyCartModal({
  cart,
  isOpen,
  onToggle,
  onClose,
  onRemove,
  onUpdateQuantity,
  onProceed,
  proceedHref,
  proceedLabel = "Proceed",
  subtitle = "Shared cart across pharmacy pages",
}: PharmacyCartModalProps) {
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <>
      {itemCount > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center cursor-pointer"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {itemCount}
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-emerald-600 text-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <p className="text-emerald-100 text-xs mt-1">{subtitle}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.pharmacyId}`}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xl">💊</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {item.pharmacyName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemove(item.id, item.pharmacyId)}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.pharmacyId, -1)
                                }
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.pharmacyId, 1)
                                }
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="font-bold text-emerald-700">
                              {formatLKR(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-5 space-y-3">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-emerald-700">
                    {formatLKR(totalPrice)}
                  </span>
                </div>

                {proceedHref ? (
                  <Link
                    href={proceedHref}
                    className="w-full inline-flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
                  >
                    {proceedLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onProceed}
                    className="w-full inline-flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    {proceedLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
