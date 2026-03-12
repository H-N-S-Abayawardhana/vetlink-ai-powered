"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

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

  const emptyField = "";

  // Form state
  const [medicineId, setMedicineId] = useState<string>("");
  const [price, setPrice] = useState<number | "">(emptyField);
  const [inventoryLevel, setInventoryLevel] = useState<number | "">(emptyField);
  const [expiryDays, setExpiryDays] = useState<number | "">(emptyField);
  const [locationLat, setLocationLat] = useState<number | "">(emptyField);
  const [locationLong, setLocationLong] = useState<number | "">(emptyField);
  const [promotionFlag, setPromotionFlag] = useState<number | "">(emptyField);

  // Historical sales data
  const [salesLag1, setSalesLag1] = useState<number | "">(emptyField);
  const [salesLag3, setSalesLag3] = useState<number | "">(emptyField);
  const [salesLag7, setSalesLag7] = useState<number | "">(emptyField);
  const [salesLag14, setSalesLag14] = useState<number | "">(emptyField);
  const [salesRollingMean7, setSalesRollingMean7] = useState<number | "">(
    emptyField,
  );
  const [salesRollingMean14, setSalesRollingMean14] = useState<number | "">(
    emptyField,
  );

  // Batch prediction state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string>("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"single" | "batch" | "info">(
    "single",
  );
  const inputClassName =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
  const sectionClassName = "rounded-lg border border-gray-200 bg-white p-5";

  const parseNumberInput = (value: string): number | "" =>
    value === "" ? "" : Number(value);

  const clearFormFields = () => {
    setPrice("");
    setInventoryLevel("");
    setExpiryDays("");
    setLocationLat("");
    setLocationLong("");
    setPromotionFlag("");
    setSalesLag1("");
    setSalesLag3("");
    setSalesLag7("");
    setSalesLag14("");
    setSalesRollingMean7("");
    setSalesRollingMean14("");
  };

  const hasIncompleteFields =
    !medicineId ||
    price === "" ||
    inventoryLevel === "" ||
    expiryDays === "" ||
    locationLat === "" ||
    locationLong === "" ||
    promotionFlag === "" ||
    salesLag1 === "" ||
    salesLag3 === "" ||
    salesLag7 === "" ||
    salesLag14 === "" ||
    salesRollingMean7 === "" ||
    salesRollingMean14 === "";

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
    setError(null);
    setPrediction(null);

    if (!selectedMedicineId || !pharmacy?.id) {
      clearFormFields();
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
          setPrice(fields.price ?? "");
          setInventoryLevel(fields.inventory_level ?? "");
          setExpiryDays(fields.expiry_days ?? "");
          if (fields.promotion_flag !== undefined)
            setPromotionFlag(fields.promotion_flag);
          else setPromotionFlag("");
        }

        if (data.location) {
          setLocationLat(data.location.lat ?? "");
          setLocationLong(data.location.lng ?? "");
        }

        if (data.sales_data) {
          const sales = data.sales_data;
          setSalesLag1(sales.sales_lag_1 ?? "");
          setSalesLag3(sales.sales_lag_3 ?? "");
          setSalesLag7(sales.sales_lag_7 ?? "");
          setSalesLag14(sales.sales_lag_14 ?? "");
          setSalesRollingMean7(sales.sales_rolling_mean_7 ?? "");
          setSalesRollingMean14(sales.sales_rolling_mean_14 ?? "");
        }
      } else {
        console.warn("Failed to fetch medicine data:", data.error);
        clearFormFields();
        // Don't show error to user, just log it
      }
    } catch (err) {
      console.error("Error fetching medicine data:", err);
      clearFormFields();
      // Don't show error to user, just log it
    } finally {
      setLoadingMedicineData(false);
    }
  };

  const handlePredict = async () => {
    if (hasIncompleteFields) {
      setError(
        "Select a Medicine ID and complete all fields before predicting.",
      );
      return;
    }

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
          price: Number(price),
          inventory_level: Number(inventoryLevel),
          expiry_days: Number(expiryDays),
          location_lat: Number(locationLat),
          location_long: Number(locationLong),
          promotion_flag: Number(promotionFlag),
          sales_lag_1: Number(salesLag1),
          sales_lag_3: Number(salesLag3),
          sales_lag_7: Number(salesLag7),
          sales_lag_14: Number(salesLag14),
          sales_rolling_mean_7: Number(salesRollingMean7),
          sales_rolling_mean_14: Number(salesRollingMean14),
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
        setPrediction(
          `<div style="padding: 20px; text-align: center;"><h3>Predicted Sales: ${data.prediction} units</h3></div>`,
        );
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
      setBatchStatus(
        `✓ Processed ${data.count || "multiple"} medicines successfully!`,
      );
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
    clearFormFields();
    setError(null);
    setPrediction(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                Demand prediction
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-gray-900">
                Pharmacy Sales Prediction
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Predict medicine demand and review inventory risk signals using
                your pharmacy data and recent sales patterns.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 lg:max-w-sm">
              Powered by the XGBoost forecasting model with inventory-aware
              recommendations for restocking and expiry planning.
            </div>
          </div>
        </div>

        {loadingData && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-gray-600">Loading pharmacy data...</p>
          </div>
        )}

        {!loadingData && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
              {[
                { id: "single", label: "Single Prediction" },
                { id: "batch", label: "Batch Prediction" },
                { id: "info", label: "Model Information" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    setActiveTab(tab.id as "single" | "batch" | "info")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pt-6">
              {/* Single Prediction Tab */}
              {activeTab === "single" && (
                <div className="space-y-6">
                  <div className={sectionClassName}>
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Enter medicine details for sales prediction
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Choose a medicine to auto-fill available data, then
                        adjust inputs before generating the forecast.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine ID *
                          </label>
                          <div className="relative">
                            <select
                              value={medicineId}
                              onChange={(e) =>
                                handleMedicineIdChange(e.target.value)
                              }
                              className={inputClassName}
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
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                              </div>
                            )}
                          </div>
                          {medicineId && (
                            <p className="mt-1 text-xs text-gray-500">
                              {loadingMedicineData
                                ? "Loading medicine data..."
                                : "Data auto-populated from inventory records"}
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
                            onChange={(e) =>
                              setPrice(parseNumberInput(e.target.value))
                            }
                            className={inputClassName}
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
                            onChange={(e) =>
                              setInventoryLevel(
                                parseNumberInput(e.target.value),
                              )
                            }
                            className={inputClassName}
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
                            onChange={(e) =>
                              setExpiryDays(parseNumberInput(e.target.value))
                            }
                            className={inputClassName}
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
                            onChange={(e) =>
                              setLocationLat(parseNumberInput(e.target.value))
                            }
                            className={inputClassName}
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
                            onChange={(e) =>
                              setLocationLong(parseNumberInput(e.target.value))
                            }
                            className={inputClassName}
                            placeholder="Pharmacy longitude"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Promotion Active? *
                          </label>
                          <div className="flex gap-3">
                            <label
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                                promotionFlag === 0
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 bg-white text-gray-700"
                              }`}
                            >
                              <input
                                type="radio"
                                value={0}
                                checked={promotionFlag === 0}
                                onChange={(e) =>
                                  setPromotionFlag(
                                    parseNumberInput(e.target.value),
                                  )
                                }
                                className="sr-only"
                              />
                              No
                            </label>
                            <label
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                                promotionFlag === 1
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 bg-white text-gray-700"
                              }`}
                            >
                              <input
                                type="radio"
                                value={1}
                                checked={promotionFlag === 1}
                                onChange={(e) =>
                                  setPromotionFlag(
                                    parseNumberInput(e.target.value),
                                  )
                                }
                                className="sr-only"
                              />
                              Yes
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={sectionClassName}>
                    <h4 className="mb-4 text-base font-semibold text-gray-900">
                      Historical Sales Data (for trend analysis)
                    </h4>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sales (1 day ago) *
                        </label>
                        <input
                          type="number"
                          value={salesLag1}
                          onChange={(e) =>
                            setSalesLag1(parseNumberInput(e.target.value))
                          }
                          className={inputClassName}
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
                          onChange={(e) =>
                            setSalesLag3(parseNumberInput(e.target.value))
                          }
                          className={inputClassName}
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
                          onChange={(e) =>
                            setSalesLag7(parseNumberInput(e.target.value))
                          }
                          className={inputClassName}
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
                          onChange={(e) =>
                            setSalesLag14(parseNumberInput(e.target.value))
                          }
                          className={inputClassName}
                          placeholder="Sales 14 days prior"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          7-Day Average Sales *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={salesRollingMean7}
                          onChange={(e) =>
                            setSalesRollingMean7(
                              parseNumberInput(e.target.value),
                            )
                          }
                          className={inputClassName}
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
                          onChange={(e) =>
                            setSalesRollingMean14(
                              parseNumberInput(e.target.value),
                            )
                          }
                          className={inputClassName}
                          placeholder="Rolling 14-day average"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handlePredict}
                      disabled={loading || hasIncompleteFields}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-emerald-700 sm:flex-1"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Predicting...
                        </>
                      ) : (
                        <>Predict Sales</>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-gray-50"
                    >
                      Reset
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-red-800 text-sm flex items-center gap-2">
                        {error}
                      </p>
                    </div>
                  )}

                  {prediction && (
                    <div className={sectionClassName}>
                      <h4 className="mb-4 text-base font-semibold text-gray-900">
                        Prediction Result
                      </h4>
                      <div
                        className="overflow-hidden rounded-lg border border-gray-200"
                        dangerouslySetInnerHTML={{ __html: prediction }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Batch Prediction Tab */}
              {activeTab === "batch" && (
                <div className="space-y-6">
                  <div className={sectionClassName}>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Upload CSV file for batch predictions
                    </h3>

                    <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <h4 className="mb-2 font-semibold text-emerald-900">
                        Required columns:
                      </h4>
                      <ul className="space-y-1 text-sm text-emerald-800">
                        <li>
                          • medicine_id, price, inventory_level, expiry_days
                        </li>
                        <li>• location_lat, location_long, promotion_flag</li>
                        <li>
                          • sales_lag_1, sales_lag_3, sales_lag_7, sales_lag_14
                        </li>
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
                          onChange={(e) =>
                            setBatchFile(e.target.files?.[0] || null)
                          }
                          className={inputClassName}
                        />
                      </div>

                      <button
                        onClick={handleBatchPredict}
                        disabled={!batchFile}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-emerald-700"
                      >
                        Process Batch Predictions
                      </button>

                      {batchStatus && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                          >
                            Download CSV Results
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Model Information Tab */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-6 text-lg font-semibold text-gray-900">
                      About This Model
                    </h3>

                    <div className="space-y-6">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Features Used:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              Temporal Features:
                            </h5>
                            <ul className="space-y-1 text-gray-600">
                              <li>
                                • Month, day, week, quarter, weekend flags
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              Lag Features:
                            </h5>
                            <ul className="space-y-1 text-gray-600">
                              <li>• Previous 1, 3, 7, 14 days sales</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              Rolling Statistics:
                            </h5>
                            <ul className="space-y-1 text-gray-600">
                              <li>
                                • 3, 7, 14-day moving averages and standard
                                deviation
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              Inventory Features:
                            </h5>
                            <ul className="space-y-1 text-gray-600">
                              <li>• Stock levels, low/high stock flags</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              Price Features:
                            </h5>
                            <ul className="space-y-1 text-gray-600">
                              <li>• Price per unit, high price indicators</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">
                              Expiry Features:
                            </h5>
                            <ul className="space-y-1 text-gray-600">
                              <li>• Days to expiry, near-expiry flags</li>
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-800 mb-2">
                            Interaction Features:
                          </h5>
                          <ul className="space-y-1 text-gray-600 text-sm">
                            <li>
                              • Price-promotion, inventory-expiry interactions
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                        <h4 className="text-lg font-semibold text-orange-900 mb-3">
                          Priority Levels:
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔴</span>
                            <div>
                              <strong className="text-red-700">
                                CRITICAL:
                              </strong>
                              <span className="text-red-600">
                                {" "}
                                &lt; 5 days stock remaining - Immediate action
                                required
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🟠</span>
                            <div>
                              <strong className="text-orange-700">
                                URGENT:
                              </strong>
                              <span className="text-orange-600">
                                {" "}
                                &lt; 10 days stock - Restock within 2-3 days
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🟡</span>
                            <div>
                              <strong className="text-yellow-700">HIGH:</strong>
                              <span className="text-yellow-600">
                                {" "}
                                &lt; 15 days stock - Plan restock soon
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔵</span>
                            <div>
                              <strong className="text-blue-700">MEDIUM:</strong>
                              <span className="text-blue-600">
                                {" "}
                                Excess inventory or monitoring needed
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🟢</span>
                            <div>
                              <strong className="text-green-700">LOW:</strong>
                              <span className="text-green-600">
                                {" "}
                                Optimal stock levels
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                        <h4 className="text-lg font-semibold text-emerald-900 mb-3">
                          Use Cases:
                        </h4>
                        <ul className="space-y-2 text-emerald-800">
                          <li>• Daily inventory management</li>
                          <li>• Demand forecasting</li>
                          <li>• Procurement planning</li>
                          <li>• Expiry management</li>
                          <li>• Promotion effectiveness analysis</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6 text-center text-gray-600">
                      <p className="text-sm">
                        <strong>Pharmacy Sales Optimizer</strong> | Powered by
                        XGBoost and Gradio
                      </p>
                      <p className="text-xs mt-1">
                        For support or questions, please contact your system
                        administrator
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <LoadingOverlay
          title="Predicting pharmacy demand"
          description="Reviewing inventory, pricing, location, and sales trends to forecast upcoming sales."
        />
      )}
    </>
  );
}
