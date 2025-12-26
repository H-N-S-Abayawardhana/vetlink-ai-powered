"use client";

import { useState } from "react";

export default function PharmacyDemandPredictor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);

  // Core features (required)
  const [pharmacyId, setPharmacyId] = useState<number>(2);
  const [medicineId, setMedicineId] = useState<number>(4);
  const [price, setPrice] = useState<number>(1500.0);
  const [inventoryLevel, setInventoryLevel] = useState<number>(150);
  const [expiryDays, setExpiryDays] = useState<number>(180);
  const [latX, setLatX] = useState<number>(6.9271);
  const [longX, setLongX] = useState<number>(79.8612);
  const [promotionFlag, setPromotionFlag] = useState<number>(0);

  // Additional features (optional, with defaults)
  const [inventoryId, setInventoryId] = useState<number>(101);
  const [currentStock, setCurrentStock] = useState<number>(150);
  const [reorderLevel, setReorderLevel] = useState<number>(25);
  const [leadTime, setLeadTime] = useState<number>(7);
  const [latY, setLatY] = useState<number>(6.9271);
  const [longY, setLongY] = useState<number>(79.8612);
  const [deliveryAvailable, setDeliveryAvailable] = useState<number>(1);
  const [pickupAvailable, setPickupAvailable] = useState<number>(1);
  const [markupFactor, setMarkupFactor] = useState<number>(1.15);
  const [prescribedQty, setPrescribedQty] = useState<number>(40);
  const [avgUrgency, setAvgUrgency] = useState<number>(0.7);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch("/api/pharmacy/demand-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pharmacy_id: pharmacyId,
          medicine_id: medicineId,
          price: price,
          inventory_level: inventoryLevel,
          expiry_days: expiryDays,
          location_lat_x: latX,
          location_long_x: longX,
          promotion_flag: promotionFlag,
          inventory_id: inventoryId,
          current_stock: currentStock,
          reorder_level: reorderLevel,
          supplier_lead_time_days: leadTime,
          location_lat_y: latY,
          location_long_y: longY,
          delivery_available: deliveryAvailable,
          pickup_available: pickupAvailable,
          price_markup_factor: markupFactor,
          total_prescribed_qty: prescribedQty,
          avg_urgency: avgUrgency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to predict demand");
      }

      setPrediction(data.prediction);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to predict demand. Please try again.",
      );
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPharmacyId(2);
    setMedicineId(4);
    setPrice(1500.0);
    setInventoryLevel(150);
    setExpiryDays(180);
    setLatX(6.9271);
    setLongX(79.8612);
    setPromotionFlag(0);
    setInventoryId(101);
    setCurrentStock(150);
    setReorderLevel(25);
    setLeadTime(7);
    setLatY(6.9271);
    setLongY(79.8612);
    setDeliveryAvailable(1);
    setPickupAvailable(1);
    setMarkupFactor(1.15);
    setPrescribedQty(40);
    setAvgUrgency(0.7);
    setError(null);
    setPrediction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>🔮</span>
          Pharmacy Demand Forecaster
        </h2>
        <p className="text-indigo-100 text-sm">
          Enter pharmacy and medicine details to predict future demand
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core Features Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📋</span>
              Core Features
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pharmacy ID *
              </label>
              <input
                type="number"
                value={pharmacyId}
                onChange={(e) => setPharmacyId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine ID *
              </label>
              <input
                type="number"
                value={medicineId}
                onChange={(e) => setMedicineId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (LKR) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Level *
              </label>
              <input
                type="number"
                value={inventoryLevel}
                onChange={(e) => setInventoryLevel(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Days *
              </label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Latitude (X) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={latX}
                onChange={(e) => setLatX(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Longitude (X) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={longX}
                onChange={(e) => setLongX(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Flag (0/1) *
              </label>
              <select
                value={promotionFlag}
                onChange={(e) => setPromotionFlag(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value={0}>No Promotion (0)</option>
                <option value={1}>Promotion Active (1)</option>
              </select>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚙️</span>
              Additional Features (Optional)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory ID
              </label>
              <input
                type="number"
                value={inventoryId}
                onChange={(e) => setInventoryId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Lead Time (days)
              </label>
              <input
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Latitude (Y)
              </label>
              <input
                type="number"
                step="0.0001"
                value={latY}
                onChange={(e) => setLatY(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Longitude (Y)
              </label>
              <input
                type="number"
                step="0.0001"
                value={longY}
                onChange={(e) => setLongY(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Available (0/1)
              </label>
              <select
                value={deliveryAvailable}
                onChange={(e) => setDeliveryAvailable(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={0}>Not Available (0)</option>
                <option value={1}>Available (1)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Available (0/1)
              </label>
              <select
                value={pickupAvailable}
                onChange={(e) => setPickupAvailable(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={0}>Not Available (0)</option>
                <option value={1}>Available (1)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Markup Factor
              </label>
              <input
                type="number"
                step="0.01"
                value={markupFactor}
                onChange={(e) => setMarkupFactor(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Prescribed Quantity
              </label>
              <input
                type="number"
                value={prescribedQty}
                onChange={(e) => setPrescribedQty(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Urgency (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={avgUrgency}
                onChange={(e) => setAvgUrgency(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePredict}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Predicting...
              </>
            ) : (
              <>
                <span>🔮</span>
                Predict Demand
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm flex items-center gap-2">
              <span>❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Prediction Result */}
        {prediction !== null && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <span>✅</span>
                  Prediction Result
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Based on the provided inputs, the predicted demand is:
                </p>
                <div className="text-4xl font-bold text-green-700">
                  {prediction}{" "}
                  <span className="text-xl text-gray-600">units</span>
                </div>
              </div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">
                📊
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> Use this prediction to optimize
                inventory management and plan procurement accordingly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
