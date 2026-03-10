"use client";

import { useState, useRef } from "react";
import { AuthGuard } from "@/lib/auth-guard";
import Image from "next/image";
import {
  Upload,
  X,
  Search,
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  Trash2,
  ClipboardCopy,
  Check,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { formatLKR } from "@/lib/currency";

export default function FindFromPrescriptionPage() {
  return (
    <AuthGuard
      allowedRoles={["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"]}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <FindFromPrescriptionModule />
      </div>
    </AuthGuard>
  );
}

function FindFromPrescriptionModule() {
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(
    null,
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<
    Array<{
      id: string;
      name: string;
      form: string;
      strength: string;
      stock: number;
      price: number;
      expiry: string | null;
      image: string | null;
      pharmacyId: string;
      pharmacyName: string;
      pharmacyAddress: string;
      pickup_available: boolean;
      delivery_available: boolean;
      delivery_fee: number;
    }>
  >([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [extractedItems, setExtractedItems] = useState<
    Array<{ name: string; quantity: number }>
  >([]);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images only for API)
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP, GIF)");
      return;
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setExtractedText(null);
    setAvailableProducts([]);
    setUploadedFile(file);

    // Preview image
    const reader = new FileReader();
    reader.onload = (event) => {
      setPrescriptionImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractItems = async () => {
    if (!uploadedFile) {
      setError("Please upload a prescription image first");
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedText(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      const res = await fetch("/api/prescription/read", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to read prescription");
      }
      setExtractedText(data.text ?? "No text extracted.");
      setSuccess(
        "Prescription text extracted. You can copy it or add medications below to find products.",
      );
      // Fetch pharmacies that have inventory matching the prescription text
      setLoadingPharmacies(true);
      try {
        const pharmRes = await fetch("/api/pharmacies/by-prescription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.text ?? "" }),
        });
        const pharmData = await pharmRes.json();
        if (pharmRes.ok && pharmData.products) {
          setAvailableProducts(pharmData.products);
        } else {
          setAvailableProducts([]);
        }
      } catch {
        setAvailableProducts([]);
      } finally {
        setLoadingPharmacies(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to read prescription",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const handleManualEntry = () => {
    setExtractedItems([...extractedItems, { name: "", quantity: 1 }]);
  };

  const handleItemChange = (
    index: number,
    field: "name" | "quantity",
    value: string | number,
  ) => {
    setExtractedItems(
      extractedItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleRemoveItem = (index: number) => {
    setExtractedItems(extractedItems.filter((_, i) => i !== index));
  };

  // Dummy pharmacies data
  const dummyPharmacies = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "HealthPlus Pharmacy",
      address: "123 Main Street, Colombo 05",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "VetCare Pharmacy",
      address: "456 Galle Road, Colombo 03",
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "PetMed Express",
      address: "789 Kandy Road, Kandy",
    },
  ];

  // Dummy products data
  const dummyProducts = [
    {
      id: "1",
      uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Amoxicillin",
      form: "Capsule",
      strength: "250 mg",
      stock: 120,
      price: 450.0,
      expiry: "2026-11-01",
      image: "/uploads/pharmacy/Amoxicillin.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo 05",
    },
    {
      id: "2",
      uuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Prednisone",
      form: "Tablet",
      strength: "5 mg",
      stock: 40,
      price: 650.0,
      expiry: "2027-02-15",
      image: "/uploads/pharmacy/Prednisone.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo 05",
    },
    {
      id: "3",
      uuid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Ivermectin",
      form: "Oral suspension",
      strength: "1%",
      stock: 25,
      price: 850.0,
      expiry: "2026-07-28",
      image: "/uploads/pharmacy/Ivermectin.jpeg",
      pharmacyId: "11111111-1111-1111-1111-111111111111",
      pharmacyName: "HealthPlus Pharmacy",
      pharmacyAddress: "123 Main Street, Colombo 05",
    },
    {
      id: "4",
      uuid: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      name: "Metronidazole",
      form: "Tablet",
      strength: "500 mg",
      stock: 60,
      price: 350.0,
      expiry: "2026-09-10",
      image: "/uploads/pharmacy/Metronidazole.jpeg",
      pharmacyId: "22222222-2222-2222-2222-222222222222",
      pharmacyName: "VetCare Pharmacy",
      pharmacyAddress: "456 Galle Road, Colombo 03",
    },
    {
      id: "5",
      uuid: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      name: "Doxycycline",
      form: "Capsule",
      strength: "100 mg",
      stock: 80,
      price: 550.0,
      expiry: "2027-01-20",
      image: "/uploads/pharmacy/Doxycycline.jpeg",
      pharmacyId: "22222222-2222-2222-2222-222222222222",
      pharmacyName: "VetCare Pharmacy",
      pharmacyAddress: "456 Galle Road, Colombo 03",
    },
    {
      id: "6",
      uuid: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      name: "Carprofen",
      form: "Tablet",
      strength: "75 mg",
      stock: 35,
      price: 750.0,
      expiry: "2026-12-05",
      image: "/uploads/pharmacy/Carprofen.jpeg",
      pharmacyId: "22222222-2222-2222-2222-222222222222",
      pharmacyName: "VetCare Pharmacy",
      pharmacyAddress: "456 Galle Road, Colombo 03",
    },
    {
      id: "7",
      uuid: "gggggggg-gggg-gggg-gggg-gggggggggggg",
      name: "Amoxicillin",
      form: "Capsule",
      strength: "500 mg",
      stock: 90,
      price: 520.0,
      expiry: "2026-10-15",
      image: "/uploads/pharmacy/Amoxicillin.jpeg",
      pharmacyId: "33333333-3333-3333-3333-333333333333",
      pharmacyName: "PetMed Express",
      pharmacyAddress: "789 Kandy Road, Kandy",
    },
    {
      id: "8",
      uuid: "hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh",
      name: "Prednisone",
      form: "Tablet",
      strength: "10 mg",
      stock: 50,
      price: 680.0,
      expiry: "2027-03-20",
      image: "/uploads/pharmacy/Prednisone.jpeg",
      pharmacyId: "33333333-3333-3333-3333-333333333333",
      pharmacyName: "PetMed Express",
      pharmacyAddress: "789 Kandy Road, Kandy",
    },
    {
      id: "9",
      uuid: "iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii",
      name: "Ivermectin",
      form: "Injection",
      strength: "1%",
      stock: 20,
      price: 920.0,
      expiry: "2026-08-30",
      image: "/uploads/pharmacy/Ivermectin.jpeg",
      pharmacyId: "33333333-3333-3333-3333-333333333333",
      pharmacyName: "PetMed Express",
      pharmacyAddress: "789 Kandy Road, Kandy",
    },
  ];

  const handleFindProducts = async () => {
    const validItems = extractedItems.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      setError("Please add at least one medication");
      return;
    }

    setSearching(true);
    setError(null);
    setMatchedProducts([]);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Use dummy data for now
      const matches: any[] = [];

      validItems.forEach((extractedItem) => {
        const matched = dummyProducts.filter((product) =>
          product.name.toLowerCase().includes(extractedItem.name.toLowerCase()),
        );

        if (matched.length > 0) {
          matches.push(...matched);
        }
      });

      // If no matches found, show some sample products anyway for demo
      if (matches.length === 0) {
        setMatchedProducts(dummyProducts.slice(0, 6));
        setSuccess("Showing sample products from available pharmacies");
      } else {
        setMatchedProducts(matches);
        setSuccess(
          `Found ${matches.length} matching product${matches.length > 1 ? "s" : ""}!`,
        );
      }
    } catch (err) {
      console.error("Error finding products:", err);
      setError("Failed to find products. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setPrescriptionImage(null);
    setUploadedFile(null);
    setExtractedText(null);
    setAvailableProducts([]);
    setExtractedItems([]);
    setMatchedProducts([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Find Pet Medicines From Prescription
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Upload your prescription and find medications quickly
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-800 text-sm flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="cursor-pointer text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-800 text-sm flex-1">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="cursor-pointer text-green-400 hover:text-green-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Prescription
            </h2>

            {!prescriptionImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
              >
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  Click to upload prescription
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, WebP, GIF (Max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={prescriptionImage}
                    alt="Prescription"
                    width={600}
                    height={400}
                    className="w-full h-auto object-contain bg-gray-50"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleExtractItems}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Reading...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Read prescription
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extracted text from prescription */}
          {extractedText !== null && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Prescription text
                </h2>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-auto max-h-[280px]">
                {extractedText}
              </pre>
            </div>
          )}

          {/* Extracted Items */}
          {extractedItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Extracted Medications
                </h2>
                <button
                  onClick={handleManualEntry}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Manually
                </button>
              </div>

              <div className="space-y-3">
                {extractedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      placeholder="Medication name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-purple-500"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-purple-500"
                    />
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleFindProducts}
                disabled={
                  searching || extractedItems.every((i) => !i.name.trim())
                }
                className="w-full mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {searching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Find Products
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Available products (from prescription text) */}
          {loadingPharmacies && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>Finding products that match your prescription...</span>
              </div>
            </div>
          )}
          {!loadingPharmacies && availableProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
                Products matching your prescription
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Buy from these pharmacies. Each product shows the pharmacy that
                has it in stock.
              </p>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {availableProducts.map((product) => (
                  <div
                    key={`${product.id}-${product.pharmacyId}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex gap-4">
                      {/* Product image */}
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl">💊</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-3">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {product.form}
                            {product.strength && ` — ${product.strength}`}
                          </p>
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                            <span className="text-lg font-bold text-purple-600">
                              {formatLKR(product.price)}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                product.stock > 10
                                  ? "bg-green-100 text-green-700"
                                  : product.stock > 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              Stock: {product.stock}
                            </span>
                          </div>
                          {product.expiry && (
                            <p className="text-xs text-gray-500 mt-1">
                              Exp:{" "}
                              {new Date(product.expiry).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Available at
                          </p>
                          <p className="font-medium text-gray-900 text-sm">
                            {product.pharmacyName}
                          </p>
                          {product.pharmacyAddress && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              {product.pharmacyAddress}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {product.pickup_available && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
                                <Package className="w-3 h-3" />
                                Pickup
                              </span>
                            )}
                            {product.delivery_available && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                                <Truck className="w-3 h-3" />
                                Delivery
                                {product.delivery_fee > 0 && (
                                  <span> (LKR {product.delivery_fee})</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={`/dashboard/pharmacy/shopping?product=${encodeURIComponent(product.name)}&pharmacy=${encodeURIComponent(product.pharmacyId)}`}
                          className="mt-2 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to cart
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loadingPharmacies &&
            extractedText &&
            availableProducts.length === 0 &&
            matchedProducts.length === 0 && (
              <div className="bg-white rounded-lg p-6 sm:p-8 shadow-md border border-gray-100 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  No matching products
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  No products in our system match this prescription. Try adding
                  medications manually to search.
                </p>
              </div>
            )}

          {matchedProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Available Products ({matchedProducts.length})
                </h2>
                <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  💡{" "}
                  <strong>
                    You can buy these products from these pharmacies:
                  </strong>{" "}
                  Products are grouped by pharmacy for easy comparison and
                  purchase.
                </p>
              </div>

              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {(() => {
                  // Group products by pharmacy
                  type PharmacyGroup = {
                    pharmacyId: string;
                    pharmacyName: string;
                    pharmacyAddress?: string;
                    products: any[];
                  };

                  const groupedByPharmacy = matchedProducts.reduce(
                    (acc, product) => {
                      const key = `${product.pharmacyId}-${product.pharmacyName}`;
                      if (!acc[key]) {
                        acc[key] = {
                          pharmacyId: product.pharmacyId,
                          pharmacyName: product.pharmacyName,
                          pharmacyAddress: product.pharmacyAddress,
                          products: [],
                        };
                      }
                      acc[key].products.push(product);
                      return acc;
                    },
                    {} as Record<string, PharmacyGroup>,
                  );

                  return (
                    Object.values(groupedByPharmacy) as PharmacyGroup[]
                  ).map((pharmacyGroup, groupIndex) => (
                    <div
                      key={pharmacyGroup.pharmacyId}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Pharmacy Header */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">
                              {pharmacyGroup.pharmacyName}
                            </h3>
                            {pharmacyGroup.pharmacyAddress && (
                              <p className="text-purple-100 text-sm flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {pharmacyGroup.pharmacyAddress}
                              </p>
                            )}
                            <p className="text-purple-100 text-xs mt-1">
                              {pharmacyGroup.products.length} product
                              {pharmacyGroup.products.length > 1
                                ? "s"
                                : ""}{" "}
                              available
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="p-4 space-y-3 bg-gray-50">
                        {pharmacyGroup.products.map((product, index) => (
                          <div
                            key={`${product.id}-${product.pharmacyId}-${index}`}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-4">
                              {product.image ? (
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">💊</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 mb-1">
                                  {product.name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {product.form}
                                  {product.strength && ` — ${product.strength}`}
                                </p>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-purple-600">
                                      {formatLKR(product.price)}
                                    </span>
                                    <span
                                      className={`text-sm px-2 py-1 rounded-full ${
                                        (product.stock || 0) > 10
                                          ? "bg-green-100 text-green-700"
                                          : (product.stock || 0) > 0
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      Stock: {product.stock || 0}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      window.location.href = `/dashboard/pharmacy/shopping?product=${encodeURIComponent(product.name)}&pharmacy=${encodeURIComponent(product.pharmacyId)}`;
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {extractedItems.length === 0 &&
            matchedProducts.length === 0 &&
            !loadingPharmacies &&
            availableProducts.length === 0 &&
            !extractedText && (
              <div className="bg-white rounded-lg p-8 sm:p-12 shadow-md border border-gray-100 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  Upload a prescription to get started
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Extract medications and find available products
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
