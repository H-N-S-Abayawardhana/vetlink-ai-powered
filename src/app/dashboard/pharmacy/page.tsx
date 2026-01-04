"use client";

import { AuthGuard } from "@/lib/auth-guard";
import { useSession } from "next-auth/react";
import InventoryList from "@/components/dashboard/pharmacy/InventoryList";
import PrescriptionMatcher from "@/components/dashboard/pharmacy/PrescriptionMatcher";
import StatsCards from "@/components/dashboard/pharmacy/StatsCards";
import SalesChart from "@/components/dashboard/pharmacy/SalesChart";
import TopProducts from "@/components/dashboard/pharmacy/TopProducts";
import RecentSales from "@/components/dashboard/pharmacy/RecentSales";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductInventory from "@/components/dashboard/pharmacy/ProductInventory";
import PharmacyDemandPredictor from "@/components/dashboard/pharmacy/PharmacyDemandPredictor";
import { formatLKR } from "@/lib/currency";
import {
  Plus,
  XCircle,
  CheckCircle2,
  ShoppingCart,
  Search,
  Trash2,
  Minus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PharmacyPage() {
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pharmacy/dashboard");
        const data = await res.json();
        if (res.ok) setDashboard(data.dashboard);
      } catch (e) {
        console.error("Failed to load pharmacy dashboard data", e);
      }
    }
    load();
  }, []);

  // Get user's pharmacy ID
  useEffect(() => {
    async function fetchPharmacy() {
      try {
        const res = await fetch("/api/pharmacies");
        const data = await res.json();
        if (res.ok && data.pharmacies) {
          const userPharmacy = data.pharmacies.find(
            (p: any) => p.owner_id === session?.user?.id,
          );
          if (userPharmacy) {
            setPharmacyId(userPharmacy.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch pharmacy:", err);
      }
    }
    if (session?.user?.id) {
      fetchPharmacy();
    }
  }, [session]);

  const scrollToInventory = () => {
    setActiveTab("inventory");
    setTimeout(() => {
      const el = document.getElementById("pharmacy-inventory");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <AuthGuard
      allowedRoles={["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"]}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                    💊
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Pharmacy Dashboard</h1>
                    <p className="text-blue-100 text-sm mt-1">
                      Welcome back, {session?.user?.name || "User"}! 👋
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="text-xs text-blue-100">Today&apos;s Date</div>
                  <div className="font-semibold">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "overview", label: "📊 Overview", icon: "📊" },
                { id: "inventory", label: "📦 Inventory", icon: "📦" },
                { id: "demand", label: "🔮 Demand Prediction", icon: "🔮" },
                { id: "analytics", label: "📈 Analytics", icon: "📈" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {!dashboard ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg text-center">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-xl text-white">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <span>⚡</span>
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setActiveTab("prescriptions")}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-3 rounded-xl font-medium transition-all text-left"
                      >
                        <div className="text-2xl mb-1">📋</div>
                        <div>Match Prescription</div>
                        <div className="text-xs text-emerald-100 mt-1">
                          Find medications for your pet
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          router.push("/dashboard/pharmacy/inventory")
                        }
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-3 rounded-xl font-medium transition-all text-left"
                      >
                        <div className="text-2xl mb-1">📦</div>
                        <div>Browse Inventory</div>
                        <div className="text-xs text-emerald-100 mt-1">
                          View available medications
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab("demand")}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-3 rounded-xl font-medium transition-all text-left"
                      >
                        <div className="text-2xl mb-1">🔮</div>
                        <div>Predict Demand</div>
                        <div className="text-xs text-emerald-100 mt-1">
                          AI-powered demand forecasting
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-3 rounded-xl font-medium transition-all text-left"
                      >
                        <div className="text-2xl mb-1">📈</div>
                        <div>View Reports</div>
                        <div className="text-xs text-emerald-100 mt-1">
                          Sales & performance data
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        title: "Total Revenue",
                        value: formatLKR(dashboard.totalRevenue),
                        change: "+8%",
                        color: "from-green-500 to-emerald-500",
                        icon: "💰",
                        bgColor: "bg-green-50",
                      },
                      {
                        title: "Total Orders",
                        value: dashboard.totalOrders,
                        change: "+2%",
                        color: "from-blue-500 to-indigo-500",
                        icon: "🛒",
                        bgColor: "bg-blue-50",
                      },
                      {
                        title: "Medications",
                        value: dashboard.top.length,
                        change: "Available",
                        color: "from-purple-500 to-pink-500",
                        icon: "💊",
                        bgColor: "bg-purple-50",
                      },
                      {
                        title: "Stock Items",
                        value: `${dashboard.totalStock ?? 0}`,
                        change: "Low stock: 3",
                        color: "from-orange-500 to-red-500",
                        icon: "📦",
                        bgColor: "bg-orange-50",
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center text-2xl`}
                          >
                            {stat.icon}
                          </div>
                          <div
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              stat.change.includes("+")
                                ? "bg-green-100 text-green-700"
                                : stat.change.includes("Low")
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {stat.change}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {stat.title}
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Section */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span>📊</span>
                          Sales Overview
                        </h3>
                        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                          <option>Last 7 days</option>
                          <option>Last 30 days</option>
                          <option>Last 3 months</option>
                        </select>
                      </div>
                      <SalesChart
                        values={dashboard.chart?.values || []}
                        labels={dashboard.chart?.labels || []}
                      />

                      {/* Business improvement suggestions (placeholder) */}
                      <div className="mt-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                            💡 Business improvement suggestions
                          </h4>
                          <div className="text-xs text-gray-400">
                            Future: populated by ML
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p className="mb-2">
                            Suggestions will appear here after analyzing sales,
                            inventory and demand — this section is a placeholder
                            for now.
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>
                              <strong>No suggestions yet.</strong> ML model
                              integration will populate recommendations here
                              later.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span>🏆</span>
                          Top Products
                        </h3>
                        <TopProducts products={dashboard.top || []} />
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span>🕒</span>
                          Recent Sales
                        </h3>
                        <RecentSales
                          sales={(dashboard.recent || []).slice(0, 5)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shopping Tab */}
              {activeTab === "shopping" && (
                <ShoppingModule />
              )}

              {/* Inventory Tab */}
              {activeTab === "inventory" && (
                <div
                  className="space-y-6 animate-fadeIn"
                  id="pharmacy-inventory"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 shadow-xl text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <span>📦</span>
                          Inventory Management
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Browse, search, and manage all pharmacy products
                        </p>
                      </div>
                      {pharmacyId && (
                        <button
                          onClick={() => setIsAddItemModalOpen(true)}
                          className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add Item
                        </button>
                      )}
                    </div>
                  </div>
                  <InventoryList key={inventoryRefreshKey} />
                </div>
              )}

              {/* Demand Prediction Tab */}
              {activeTab === "demand" && (
                <div className="space-y-6 animate-fadeIn">
                  <PharmacyDemandPredictor />
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text- xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📈</span>
                      Detailed Analytics
                    </h3>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3">
                          Revenue Breakdown
                        </h4>
                        <SalesChart
                          values={dashboard.chart?.values || []}
                          labels={dashboard.chart?.labels || []}
                        />
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-3">
                          Top Performing Items
                        </h4>
                        <TopProducts products={dashboard.top || []} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddItemModalOpen && (
        <AddInventoryItemModal
          pharmacyId={pharmacyId}
          onClose={() => setIsAddItemModalOpen(false)}
          onSave={() => {
            setIsAddItemModalOpen(false);
            setInventoryRefreshKey((prev) => prev + 1);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </AuthGuard>
  );
}

// Add Inventory Item Modal Component
function AddInventoryItemModal({
  pharmacyId,
  onClose,
  onSave,
}: {
  pharmacyId: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    form: "",
    strength: "",
    stock: 0,
    expiry: "",
    price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) {
      setError("Pharmacy ID is required");
      return;
    }

    if (!formData.name || !formData.form) {
      setError("Name and Form are required fields");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        form: formData.form,
        strength: formData.strength || null,
        stock: Number(formData.stock),
        expiry: formData.expiry || null,
        price: Number(formData.price),
      };

      const res = await fetch(`/api/pharmacies/${pharmacyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add item");
        return;
      }

      setSuccess("Item added successfully!");
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      console.error("Failed to add item:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Add New Inventory Item</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-2">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Amoxicillin"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Form <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.form}
                onChange={(e) =>
                  setFormData({ ...formData, form: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Capsule, Tablet"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Strength
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) =>
                  setFormData({ ...formData, strength: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 250 mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({ ...formData, expiry: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Add Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Shopping Module Component
function ShoppingModule() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; quantity: number; pharmacyId: string; pharmacyName: string }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  useEffect(() => {
    if (pharmacies.length > 0) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacies]);

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
            p.strength?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  const fetchPharmacies = async () => {
    try {
      const res = await fetch("/api/pharmacies");
      const data = await res.json();
      if (res.ok && data.pharmacies) {
        setPharmacies(data.pharmacies || []);
      }
    } catch (err) {
      console.error("Failed to fetch pharmacies:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const allProducts: any[] = [];

      for (const pharmacy of pharmacies) {
        try {
          const res = await fetch(`/api/pharmacies/${pharmacy.id}/inventory`);
          const data = await res.json();
          if (res.ok && data.inventory) {
            const pharmacyProducts = data.inventory.map((item: any) => ({
              ...item,
              pharmacyId: pharmacy.id,
              pharmacyName: pharmacy.name,
              pharmacyAddress: pharmacy.address,
            }));
            allProducts.push(...pharmacyProducts);
          }
        } catch (err) {
          console.error(`Failed to fetch inventory for pharmacy ${pharmacy.id}:`, err);
        }
      }

      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(
      (item) => item.id === product.id && item.pharmacyId === product.pharmacyId
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.pharmacyId === product.pharmacyId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
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
    setCart(cart.filter((item) => !(item.id === productId && item.pharmacyId === pharmacyId)));
  };

  const updateQuantity = (productId: string, pharmacyId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId && item.pharmacyId === pharmacyId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as typeof cart
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span>🛒</span>
              Shopping
            </h3>
            <p className="text-emerald-100 text-sm">
              Browse and purchase medications from available pharmacies
            </p>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart
            {getCartItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className={`lg:col-span-2 space-y-6 ${showCart ? "hidden lg:block" : ""}`}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={`${product.id}-${product.pharmacyId}`}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.form}
                        {product.strength && ` — ${product.strength}`}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {product.pharmacyName}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <span className="text-2xl font-bold text-emerald-600">
                            {formatLKR(product.price)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Stock: <span className="font-semibold">{product.stock || 0}</span>
                        </div>
                      </div>
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
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        <div className={`lg:col-span-1 ${showCart ? "" : "hidden lg:block"}`}>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Shopping Cart
              </h3>
              <button
                onClick={() => setShowCart(false)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.pharmacyId}`}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{item.name}</h5>
                          <p className="text-xs text-gray-500">{item.pharmacyName}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.pharmacyId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.pharmacyId, -1)}
                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.pharmacyId, 1)}
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
                    <span className="text-emerald-600">{formatLKR(getTotalPrice())}</span>
                  </div>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
