"use client";

import { useState } from "react";

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

  const handleChange = (e: any) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
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
        setMessage("Pharmacy registered successfully");
      } else {
        setMessage(data.error || "Failed to register");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-2">Register Pharmacy</h1>
        <p className="text-sm text-gray-500 mb-4">
          Create a pharmacy account and manage your inventory.
        </p>

        {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Pharmacy name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              name="lat"
              placeholder="Latitude"
              value={form.lat}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              name="lng"
              placeholder="Longitude"
              value={form.lng}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="pickup"
                checked={form.pickup}
                onChange={handleChange}
              />{" "}
              <span className="text-sm">Pickup</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="delivery"
                checked={form.delivery}
                onChange={handleChange}
              />{" "}
              <span className="text-sm">Delivery</span>
            </label>
            <input
              name="delivery_fee"
              placeholder="Delivery fee"
              value={form.delivery_fee}
              onChange={handleChange}
              className="w-28 border px-3 py-2 rounded text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
