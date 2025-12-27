"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatLKR } from "@/lib/currency";
import { AuthGuard } from "@/lib/auth-guard";

interface InventoryItem {
  id: number;
  name: string;
  form: string;
  strength?: string;
  stock: number;
  expiry?: string | null;
  price: number;
}

export default function PharmacyInventoryPage() {
  const { data: session } = useSession();
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Get user's pharmacy
  useEffect(() => {
    async function fetchPharmacy() {
      try {
        const res = await fetch("/api/pharmacies");
        const data = await res.json();
        if (res.ok && data.pharmacies) {
          // Find pharmacy owned by current user
          const userPharmacy = data.pharmacies.find(
            (p: any) => p.owner_id === session?.user?.id,
          );
          if (userPharmacy) {
            setPharmacyId(userPharmacy.id);
          } else {
            setMessage({
              type: "error",
              text: "No pharmacy found. Please register a pharmacy first.",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch pharmacy:", err);
        setMessage({
          type: "error",
          text: "Failed to load pharmacy information",
        });
      }
    }
    if (session?.user?.id) {
      fetchPharmacy();
    }
  }, [session]);

  // Fetch inventory
  useEffect(() => {
    if (pharmacyId) {
      fetchInventory();
    }
  }, [pharmacyId]);

  // Filter inventory
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredInventory(
        inventory.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.form.toLowerCase().includes(query) ||
            (item.strength || "").toLowerCase().includes(query),
        ),
      );
    }
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    if (!pharmacyId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/pharmacies/${pharmacyId}/inventory`);
      const data = await res.json();
      if (res.ok) {
        setInventory(data.inventory || []);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to load inventory" });
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setMessage({ type: "error", text: "Failed to load inventory" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!pharmacyId) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(
        `/api/pharmacies/${pharmacyId}/inventory/${itemId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Item deleted successfully" });
        fetchInventory();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete item" });
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      setMessage({ type: "error", text: "Failed to delete item" });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    fetchInventory();
    handleModalClose();
  };

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter((item) => item.stock < 10).length,
    totalValue: inventory.reduce((sum, item) => sum + item.stock * item.price, 0),
    expiringSoon: inventory.filter((item) => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length,
  };

  return (
    <AuthGuard allowedRoles={["SUPER_ADMIN", "VETERINARIAN", "USER"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Inventory Management</h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Manage your pharmacy inventory items
                  </p>
                </div>
              </div>
              <button
                onClick={handleAdd}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Message Alert */}
          {message && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium flex-1">{message.text}</p>
              <button
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Total Items</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalItems}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Low Stock</div>
              <div className="text-3xl font-bold text-red-600">
                {stats.lowStock}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Total Value</div>
              <div className="text-3xl font-bold text-green-600">
                {formatLKR(stats.totalValue)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">Expiring Soon</div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.expiringSoon}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, form, or strength..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  {inventory.length === 0
                    ? "No inventory items yet"
                    : "No items match your search"}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {inventory.length === 0
                    ? "Click 'Add Item' to get started"
                    : "Try adjusting your search query"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Form & Strength
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInventory.map((item) => {
                      const isLowStock = item.stock < 10;
                      const isExpiringSoon =
                        item.expiry &&
                        new Date(item.expiry) <=
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      const isExpired =
                        item.expiry && new Date(item.expiry) < new Date();

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.form}
                              {item.strength && (
                                <span className="text-gray-400">
                                  {" "}
                                  — {item.strength}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  isLowStock ? "text-red-600" : "text-gray-900"
                                }`}
                              >
                                {item.stock}
                              </span>
                              {isLowStock && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm ${
                                isExpired
                                  ? "text-red-600 font-semibold"
                                  : isExpiringSoon
                                    ? "text-orange-600 font-medium"
                                    : "text-gray-600"
                              }`}
                            >
                              {item.expiry
                                ? new Date(item.expiry).toLocaleDateString()
                                : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatLKR(item.price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatLKR(item.stock * item.price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <InventoryItemModal
            pharmacyId={pharmacyId}
            item={editingItem}
            onClose={handleModalClose}
            onSave={handleSave}
          />
        )}
      </div>
    </AuthGuard>
  );
}

// Inventory Item Modal Component
function InventoryItemModal({
  pharmacyId,
  item,
  onClose,
  onSave,
}: {
  pharmacyId: string | null;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    form: "",
    strength: "",
    stock: 0,
    expiry: "",
    price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        form: item.form,
        strength: item.strength || "",
        stock: item.stock,
        expiry: item.expiry || "",
        price: item.price,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) {
      setError("Pharmacy ID is required");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        form: formData.form,
        strength: formData.strength || null,
        stock: Number(formData.stock),
        expiry: formData.expiry || null,
        price: Number(formData.price),
      };

      let url = `/api/pharmacies/${pharmacyId}/inventory`;
      let method = "POST";

      if (item) {
        url = `/api/pharmacies/${pharmacyId}/inventory/${item.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save item");
        return;
      }

      onSave();
    } catch (err) {
      console.error("Failed to save item:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {item ? "Edit Inventory Item" : "Add New Inventory Item"}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Amoxicillin"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Form <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.form}
                onChange={(e) =>
                  setFormData({ ...formData, form: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Capsule, Tablet"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Strength
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) =>
                  setFormData({ ...formData, strength: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 250 mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({ ...formData, expiry: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {item ? "Update Item" : "Add Item"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}