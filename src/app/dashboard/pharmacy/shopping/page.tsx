"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthGuard } from "@/lib/auth-guard";
import { formatLKR } from "@/lib/currency";
import Image from "next/image";
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
} from "lucide-react";

export default function ShoppingPage() {
  return (
    <AuthGuard
      allowedRoles={["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"]}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <ShoppingModule />
        </div>
      </div>
    </AuthGuard>
  );
}

// Shopping Module Component
function ShoppingModule() {
  // Hardcoded pharmacy data for testing
  const hardcodedPharmacies = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "HealthPlus Pharmacy",
      address: "123 Main Street, Colombo",
      owner_id: "a4830cd9-0325-45b8-938b-cb876a54ce07",
    },
  ];

  // Hardcoded products for testing with local images
  const hardcodedProducts = [
    {
      id: "1",
      uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Amoxicillin",
      form: "Capsule",
      strength: "250 mg",
      stock: 120,
      price: 450.00,
      expiry: "2026-11-01",
      image: "/uploads/pharmacy/Amoxicillin.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo",
    },
    {
      id: "2",
      uuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Prednisone",
      form: "Tablet",
      strength: "5 mg",
      stock: 40,
      price: 650.00,
      expiry: "2027-02-15",
      image: "/uploads/pharmacy/Prednisone.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo",
    },
    {
      id: "3",
      uuid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Ivermectin",
      form: "Oral suspension",
      strength: "1%",
      stock: 25,
      price: 850.00,
      expiry: "2026-07-28",
      image: "/uploads/pharmacy/Ivermectin.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo",
    },
    {
      id: "4",
      uuid: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      name: "Metronidazole",
      form: "Tablet",
      strength: "500 mg",
      stock: 60,
      price: 350.00,
      expiry: "2026-09-10",
      image: "/uploads/pharmacy/Metronidazole.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo",
    },
    {
      id: "5",
      uuid: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      name: "Doxycycline",
      form: "Capsule",
      strength: "100 mg",
      stock: 80,
      price: 550.00,
      expiry: "2027-01-20",
      image: "/uploads/pharmacy/Doxycycline.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo",
    },
    {
      id: "6",
      uuid: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      name: "Carprofen",
      form: "Tablet",
      strength: "75 mg",
      stock: 35,
      price: 750.00,
      expiry: "2026-12-05",
      image: "/uploads/pharmacy/Carprofen.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo",
    },
  ];

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<
    Array<{
      id: string;
      uuid: string; // Store UUID for API calls
      name: string;
      price: number;
      quantity: number;
      pharmacyId: string;
      pharmacyName: string;
    }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    // Load hardcoded data immediately
    setPharmacies(hardcodedPharmacies);
    setProducts(hardcodedProducts);
    setFilteredProducts(hardcodedProducts);
    setLoading(false);
    
    // Uncomment to fetch from database:
    // fetchPharmacies();
  }, []);

  useEffect(() => {
    // Uncomment to fetch from database when pharmacies change:
    // if (pharmacies.length > 0) {
    //   fetchProducts();
    // }
  }, [pharmacies]);

  // Refresh products when needed
  const refreshProducts = () => {
    if (pharmacies.length > 0) {
      fetchProducts();
    }
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

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      // Use hardcoded data for now
      setPharmacies(hardcodedPharmacies);
      console.log(`Using ${hardcodedPharmacies.length} hardcoded pharmacies`);
      
      // Uncomment below to fetch from database instead:
      // const res = await fetch("/api/pharmacies");
      // const data = await res.json();
      // if (res.ok && data.pharmacies) {
      //   setPharmacies(data.pharmacies || []);
      //   console.log(`Fetched ${data.pharmacies.length} pharmacies from database`);
      // } else {
      //   console.error("Failed to fetch pharmacies:", data.error);
      // }
    } catch (err) {
      console.error("Failed to fetch pharmacies:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Use hardcoded products for now
      setProducts(hardcodedProducts);
      setFilteredProducts(hardcodedProducts);
      console.log(`Using ${hardcodedProducts.length} hardcoded products`);
      
      // Uncomment below to fetch from database instead:
      // const allProducts: any[] = [];
      // for (const pharmacy of pharmacies) {
      //   try {
      //     const res = await fetch(`/api/pharmacies/${pharmacy.id}/inventory`);
      //     const data = await res.json();
      //     if (res.ok && data.inventory) {
      //       const pharmacyProducts = data.inventory.map((item: any) => ({
      //         ...item,
      //         pharmacyId: pharmacy.id,
      //         pharmacyName: pharmacy.name,
      //         pharmacyAddress: pharmacy.address,
      //       }));
      //       allProducts.push(...pharmacyProducts);
      //     }
      //   } catch (err) {
      //     console.error(
      //       `Failed to fetch inventory for pharmacy ${pharmacy.id}:`,
      //       err,
      //     );
      //   }
      // }
      // setProducts(allProducts);
      // setFilteredProducts(allProducts);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(
      (item) => item.id === product.id && item.pharmacyId === product.pharmacyId,
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.pharmacyId === product.pharmacyId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          uuid: product.uuid || product.id, // Use UUID if available
          name: product.name,
          price: product.price,
          quantity: 1,
          pharmacyId: product.pharmacyId,
          pharmacyName: product.pharmacyName,
        },
      ]);
    }
  };

  const removeFromCart = (productId: string, pharmacyId: string) => {
    setCart(
      cart.filter(
        (item) => !(item.id === productId && item.pharmacyId === pharmacyId),
      ),
    );
  };

  const updateQuantity = (
    productId: string,
    pharmacyId: string,
    delta: number,
  ) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId && item.pharmacyId === pharmacyId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) {
              return null;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as typeof cart,
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
      // Get full product details for each cart item
      const items = cart.map((item) => {
        // Use the UUID stored in cart item (which is the inventory item UUID)
        return {
          pharmacyId: item.pharmacyId,
          inventoryItemId: item.uuid, // Use UUID for database lookup
          quantity: item.quantity,
        };
      });

      const response = await fetch("/api/pharmacy/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          delivery_method: deliveryMethod,
          delivery_address: deliveryMethod === "delivery" ? deliveryAddress : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to place order");
        return;
      }

      setOrderSuccess(true);
      setCart([]);
      setShowCheckout(false);
      
      // Refresh products to update stock from database
      setTimeout(() => {
        refreshProducts();
      }, 1000);
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An unexpected error occurred");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-xl text-white">
        <div>
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span>🛒</span>
            Shopping
          </h3>
          <p className="text-emerald-100 text-sm">
            Browse and purchase medications from available pharmacies
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Products List */}
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg text-center">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                  className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-emerald-50 to-teal-50">
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
                        <div className="w-24 h-24 bg-emerald-200 rounded-full flex items-center justify-center">
                          <span className="text-4xl">💊</span>
                        </div>
                      </div>
                    )}
                    {/* Stock Badge */}
                    {product.stock && product.stock > 0 && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
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
                          <p className="text-gray-400">{product.pharmacyAddress}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-2xl font-bold text-emerald-600">
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
                      className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center justify-center"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Shopping Cart
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
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
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
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
                          className="text-red-500 hover:text-red-700"
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
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
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
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-emerald-600">
                          {formatLKR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-emerald-600">
                        {formatLKR(getTotalPrice())}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your order has been confirmed. You will receive a confirmation email shortly.
              </p>
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setShowCart(false);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Checkout</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-2">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.pharmacyId}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.pharmacyName}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-emerald-600">
                    {formatLKR(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onDeliveryMethodChange("pickup")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  deliveryMethod === "pickup"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MapPin
                  className={`w-6 h-6 mb-2 ${
                    deliveryMethod === "pickup" ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`font-semibold ${
                    deliveryMethod === "pickup" ? "text-emerald-600" : "text-gray-700"
                  }`}
                >
                  Pickup
                </p>
                <p className="text-xs text-gray-500 mt-1">Collect from pharmacy</p>
              </button>
              <button
                onClick={() => onDeliveryMethodChange("delivery")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  deliveryMethod === "delivery"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Truck
                  className={`w-6 h-6 mb-2 ${
                    deliveryMethod === "delivery" ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`font-semibold ${
                    deliveryMethod === "delivery" ? "text-emerald-600" : "text-gray-700"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter your delivery address"
              />
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-emerald-600">{formatLKR(totalPrice)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || (deliveryMethod === "delivery" && !deliveryAddress.trim())}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

