import { useState } from "react";
import { formatLKR } from "@/lib/currency";

interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  reorderPoint: number;
  price: number;
  expiryDate: string;
  supplier: string;
}

export default function ProductInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([
    {
      id: "1",
      name: "Amoxicillin 500mg",
      category: "Antibiotics",
      stockLevel: 450,
      reorderPoint: 100,
      price: 25.5,
      expiryDate: "2025-08-15",
      supplier: "MedSupply Inc.",
    },
    {
      id: "2",
      name: "Carprofen 75mg",
      category: "Pain Relief",
      stockLevel: 80,
      reorderPoint: 100,
      price: 45.0,
      expiryDate: "2025-06-20",
      supplier: "VetPharm Ltd.",
    },
    {
      id: "3",
      name: "Ivermectin Injectable",
      category: "Parasiticides",
      stockLevel: 200,
      reorderPoint: 50,
      price: 120.0,
      expiryDate: "2026-01-10",
      supplier: "AnimalCare Co.",
    },
    {
      id: "4",
      name: "Prednisone 5mg",
      category: "Steroids",
      stockLevel: 30,
      reorderPoint: 75,
      price: 18.75,
      expiryDate: "2025-04-05",
      supplier: "MedSupply Inc.",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const getStockStatus = (stockLevel: number, reorderPoint: number) => {
    if (stockLevel === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stockLevel <= reorderPoint)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 90;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Product Inventory
        </h2>
        <p className="text-sm text-gray-600">
          Manage and track pharmaceutical products
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
          + Add Product
        </button>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Product Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Category
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                Stock Level
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Expiry Date
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Price
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Supplier
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const status = getStockStatus(
                product.stockLevel,
                product.reorderPoint,
              );
              const expiringSoon = isExpiringSoon(product.expiryDate);

              return (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {product.id}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="font-semibold text-gray-900">
                      {product.stockLevel}
                    </div>
                    <div className="text-xs text-gray-500">
                      Reorder: {product.reorderPoint}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className={`text-sm ${expiringSoon ? "text-orange-600 font-medium" : "text-gray-700"}`}
                    >
                      {product.expiryDate}
                    </div>
                    {expiringSoon && (
                      <div className="text-xs text-orange-600">
                        ⚠️ Expiring soon
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatLKR(product.price)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {product.supplier}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Restock
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No products found matching your search criteria.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">
            Total Products
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {products.length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">
            Out of Stock
          </div>
          <div className="text-2xl font-bold text-red-900">
            {products.filter((p) => p.stockLevel === 0).length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm text-yellow-600 font-medium mb-1">
            Low Stock
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            {
              products.filter(
                (p) => p.stockLevel > 0 && p.stockLevel <= p.reorderPoint,
              ).length
            }
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-sm text-orange-600 font-medium mb-1">
            Expiring Soon
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {products.filter((p) => isExpiringSoon(p.expiryDate)).length}
          </div>
        </div>
      </div>
    </div>
  );
}
