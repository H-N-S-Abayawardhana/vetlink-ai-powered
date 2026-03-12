"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/lib/auth-guard";
import { formatLKR } from "@/lib/currency";
import Image from "next/image";
import {
  addItemToPharmacyCart,
  loadPharmacyCart,
  removeItemFromPharmacyCart,
  savePharmacyCart,
  updatePharmacyCartQuantity,
  type PharmacyCartItem,
} from "@/lib/pharmacyCart";
import {
  ShoppingCart,
  Search,
  Trash2,
  Minus,
  Plus,
  XCircle,
  CheckCircle2,
  MapPin,
  Truck,
  CreditCard,
} from "lucide-react";

export default function ShoppingPage() {
  return (
    <AuthGuard
      allowedRoles={["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"]}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            }
          >
            <ShoppingModule />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
}

// Shopping Module Component
function ShoppingModule() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<PharmacyCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pendingAdd, setPendingAdd] = useState<{
    productName: string;
    pharmacyId: string;
  } | null>(null);

  // Load shared cart from storage on mount
  useEffect(() => {
    setCart(loadPharmacyCart());
  }, []);

  // Persist shared cart
  useEffect(() => {
    savePharmacyCart(cart);
  }, [cart]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/pharmacy/products");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }
      const list = data.products || [];
      setProducts(list);
      setFilteredProducts(list);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle deep-link from prescription page (?product=&pharmacy=)
  useEffect(() => {
    const productName = searchParams.get("product");
    const pharmacyId = searchParams.get("pharmacy");
    if (productName && pharmacyId) {
      setPendingAdd({
        productName,
        pharmacyId,
      });
    }
  }, [searchParams]);

  // Handle return from PayHere (success or cancel)
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setOrderSuccess(true);
      setCart([]);
      setShowCheckout(false);
      setError(null);
      try {
        savePharmacyCart([]);
      } catch {
        // ignore
      }
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/pharmacy/shopping");
      }
    } else if (payment === "cancel") {
      setError("Payment was cancelled. Your cart has been preserved.");
      setShowCheckout(false);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/dashboard/pharmacy/shopping");
      }
    }
  }, [searchParams]);

  const refreshProducts = () => {
    fetchProducts();
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.form?.toLowerCase().includes(query) ||
            p.strength?.toLowerCase().includes(query),
        ),
      );
    }
  }, [searchQuery, products]);

  const addToCart = (product: any) => {
    setCart((prev) => addItemToPharmacyCart(prev, product));
  };

  // Once products are loaded, add any deep-linked item to the cart
  useEffect(() => {
    if (!pendingAdd || products.length === 0) return;

    const match = products.find(
      (p) =>
        p.name === pendingAdd.productName &&
        String(p.pharmacyId) === pendingAdd.pharmacyId,
    );

    if (match) {
      addToCart(match);
      setShowCart(true);
      setPendingAdd(null);
    }
  }, [pendingAdd, products]);

  const removeFromCart = (productId: string, pharmacyId: string) => {
    setCart((prev) => removeItemFromPharmacyCart(prev, productId, pharmacyId));
  };

  const updateQuantity = (
    productId: string,
    pharmacyId: string,
    delta: number,
  ) => {
    setCart((prev) =>
      updatePharmacyCartQuantity(prev, productId, pharmacyId, delta),
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const items = cart.map((item) => ({
        pharmacyId: item.pharmacyId,
        inventoryItemId: item.uuid,
        quantity: item.quantity,
      }));

      // Step 1: Create order in pending_payment (no stock deduction yet)
      const orderRes = await fetch("/api/pharmacy/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          delivery_method: deliveryMethod,
          delivery_address:
            deliveryMethod === "delivery" ? deliveryAddress : null,
          prepareForPayment: true,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Failed to prepare order");
        return;
      }

      const orderId = orderData.order?.id;
      const totalAmount = orderData.order?.totalAmount;
      if (!orderId || totalAmount == null) {
        setError("Invalid order response");
        return;
      }

      // Step 2: Get PayHere payment params
      const payRes = await fetch("/api/payhere/create-pharmacy-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: totalAmount,
          itemName: "Pharmacy Order",
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.error || "Payment gateway error");
        return;
      }

      const baseUrl = window.location.origin;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payData.checkoutUrl;

      const fields: Record<string, string> = {
        merchant_id: payData.merchantId,
        return_url: `${baseUrl}/dashboard/pharmacy/shopping?payment=success`,
        cancel_url: `${baseUrl}/dashboard/pharmacy/shopping?payment=cancel`,
        notify_url: `${baseUrl}/api/payhere/notify`,
        order_id: orderId,
        items: payData.itemName || "Pharmacy Order",
        amount: payData.amount,
        currency: payData.currency,
        custom_1: "pharmacy",
        custom_2: orderId,
        first_name:
          (session?.user?.name as string)?.split(" ")[0] || "Customer",
        last_name:
          (session?.user?.name as string)?.split(" ").slice(1).join(" ") ||
          "User",
        email: (session?.user?.email as string) || "customer@example.com",
        phone: "0771234567",
        address:
          deliveryMethod === "delivery" ? deliveryAddress || "N/A" : "N/A",
        city: "Colombo",
        country: "Sri Lanka",
        hash: payData.hash,
      };

      const fieldOrder = [
        "merchant_id",
        "return_url",
        "cancel_url",
        "notify_url",
        "order_id",
        "items",
        "amount",
        "currency",
        "custom_1",
        "custom_2",
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "city",
        "country",
        "hash",
      ];

      fieldOrder.forEach((key) => {
        if (fields[key]) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(fields[key]);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
      // Form submit navigates away; no need to set checkoutLoading false
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An unexpected error occurred");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Pharmacy Shopping
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Discover and purchase veterinary medications from trusted pharmacies.
          Compare prices and check availability.
        </p>
      </div>

      <div className="space-y-6">
        {/* Products List */}
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
              <div className="animate-spin w-10 h-10 border-2 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
              <ShoppingCart className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {products.length === 0
                  ? "No products available"
                  : "No products match your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={`${product.id}-${product.pharmacyId}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gray-50">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center">
                          <span className="text-4xl">💊</span>
                        </div>
                      </div>
                    )}
                    {/* Stock Badge */}
                    {product.stock && product.stock > 0 && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-700">
                        {product.stock} in stock
                      </div>
                    )}
                    {(!product.stock || product.stock <= 0) && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.form}
                        {product.strength && ` — ${product.strength}`}
                      </p>
                      <div className="text-xs text-gray-500 mb-3">
                        <p className="font-medium">{product.pharmacyName}</p>
                        {product.pharmacyAddress && (
                          <p className="text-gray-400">
                            {product.pharmacyAddress}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatLKR(product.price)}
                          </span>
                        </div>
                        {product.expiry && (
                          <div className="text-xs text-gray-500">
                            Exp: {new Date(product.expiry).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.stock || product.stock <= 0}
                      className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {getCartItemCount() > 0 && (
        <button
          onClick={() => setShowCart(!showCart)}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {getCartItemCount()}
          </span>
        </button>
      )}

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md h-[80vh] flex flex-col">
            <div className="bg-blue-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Shopping Cart
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-4">
                    {cart.map((item) => (
                      <div
                        key={`${item.id}-${item.pharmacyId}`}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
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
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-gray-900">
                                  {item.name}
                                </h5>
                                <p className="text-xs text-gray-500">
                                  {item.pharmacyName}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  removeFromCart(item.id, item.pharmacyId)
                                }
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.pharmacyId, -1)
                                  }
                                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, item.pharmacyId, 1)
                                  }
                                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="font-bold text-blue-600">
                                {formatLKR(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatLKR(getTotalPrice())}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          totalPrice={getTotalPrice()}
          deliveryMethod={deliveryMethod}
          deliveryAddress={deliveryAddress}
          onDeliveryMethodChange={setDeliveryMethod}
          onDeliveryAddressChange={setDeliveryAddress}
          onClose={() => {
            setShowCheckout(false);
            setError(null);
          }}
          onConfirm={handleCheckout}
          loading={checkoutLoading}
          error={error}
        />
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your order has been confirmed. You will receive a confirmation
                email shortly.
              </p>
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setShowCart(false);
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Checkout Modal Component
function CheckoutModal({
  cart,
  totalPrice,
  deliveryMethod,
  deliveryAddress,
  onDeliveryMethodChange,
  onDeliveryAddressChange,
  onClose,
  onConfirm,
  loading,
  error,
}: {
  cart: Array<{
    id: string;
    uuid: string;
    name: string;
    price: number;
    quantity: number;
    pharmacyId: string;
    pharmacyName: string;
    image?: string | null;
  }>;
  totalPrice: number;
  deliveryMethod: "pickup" | "delivery";
  deliveryAddress: string;
  onDeliveryMethodChange: (method: "pickup" | "delivery") => void;
  onDeliveryAddressChange: (address: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Checkout</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-2">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Order Summary
            </h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.pharmacyId}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg">💊</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.pharmacyName}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {formatLKR(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Delivery Method
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onDeliveryMethodChange("pickup")}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  deliveryMethod === "pickup"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MapPin
                  className={`w-6 h-6 mb-2 ${
                    deliveryMethod === "pickup"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`font-semibold ${
                    deliveryMethod === "pickup"
                      ? "text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  Pickup
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Collect from pharmacy
                </p>
              </button>
              <button
                onClick={() => onDeliveryMethodChange("delivery")}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  deliveryMethod === "delivery"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Truck
                  className={`w-6 h-6 mb-2 ${
                    deliveryMethod === "delivery"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`font-semibold ${
                    deliveryMethod === "delivery"
                      ? "text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  Delivery
                </p>
                <p className="text-xs text-gray-500 mt-1">Home delivery</p>
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          {deliveryMethod === "delivery" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => onDeliveryAddressChange(e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your delivery address"
              />
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-blue-600">{formatLKR(totalPrice)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={
                loading ||
                (deliveryMethod === "delivery" && !deliveryAddress.trim())
              }
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Confirm & Pay with PayHere
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
