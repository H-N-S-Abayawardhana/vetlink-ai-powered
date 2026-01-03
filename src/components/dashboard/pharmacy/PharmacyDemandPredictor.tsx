"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Pharmacy {
  id: string;
  name: string;
  location?: {
    lat: number | null;
    lng: number | null;
  };
}

export default function PharmacyDemandPredictor() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Medicine options from inventory
  const [medicineOptions, setMedicineOptions] = useState<string[]>([]);
  const [loadingMedicineData, setLoadingMedicineData] = useState(false);

  // Form state
  const [medicineId, setMedicineId] = useState<string>("");
  const [price, setPrice] = useState<number>(1000.0);
  const [inventoryLevel, setInventoryLevel] = useState<number>(100);
  const [expiryDays, setExpiryDays] = useState<number>(180);
  const [locationLat, setLocationLat] = useState<number>(7.2906);
  const [locationLong, setLocationLong] = useState<number>(80.6337);
  const [promotionFlag, setPromotionFlag] = useState<number>(0);

  // Historical sales data
  const [salesLag1, setSalesLag1] = useState<number>(15);
  const [salesLag3, setSalesLag3] = useState<number>(12);
  const [salesLag7, setSalesLag7] = useState<number>(18);
  const [salesLag14, setSalesLag14] = useState<number>(14);
  const [salesRollingMean7, setSalesRollingMean7] = useState<number>(15.5);
  const [salesRollingMean14, setSalesRollingMean14] = useState<number>(14.8);

  // Batch prediction state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string>("");

  // Tab state
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'info'>('single');

  // Fetch pharmacy data and medicine options
  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        setLoadingData(true);
        // Fetch user's pharmacy
        const pharmacyRes = await fetch("/api/pharmacies");
        const pharmacyData = await pharmacyRes.json();

        if (pharmacyRes.ok && pharmacyData.pharmacies) {
          const userPharmacy = pharmacyData.pharmacies.find(
            (p: any) => p.owner_id === session.user.id,
          );

          if (userPharmacy) {
            setPharmacy(userPharmacy);
            // Set location from pharmacy
            if (userPharmacy.location?.lat && userPharmacy.location?.lng) {
              setLocationLat(userPharmacy.location.lat);
              setLocationLong(userPharmacy.location.lng);
            }

            // Fetch inventory to get medicine options
            try {
              const inventoryRes = await fetch(
                `/api/pharmacies/${userPharmacy.id}/inventory`,
              );
              const inventoryData = await inventoryRes.json();

              if (inventoryRes.ok && inventoryData.inventory) {
                // Extract unique medicine IDs from inventory
                const medicines: string[] = inventoryData.inventory.map(
                  (item: any) => String(item.name || item.id),
                );
                setMedicineOptions([...new Set(medicines)]);
              }
            } catch (err) {
              console.error("Failed to fetch inventory:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch pharmacy data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [session]);

  // Fetch medicine data when Medicine ID is selected
  const handleMedicineIdChange = async (selectedMedicineId: string) => {
    setMedicineId(selectedMedicineId);
    
    if (!selectedMedicineId || !pharmacy?.id) {
      return;
    }

    try {
      setLoadingMedicineData(true);
      const response = await fetch(
        `/api/pharmacy/medicine-data?medicine_id=${encodeURIComponent(selectedMedicineId)}&pharmacy_id=${pharmacy.id}`,
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-populate form fields with fetched data
        if (data.calculated_fields) {
          const fields = data.calculated_fields;
          if (fields.price) setPrice(fields.price);
          if (fields.inventory_level) setInventoryLevel(fields.inventory_level);
          if (fields.expiry_days) setExpiryDays(fields.expiry_days);
          if (fields.promotion_flag !== undefined)
            setPromotionFlag(fields.promotion_flag);
        }

        if (data.location) {
          if (data.location.lat) setLocationLat(data.location.lat);
          if (data.location.lng) setLocationLong(data.location.lng);
        }

        if (data.sales_data) {
          const sales = data.sales_data;
          if (sales.sales_lag_1 !== undefined) setSalesLag1(sales.sales_lag_1);
          if (sales.sales_lag_3 !== undefined) setSalesLag3(sales.sales_lag_3);
          if (sales.sales_lag_7 !== undefined) setSalesLag7(sales.sales_lag_7);
          if (sales.sales_lag_14 !== undefined)
            setSalesLag14(sales.sales_lag_14);
          if (sales.sales_rolling_mean_7 !== undefined)
            setSalesRollingMean7(sales.sales_rolling_mean_7);
          if (sales.sales_rolling_mean_14 !== undefined)
            setSalesRollingMean14(sales.sales_rolling_mean_14);
        }
      } else {
        console.warn("Failed to fetch medicine data:", data.error);
        // Don't show error to user, just log it
      }
    } catch (err) {
      console.error("Error fetching medicine data:", err);
      // Don't show error to user, just log it
    } finally {
      setLoadingMedicineData(false);
    }
  };

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
          medicine_id: medicineId,
          price: price,
          inventory_level: inventoryLevel,
          expiry_days: expiryDays,
          location_lat: locationLat,
          location_long: locationLong,
          promotion_flag: promotionFlag,
          sales_lag_1: salesLag1,
          sales_lag_3: salesLag3,
          sales_lag_7: salesLag7,
          sales_lag_14: salesLag14,
          sales_rolling_mean_7: salesRollingMean7,
          sales_rolling_mean_14: salesRollingMean14,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to predict demand");
      }

      // The API returns HTML from the model (preferred) or prediction number
      // The Gradio model returns HTML, so prioritize that
      if (data.html) {
        setPrediction(data.html);
      } else if (data.prediction) {
        // Fallback: if only prediction number is returned, create a simple display
        setPrediction(`<div style="padding: 20px; text-align: center;"><h3>Predicted Sales: ${data.prediction} units</h3></div>`);
      } else {
        setPrediction("No prediction result received");
      }
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

  const handleBatchPredict = async () => {
    if (!batchFile) {
      setBatchStatus("Please select a CSV file first");
      return;
    }

    setBatchStatus("Processing...");
    setBatchResult(null);

    try {
      const formData = new FormData();
      formData.append("file", batchFile);

      const response = await fetch("/api/pharmacy/batch-predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process batch prediction");
      }

      setBatchResult(data.downloadUrl || data.file);
      setBatchStatus(`✓ Processed ${data.count || 'multiple'} medicines successfully!`);
    } catch (err) {
      setBatchStatus(
        err instanceof Error
          ? `Error: ${err.message}`
          : "Failed to process batch prediction. Please try again.",
      );
      console.error("Batch prediction error:", err);
    }
  };

  const handleReset = () => {
    setMedicineId("");
    setPrice(1000.0);
    setInventoryLevel(100);
    setExpiryDays(180);
    setLocationLat(7.2906);
    setLocationLong(80.6337);
    setPromotionFlag(0);
    setSalesLag1(15);
    setSalesLag3(12);
    setSalesLag7(18);
    setSalesLag14(14);
    setSalesRollingMean7(15.5);
    setSalesRollingMean14(14.8);
    setError(null);
    setPrediction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <span>🏥</span>
            Pharmacy Sales Prediction & Inventory Optimization
        </h2>
          <p className="text-blue-100 text-sm">
            Powered by XGBoost Machine Learning Model
          </p>
          <p className="text-blue-100 text-xs mt-2">
            This application predicts pharmaceutical sales demand and provides intelligent inventory management recommendations.
          </p>
        </div>
      </div>

      {loadingData && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading pharmacy data...</p>
        </div>
      )}

      {!loadingData && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'single'
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('single')}
              >
                📊 Single Prediction
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'batch'
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('batch')}
              >
                📁 Batch Prediction
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'info'
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('info')}
              >
                ℹ️ Model Information
              </button>
            </nav>
            </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Single Prediction Tab */}
            {activeTab === 'single' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter medicine details for sales prediction</h3>

                  {/* Medicine Details Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine ID *
              </label>
                        <div className="relative">
                          <select
                value={medicineId}
                            onChange={(e) => handleMedicineIdChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                            disabled={loadingMedicineData}
                          >
                            <option value="">Select Medicine ID</option>
                            {medicineOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {loadingMedicineData && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                        </div>
                        {medicineId && (
                          <p className="text-xs text-gray-500 mt-1">
                            {loadingMedicineData
                              ? "Loading medicine data..."
                              : "✓ Data auto-populated from database"}
                          </p>
                        )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Price per unit"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Inventory *
              </label>
              <input
                type="number"
                value={inventoryLevel}
                onChange={(e) => setInventoryLevel(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Current stock level"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Days to Expiry *
              </label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Days until expiration"
                required
              />
                      </div>
            </div>

                    <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location Latitude *
              </label>
              <input
                type="number"
                step="0.0001"
                          value={locationLat}
                          onChange={(e) => setLocationLat(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Pharmacy latitude"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location Longitude *
              </label>
              <input
                type="number"
                step="0.0001"
                          value={locationLong}
                          onChange={(e) => setLocationLong(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Pharmacy longitude"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Promotion Active? *
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value={0}
                              checked={promotionFlag === 0}
                              onChange={(e) => setPromotionFlag(Number(e.target.value))}
                              className="mr-2"
                            />
                            No (0)
              </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value={1}
                              checked={promotionFlag === 1}
                onChange={(e) => setPromotionFlag(Number(e.target.value))}
                              className="mr-2"
                            />
                            Yes (1)
                          </label>
                        </div>
                      </div>
            </div>
          </div>

                  {/* Historical Sales Data Section */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Historical Sales Data (for trend analysis)</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales (1 day ago) *
              </label>
              <input
                type="number"
                          value={salesLag1}
                          onChange={(e) => setSalesLag1(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Previous day sales"
                          required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales (3 days ago) *
              </label>
              <input
                type="number"
                          value={salesLag3}
                          onChange={(e) => setSalesLag3(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Sales 3 days prior"
                          required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales (7 days ago) *
              </label>
              <input
                type="number"
                          value={salesLag7}
                          onChange={(e) => setSalesLag7(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Sales 7 days prior"
                          required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales (14 days ago) *
              </label>
              <input
                type="number"
                          value={salesLag14}
                          onChange={(e) => setSalesLag14(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Sales 14 days prior"
                          required
              />
            </div>
            </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          7-Day Average Sales *
              </label>
              <input
                type="number"
                step="0.01"
                          value={salesRollingMean7}
                          onChange={(e) => setSalesRollingMean7(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Rolling 7-day average"
                          required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                          14-Day Average Sales *
              </label>
              <input
                type="number"
                step="0.01"
                          value={salesRollingMean14}
                          onChange={(e) => setSalesRollingMean14(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Rolling 14-day average"
                          required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
                  <div className="flex gap-3 mb-6">
          <button
            onClick={handlePredict}
                      disabled={loading || !medicineId}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Predicting...
              </>
            ) : (
              <>
                <span>🔮</span>
                          Predict Sales & Generate Recommendations
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Error Display */}
        {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm flex items-center gap-2">
              <span>❌</span>
              {error}
            </p>
          </div>
        )}

                  {/* Prediction Results */}
                  {prediction && (
                    <div className="mb-6">
                      <div
                        className="border rounded-lg overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: prediction }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Batch Prediction Tab */}
            {activeTab === 'batch' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV file for batch predictions</h3>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Required columns:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• medicine_id, price, inventory_level, expiry_days</li>
                      <li>• location_lat, location_long, promotion_flag</li>
                      <li>• sales_lag_1, sales_lag_3, sales_lag_7, sales_lag_14</li>
                      <li>• sales_rolling_mean_7, sales_rolling_mean_14</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CSV File
                      </label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleBatchPredict}
                      disabled={!batchFile}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-lg"
                    >
                      <span>📊</span>
                      Process Batch Predictions
                    </button>

                    {batchStatus && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-800 text-sm">{batchStatus}</p>
                      </div>
                    )}

                    {batchResult && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Download Results
                        </label>
                        <a
                          href={batchResult}
                          download="predictions_output.csv"
                          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <span>📥</span>
                          Download CSV Results
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Model Information Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">About This Model</h3>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="text-xl font-bold text-blue-900 mb-3">XGBoost Regression Model</h4>
                      <ul className="space-y-2 text-blue-800">
                        <li><strong>Algorithm:</strong> Gradient Boosting Decision Trees</li>
                        <li><strong>Features:</strong> 32 engineered features including temporal, lag, and rolling statistics</li>
                        <li><strong>Performance Metrics:</strong></li>
                        <ul className="ml-6 space-y-1">
                          <li>• Mean Absolute Error (MAE): ~3-5 units</li>
                          <li>• R² Score: ~0.85-0.92</li>
                          <li>• Training Time: ~2-3 seconds</li>
                        </ul>
                      </ul>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Features Used:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Temporal Features:</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Month, day, week, quarter, weekend flags</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Lag Features:</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Previous 1, 3, 7, 14 days sales</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Rolling Statistics:</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>• 3, 7, 14-day moving averages and standard deviation</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Inventory Features:</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Stock levels, low/high stock flags</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Price Features:</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Price per unit, high price indicators</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Expiry Features:</h5>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Days to expiry, near-expiry flags</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-800 mb-2">Interaction Features:</h5>
                        <ul className="space-y-1 text-gray-600 text-sm">
                          <li>• Price-promotion, inventory-expiry interactions</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-yellow-900 mb-3">Priority Levels:</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🔴</span>
                          <div>
                            <strong className="text-red-700">CRITICAL:</strong>
                            <span className="text-red-600"> &lt; 5 days stock remaining - Immediate action required</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🟠</span>
                          <div>
                            <strong className="text-orange-700">URGENT:</strong>
                            <span className="text-orange-600"> &lt; 10 days stock - Restock within 2-3 days</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🟡</span>
                          <div>
                            <strong className="text-yellow-700">HIGH:</strong>
                            <span className="text-yellow-600"> &lt; 15 days stock - Plan restock soon</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🔵</span>
                          <div>
                            <strong className="text-blue-700">MEDIUM:</strong>
                            <span className="text-blue-600"> Excess inventory or monitoring needed</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🟢</span>
              <div>
                            <strong className="text-green-700">LOW:</strong>
                            <span className="text-green-600"> Optimal stock levels</span>
                          </div>
                        </div>
                </div>
              </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-green-900 mb-3">Use Cases:</h4>
                      <ul className="space-y-2 text-green-800">
                        <li>• Daily inventory management</li>
                        <li>• Demand forecasting</li>
                        <li>• Procurement planning</li>
                        <li>• Expiry management</li>
                        <li>• Promotion effectiveness analysis</li>
                      </ul>
              </div>
            </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600">
                    <p className="text-sm">
                      <strong>🏥 Pharmacy Sales Optimizer</strong> | Powered by XGBoost & Gradio
                    </p>
                    <p className="text-xs mt-1">
                      For support or questions, please contact your system administrator
                    </p>
                  </div>
            </div>
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}
