"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Package,
  Truck,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function PharmacyRegister() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    phone: "",
    email: "",
    pickup: true,
    delivery: false,
    delivery_fee: 0,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: form.name,
        address: form.address,
        location: { lat: Number(form.lat), lng: Number(form.lng) },
        contact: { phone: form.phone, email: form.email },
        delivery: {
          pickup: form.pickup,
          delivery: form.delivery,
          delivery_fee: Number(form.delivery_fee),
        },
      };

      const res = await fetch("/api/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Pharmacy registered successfully! 🎉");
        setMessageType("success");
        // Reset form after successful registration
        setTimeout(() => {
          setForm({
            name: "",
            address: "",
            lat: "",
            lng: "",
            phone: "",
            email: "",
            pickup: true,
            delivery: false,
            delivery_fee: 0,
          });
        }, 2000);
      } else {
        setMessage(data.error || "Failed to register pharmacy");
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("An error occurred while registering. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Register Your Pharmacy
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our network and start managing your pharmacy inventory with
            AI-powered demand prediction
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Success/Error Message */}
          {message && (
            <div
              className={`mx-6 mt-6 p-4 rounded-xl flex items-start gap-3 ${
                messageType === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium flex-1">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Basic Information
                </h2>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Pharmacy Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter pharmacy name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Enter full address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lat"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Latitude
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="lat"
                      name="lat"
                      type="number"
                      step="any"
                      placeholder="e.g., 6.9271"
                      value={form.lat}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="lng"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Longitude
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="lng"
                      name="lng"
                      type="number"
                      step="any"
                      placeholder="e.g., 79.8612"
                      value={form.lng}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 pb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Contact Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+94 XX XXX XXXX"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="pharmacy@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Options Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 pb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delivery Options
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 group">
                  <input
                    type="checkbox"
                    name="pickup"
                    checked={form.pickup}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`flex-1 flex items-center gap-3 ${
                      form.pickup
                        ? "text-blue-700"
                        : "text-gray-600 group-hover:text-blue-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        form.pickup
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 group-hover:border-blue-400"
                      }`}
                    >
                      {form.pickup && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <Package className="w-5 h-5" />
                    <span className="font-medium">Pickup Available</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 group">
                  <input
                    type="checkbox"
                    name="delivery"
                    checked={form.delivery}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`flex-1 flex items-center gap-3 ${
                      form.delivery
                        ? "text-blue-700"
                        : "text-gray-600 group-hover:text-blue-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        form.delivery
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 group-hover:border-blue-400"
                      }`}
                    >
                      {form.delivery && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <Truck className="w-5 h-5" />
                    <span className="font-medium">Delivery Available</span>
                  </div>
                </label>

                {form.delivery && (
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="delivery_fee"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Delivery Fee (LKR)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        id="delivery_fee"
                        name="delivery_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.delivery_fee}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:min-w-[200px] px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Register Pharmacy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">What happens next?</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                After registration, you&apos;ll be able to manage your
                inventory, track sales, and use AI-powered demand prediction to
                optimize your stock levels. Our team will review your
                registration and activate your account shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
