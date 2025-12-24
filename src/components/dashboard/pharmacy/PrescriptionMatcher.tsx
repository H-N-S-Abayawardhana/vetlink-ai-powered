"use client";

import { useState } from "react";

import { formatLKR } from "@/lib/currency";

export default function PrescriptionMatcher() {
  const [items, setItems] = useState<string[]>([""]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const addItem = () => setItems((prev) => [...prev, ""]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const search = async () => {
    setLoading(true);
    const payload = {
      items: items.filter(Boolean).map((n) => ({ name: n, qty: 1 })),
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    };
    try {
      const res = await fetch("/api/pharmacies/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) setResults(data.matches || []);
      else setResults([]);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
      {/* <h3 className="text-sm font-semibold mb-3">Find nearest pharmacies with prescription</h3>

      <div className="grid gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center space-x-2">
            <input value={it} onChange={(e) => handleItemChange(i, e.target.value)} placeholder="Medication name" className="flex-1 border px-2 py-1 rounded" />
            {items.length > 1 && <button onClick={() => removeItem(i)} className="px-2 py-1 bg-red-50 text-red-700 rounded">Remove</button>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Your latitude" className="border px-2 py-1 rounded" />
        <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Your longitude" className="border px-2 py-1 rounded" />
      </div>

      <div className="flex items-center justify-end space-x-3 mt-3">
        <button onClick={addItem} className="px-3 py-2 border rounded text-sm">+ Add item</button>
        <button onClick={search} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">{loading ? 'Searching…' : 'Find pharmacies'}</button>
      </div> */}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">Matches:</div>
          {results.map((r, idx) => (
            <div key={idx} className="p-3 border rounded bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {r.name}{" "}
                    {r.distanceKm ? `— ${r.distanceKm.toFixed(2)}km` : ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.address} • delivery:{" "}
                    {r.delivery?.delivery
                      ? `Yes (fee ${formatLKR(r.delivery.delivery_fee)})`
                      : "Pickup only"}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  Total: {formatLKR(r.totalPrice)}
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-700">
                {r.items.map((it: any, i: number) => (
                  <div key={i}>
                    {it.medication} x {it.qty} — {formatLKR(it.total)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
