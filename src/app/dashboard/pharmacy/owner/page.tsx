"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/lib/auth-guard";
import InventoryList from "@/components/dashboard/pharmacy/InventoryList";

export default function OwnerDashboard() {
  const [pharmacyId, setPharmacyId] = useState<number>(1);
  const [forecast, setForecast] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pharmacies/${pharmacyId}/forecast`);
        const data = await res.json();
        if (res.ok) {
          setForecast(data.recommendations || []);
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error("failed to load forecast", err);
      }
    }
    load();
  }, [pharmacyId]);

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN", "VETERINARIAN"]}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Pharmacy Owner Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            View inventory health, forecasts and alerts for your pharmacy.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Forecast & Recommendations
                </h2>
                <div>
                  <label className="text-xs text-gray-500 mr-2">
                    Pharmacy ID
                  </label>
                  <input
                    type="number"
                    value={pharmacyId}
                    onChange={(e) => setPharmacyId(Number(e.target.value))}
                    className="px-2 py-1 border rounded w-20 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                {!forecast ? (
                  <p className="text-sm text-gray-500">
                    Loading recommendations…
                  </p>
                ) : (
                  <div className="space-y-2">
                    {forecast.map((r: any) => (
                      <div
                        key={r.medication}
                        className="p-2 border rounded bg-gray-50 text-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{r.medication}</div>
                          <div className="text-xs text-gray-500">
                            Stock: {r.stock} • Forecast next 30 days:{" "}
                            {r.forecastNext30}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          Suggested: {r.optimalStock}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <InventoryList />
          </div>

          <div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
              <h3 className="text-sm font-semibold">Alerts</h3>
              <div className="mt-3 space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No alerts at the moment
                  </p>
                ) : (
                  alerts.map((a: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 border rounded bg-red-50 text-sm text-red-700"
                    >
                      <div className="font-semibold">
                        {a.type === "low_stock" ? "Low stock" : "Expiring soon"}
                      </div>
                      <div className="text-xs">
                        {a.medication} —{" "}
                        {a.type === "low_stock"
                          ? `stock ${a.stock}, recommended ${a.recommended}`
                          : `expires in ${a.daysLeft} days (${a.expiry})`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded">
                  Create Promotional Campaign
                </button>
                <button className="w-full px-3 py-2 border rounded">
                  Export Inventory CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
