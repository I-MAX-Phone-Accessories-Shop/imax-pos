import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  AlertTriangle,
  Box,
  RefreshCw,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";

export const StorefrontDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get storefront info from location state if available
  const storefrontInfo = location.state as {
    storefrontName?: string;
    storefrontCode?: string;
  } | null;

  const [stockItems, setStockItems] = useState<StorefrontStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storefrontName, setStorefrontName] = useState(
    storefrontInfo?.storefrontName || "Storefront"
  );
  const [storefrontCode, setStorefrontCode] = useState(
    storefrontInfo?.storefrontCode || ""
  );

  useEffect(() => {
    loadStorefrontStock();
  }, [id]);

  const loadStorefrontStock = async () => {
    setLoading(true);
    try {
      const response = await fetchStorefrontStock();
      if (response.success && response.data) {
        // Filter items by storefront ID
        const filteredItems = response.data.filter(
          (item) => item.storefrontId?.id === id
        );
        setStockItems(filteredItems);

        // Update storefront info from first item if not provided via state
        if (filteredItems.length > 0 && !storefrontInfo) {
          setStorefrontName(filteredItems[0].storefrontId.storefrontName);
          setStorefrontCode(filteredItems[0].storefrontId.storefrontCode);
        }
      } else {
        toast.error("Failed to load storefront stock");
      }
    } catch (error) {
      console.error("Error loading storefront stock:", error);
      toast.error("Failed to load storefront stock");
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = stockItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const lowStockCount = stockItems.filter((item) => item.isLowStock).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/storefront")}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            {storefrontName}
            {storefrontCode && (
              <span className="text-sm px-2 py-1 bg-primary/20 text-primary-700 rounded-full font-medium">
                {storefrontCode}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Storefront Stock Inventory
          </p>
        </div>
        <button
          onClick={loadStorefrontStock}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-800">
                {stockItems.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalQuantity}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-slate-800">
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-800">Stock Items</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading stock items...
          </div>
        ) : stockItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No stock items found in this storefront.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Product Name
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Product Code
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Quantity
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Available
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stockItems.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {item.inventoryId.productName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                      {item.inventoryId.productCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {item.inventoryId.SKU}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/20 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                      {item.inventoryId.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {item.availableQuantity}
                  </td>
                  <td className="px-4 py-3">
                    {item.isLowStock ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : item.quantity === 0 ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(item.lastUpdated).toLocaleDateString()}{" "}
                    {new Date(item.lastUpdated).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

