import React, { useState, useEffect } from "react";
import {
  Globe,
  Package,
  Plus,
  X,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  Edit,
  Send,
  Search,
  Box,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  fetchOnlineStorefront,
  OnlineStorefrontProfile,
} from "../services/OnlineStorefront/fetchOnlineStorefront";
import {
  updateOnlineStorefront,
  UpdateOnlineStorefrontPayload,
} from "../services/OnlineStorefront/updateOnlineStorefront";
import {
  fetchOnlineStorefrontInventory,
  OnlineStorefrontStockItem,
} from "../services/OnlineStorefront/fetchOnlineStorefrontInventory";
import { updateOnlineStorefrontQuantity } from "../services/OnlineStorefront/updateOnlineStorefrontQuantity";
import {
  transferToOnlineStorefront,
  TransferToOnlineStorefrontPayload,
} from "../services/OnlineStorefront/transferToOnlineStorefront";
import { addProductsToOnlineStorefront } from "../services/OnlineStorefront/addProductsToOnlineStorefront";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { Product } from "../types";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export const OnlineStorefront: React.FC = () => {
  const { t } = useLanguage();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  // Profile state
  const [profile, setProfile] = useState<OnlineStorefrontProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateOnlineStorefrontPayload>(
    {},
  );

  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<
    OnlineStorefrontStockItem[]
  >([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [transferItems, setTransferItems] = useState<
    { productCode: string; quantity: number }[]
  >([{ productCode: "", quantity: 0 }]);

  // Add products modal state
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [allInventory, setAllInventory] = useState<Product[]>([]);
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>(
    [],
  );

  // Quantity adjust modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] =
    useState<OnlineStorefrontStockItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    loadProfile();
    loadInventory();
  }, []);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await fetchOnlineStorefront();
      if (response.success && response.data) {
        setProfile(response.data);
        setProfileForm({
          name: response.data.name,
          status: response.data.status,
          contactEmail: response.data.contactEmail || "",
          contactPhone: response.data.contactPhone || "",
          description: response.data.description || "",
        });
      } else {
        toast.error(response.message || "Failed to load online storefront");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load online storefront");
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetchOnlineStorefrontInventory();
      if (response.success && response.data) {
        setInventoryItems(response.data);
      } else {
        toast.error(response.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory");
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateOnlineStorefront(profileForm);
      if (response.success) {
        toast.success("Online storefront updated successfully");
        loadProfile();
        setIsEditProfileModalOpen(false);
      } else {
        toast.error(response.message || "Failed to update");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const openAdjustModal = (
    item: OnlineStorefrontStockItem,
    type: "add" | "remove",
  ) => {
    setAdjustingItem(item);
    setAdjustQuantity(type === "add" ? 1 : -1);
    setAdjustReason("");
    setIsAdjustModalOpen(true);
  };

  const handleAdjustQuantity = async () => {
    if (!adjustingItem || adjustQuantity === 0) return;
    try {
      const response = await updateOnlineStorefrontQuantity(adjustingItem._id, {
        quantityChange: adjustQuantity,
        reason: adjustReason || "Manual adjustment",
      });
      if (response.success) {
        toast.success(response.message);
        loadInventory();
        setIsAdjustModalOpen(false);
      } else {
        toast.error(response.message || "Failed to adjust quantity");
      }
    } catch (error) {
      toast.error("Failed to adjust quantity");
    }
  };

  const openTransferModal = async () => {
    try {
      const whResponse = await fetchWarehouseProfiles();
      if (whResponse.success && whResponse.data) {
        setWarehouses(
          whResponse.data.filter(
            (w: any) => w.status === "active" && !w.isDeleted,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
    setSelectedWarehouse("");
    setTransferItems([{ productCode: "", quantity: 0 }]);
    setIsTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedWarehouse) {
      toast.error("Please select a warehouse");
      return;
    }
    const validItems = transferItems.filter(
      (i) => i.productCode.trim() && i.quantity > 0,
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid product");
      return;
    }
    const payload: TransferToOnlineStorefrontPayload = {
      sourceWarehouseId: selectedWarehouse,
      lineItems: validItems.map((i) => ({
        productCode: i.productCode.toUpperCase(),
        quantity: i.quantity,
      })),
    };
    try {
      const response = await transferToOnlineStorefront(payload);
      if (response.success) {
        toast.success("Stock transferred successfully");
        loadInventory();
        setIsTransferModalOpen(false);
      } else {
        toast.error(response.message || "Transfer failed");
      }
    } catch (error) {
      toast.error("Transfer failed");
    }
  };

  const openAddProductsModal = async () => {
    try {
      const invResponse = await fetchProducts();
      if (invResponse.success && invResponse.data) {
        setAllInventory(invResponse.data);
      }
    } catch (error) {
      console.error(error);
    }
    setSelectedInventoryIds([]);
    setIsAddProductsModalOpen(true);
  };

  const handleAddProducts = async () => {
    if (selectedInventoryIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    try {
      const response = await addProductsToOnlineStorefront({
        inventoryIds: selectedInventoryIds,
      });
      if (response.success) {
        toast.success(
          `${response.data?.summary?.created || 0} product(s) added to online storefront`,
        );
        loadInventory();
        setIsAddProductsModalOpen(false);
      } else {
        toast.error(response.message || "Failed to add products");
      }
    } catch (error) {
      toast.error("Failed to add products");
    }
  };

  const filteredInventory = inventoryItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.inventoryId.productName.toLowerCase().includes(q) ||
      item.inventoryId.productCode.toLowerCase().includes(q) ||
      (item.inventoryId.SKU && item.inventoryId.SKU.toLowerCase().includes(q))
    );
  });

  const totalQuantity = inventoryItems.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = inventoryItems.filter((i) => i.isLowStock).length;
  const totalAmount = inventoryItems.reduce((sum, i) => {
    return sum + i.quantity * (i.inventoryId.sellingPrice || 0);
  }, 0);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          Online Storefront
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openTransferModal}
            disabled={userRole !== "owner" && userRole !== "admin"}
            className="bg-primary hover:bg-primary/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Transfer Stock</span>
          </button>
          <button
            onClick={openAddProductsModal}
            disabled={userRole !== "owner" && userRole !== "admin"}
            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Products</span>
          </button>
          <button
            onClick={() => {
              loadProfile();
              loadInventory();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingProfile || loadingInventory ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {profile.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {profile.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  profile.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {profile.status}
              </span>
              {(userRole === "owner" || userRole === "admin") && (
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-600">
            {profile.contactEmail && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Email:</span>
                <span>{profile.contactEmail}</span>
              </div>
            )}
            {profile.contactPhone && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Phone:</span>
                <span>{profile.contactPhone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Box className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">
                Total Products
              </p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                {inventoryItems.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">
                Total Quantity
              </p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                {totalQuantity}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Low Stock</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Total Amount</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-600 truncate">
                {totalAmount.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-4">
        <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Online Inventory
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loadingInventory ? (
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p>Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Product
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                  <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Category
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Qty
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Total
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInventory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.inventoryId.productName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                        {item.inventoryId.productCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {item.inventoryId.SKU || "-"}
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
                      {(item.inventoryId.sellingPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {(
                        item.quantity * (item.inventoryId.sellingPrice || 0)
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.isLowStock ? (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Low
                        </span>
                      ) : item.quantity === 0 ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                          Out
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAdjustModal(item, "add")}
                          disabled={
                            userRole !== "owner" && userRole !== "admin"
                          }
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                          title="Add quantity"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAdjustModal(item, "remove")}
                          disabled={
                            userRole !== "owner" && userRole !== "admin"
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Remove quantity"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Edit Online Storefront
              </h2>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={profileForm.name || ""}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={profileForm.status || "active"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={profileForm.contactEmail || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      contactEmail: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={profileForm.contactPhone || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      contactPhone: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={profileForm.description || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Transfer from Warehouse
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source Warehouse
                </label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.locationName} ({w.locationCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                {transferItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Product Code"
                      className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none uppercase"
                      value={item.productCode}
                      onChange={(e) => {
                        const newItems = [...transferItems];
                        newItems[idx].productCode = e.target.value;
                        setTransferItems(newItems);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      className="w-24 border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                      value={item.quantity || ""}
                      onChange={(e) => {
                        const newItems = [...transferItems];
                        newItems[idx].quantity = parseInt(e.target.value) || 0;
                        setTransferItems(newItems);
                      }}
                    />
                    {transferItems.length > 1 && (
                      <button
                        onClick={() =>
                          setTransferItems(
                            transferItems.filter((_, i) => i !== idx),
                          )
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() =>
                    setTransferItems([
                      ...transferItems,
                      { productCode: "", quantity: 0 },
                    ])
                  }
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add another product
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Products Modal */}
      {isAddProductsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Add Products to Online Storefront
              </h2>
              <button
                onClick={() => setIsAddProductsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500 mb-3">
                Selected: {selectedInventoryIds.length} product(s)
              </p>
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                {allInventory.map((inv) => {
                  const isAlreadyOnline = inventoryItems.some(
                    (o) => o.inventoryId._id === inv._id,
                  );
                  return (
                    <label
                      key={inv._id}
                      className={`flex items-center gap-3 p-3 border-b hover:bg-slate-50 cursor-pointer ${
                        isAlreadyOnline ? "opacity-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isAlreadyOnline}
                        checked={
                          selectedInventoryIds.includes(inv._id) ||
                          isAlreadyOnline
                        }
                        onChange={(e) => {
                          if (isAlreadyOnline) return;
                          if (e.target.checked) {
                            setSelectedInventoryIds([
                              ...selectedInventoryIds,
                              inv._id,
                            ]);
                          } else {
                            setSelectedInventoryIds(
                              selectedInventoryIds.filter(
                                (id) => id !== inv._id,
                              ),
                            );
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm">
                          {inv.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {inv.productCode} · {inv.category}
                          {isAlreadyOnline && " · Already in online storefront"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsAddProductsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProducts}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Quantity Modal */}
      {isAdjustModalOpen && adjustingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {adjustQuantity > 0 ? "Add" : "Remove"} Quantity
              </h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Product:{" "}
                <strong>{adjustingItem.inventoryId.productName}</strong>
                <br />
                Current quantity: <strong>{adjustingItem.quantity}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity to {adjustQuantity > 0 ? "add" : "remove"}
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={Math.abs(adjustQuantity)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setAdjustQuantity(adjustQuantity > 0 ? val : -val);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Returned items, damaged goods..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustQuantity}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
