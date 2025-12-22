"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Alert from "@/components/ui/Alert";
import { formatLKR } from "@/lib/currency";
import MedicationForm from "./MedicationForm";

interface Medication {
  id: number;
  name: string;
  form: string;
  strength?: string;
  stock?: number;
  expiry?: string | null;
  description?: string;
  price?: number;
}

export default function InventoryList() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filtered, setFiltered] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  const { data: session } = useSession();
  const userRole = (session?.user as any)?.userRole || "USER";

  const canManage = ["SUPER_ADMIN", "VETERINARIAN"].includes(
    userRole as string,
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!query) setFiltered(medications);
    else
      setFiltered(
        medications.filter(
          (m) =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            (m.description || "").toLowerCase().includes(query.toLowerCase()),
        ),
      );
  }, [query, medications]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/pharmacy");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load medications");
        return;
      }
      setMedications(data.medications || []);
      setFiltered(data.medications || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch medications");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this medication?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/pharmacy/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete");
        return;
      }
      setSuccess("Medication removed");
      setMedications((prev) => prev.filter((m) => m.id !== id));
      setFiltered((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (med: any) => {
    // If med has id and exists, update locally; else add to list
    if (!med) return;
    if (med.id) {
      setMedications((prev) => {
        const idx = prev.findIndex((p) => p.id === med.id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = med;
          return copy;
        }
        return [med, ...prev];
      });
      setFiltered((prev) => {
        const idx = prev.findIndex((p) => p.id === med.id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = med;
          return copy;
        }
        return [med, ...prev];
      });
    }
    setSuccess("Changes saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      id="pharmacy-inventory"
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Pharmacy Inventory</h2>
          <p className="text-sm text-gray-500">
            Manage medications and stock. You can search, add, edit or remove
            items.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medications"
            className="px-3 py-2 border rounded-md text-sm"
          />
          {canManage && (
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              + Add Medication
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert
            type="success"
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          No medications found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 font-medium text-gray-700">Name</th>
                <th className="px-3 py-2 font-medium text-gray-700">
                  Form & Strength
                </th>
                <th className="px-3 py-2 font-medium text-gray-700">Stock</th>
                <th className="px-3 py-2 font-medium text-gray-700">Expiry</th>
                <th className="px-3 py-2 font-medium text-gray-700">Price</th>
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900">
                    {m.name}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {m.form}
                    {m.strength ? ` — ${m.strength}` : ""}
                  </td>
                  <td
                    className={`px-3 py-3 ${m.stock && m.stock < 10 ? "text-red-600 font-semibold" : "text-gray-700"}`}
                  >
                    {m.stock ?? 0}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{m.expiry || "—"}</td>
                  <td className="px-3 py-3 text-gray-700">
                    {formatLKR(m.price)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-2">
                      {canManage ? (
                        <>
                          <button
                            onClick={() => {
                              setEditing(m);
                              setModalOpen(true);
                            }}
                            className="px-2 py-1 border rounded text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="px-2 py-1 border rounded text-sm text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            alert(
                              "Request feature coming soon — you can request this medication via your veterinarian or the clinic.",
                            )
                          }
                          className="px-2 py-1 border rounded text-sm text-blue-700 hover:bg-blue-50"
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MedicationForm
        initialData={editing}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(med) => {
          handleSaved(med);
        }}
      />
    </div>
  );
}
