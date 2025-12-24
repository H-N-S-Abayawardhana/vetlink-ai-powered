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
import { formatLKR } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default function PharmacyPage() {
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

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

  const scrollToInventory = () => {
    setActiveTab("inventory");
    setTimeout(() => {
      const el = document.getElementById("pharmacy-inventory");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN", "VETERINARIAN", "USER"]}>
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
                { id: "prescriptions", label: "📋 Prescriptions", icon: "📋" },
                { id: "inventory", label: "📦 Inventory", icon: "📦" },
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

              {/* Prescriptions Tab */}
              {activeTab === "prescriptions" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📋</span>
                      Prescription Matcher
                    </h3>
                    <PrescriptionMatcher />
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === "inventory" && (
                <div
                  className="space-y-6 animate-fadeIn"
                  id="pharmacy-inventory"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 shadow-xl text-white">
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <span>📦</span>
                      Inventory Management
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Browse, search, and manage all pharmacy products
                    </p>
                  </div>
                  <InventoryList />
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
