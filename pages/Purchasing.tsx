import React, { useState, useEffect } from "react";
import { ShoppingBag, FileText, PackageCheck } from "lucide-react";
import { Supplier, Product, ApiPurchaseOrder } from "../types";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { toast } from "sonner";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { GRNManager } from "../components/Purchasing/GRNManager";

type TabType = "po" | "grn";

export const Purchasing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("po");

  // Shared State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // PO State
  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch Suppliers and Products
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Suppliers
        const supplierRes = await fetchSuppliers();
        if (supplierRes.success) {
          setSuppliers(supplierRes.data);
        }

        // Fetch Products
        const productRes = await fetchProducts();
        if (productRes.success && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        } else if (Array.isArray(productRes)) {
          setProducts(productRes);
        } else if (productRes.data && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        }

        // Fetch Purchase Orders
        loadPurchases();
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  const loadPurchases = async () => {
    try {
      const res = await fetchPurchases();
      if (res.success) {
        setPOList(res.data);
      }
    } catch (error) {
      console.error("Failed to load POs", error);
      toast.error("Failed to load Purchase Orders");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <ShoppingBag className="w-6 h-6 text-green-600" /> Purchasing Module
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("po")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "po"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4" /> Purchase Order (PO)
        </button>
        <button
          onClick={() => setActiveTab("grn")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "grn"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Goods Received Note (GRN)
        </button>
      </div>

      {/* PO Tab */}
      {activeTab === "po" && (
        <>
          <PurchaseOrderList
            poList={poList}
            suppliers={suppliers}
            setIsCreateModalOpen={setIsCreateModalOpen}
            loadPurchases={loadPurchases}
          />
          <CreatePOModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            suppliers={suppliers}
            products={products}
            onSuccess={loadPurchases}
          />
        </>
      )}

      {/* GRN Tab */}
      {activeTab === "grn" && (
        <GRNManager
          purchaseOrders={poList}
          suppliers={suppliers}
          onSuccess={loadPurchases}
        />
      )}
    </div>
  );
};
