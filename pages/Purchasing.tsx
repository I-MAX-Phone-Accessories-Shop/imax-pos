import React, { useState, useEffect } from "react";
import { ShoppingBag, FileText, PackageCheck, Truck } from "lucide-react";
import { Supplier, Product, ApiPurchaseOrder } from "../types";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { fetchGRNs, GRNData } from "../services/Purchase/fetchGRNs";
import {
  fetchTransfers,
  TransferData,
} from "../services/Purchase/fetchTransfers";
import { toast } from "sonner";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { GRNList } from "../components/Purchasing/GRNList";
import { CreateGRNModal } from "../components/Purchasing/CreateGRNModal";
import { GRNDetailModal } from "../components/Purchasing/GRNDetailModal";
import { TransferWarehouseModal } from "../components/Purchasing/TransferWarehouseModal";
import { TransferList } from "../components/Purchasing/TransferList";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { TransferDetailModal } from "../components/Purchasing/TransferDetailModal";

type TabType = "po" | "grn" | "transfer";

export const Purchasing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("po");

  // Shared State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // PO State
  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);

  // GRN State
  const [grnList, setGRNList] = useState<GRNData[]>([]);
  const [isCreateGRNModalOpen, setIsCreateGRNModalOpen] = useState(false);
  const [selectedGRNId, setSelectedGRNId] = useState<string | null>(null);
  const [isGRNDetailModalOpen, setIsGRNDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferGRNId, setTransferGRNId] = useState<string | null>(null);

  // Transfer State
  const [transferList, setTransferList] = useState<TransferData[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null
  );
  const [isTransferDetailModalOpen, setIsTransferDetailModalOpen] =
    useState(false);

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

        // Fetch GRNs
        loadGRNs();

        // Fetch Transfers
        loadTransfers();
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
        setPOList(res.data.reverse());
      }
    } catch (error) {
      console.error("Failed to load POs", error);
      toast.error("Failed to load Purchase Orders");
    }
  };

  const loadGRNs = async () => {
    try {
      const res = await fetchGRNs();
      if (res.success) {
        setGRNList(res.data);
      }
    } catch (error) {
      console.error("Failed to load GRNs", error);
      toast.error("Failed to load GRNs");
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await fetchTransfers();
      if (res.success) {
        setTransferList(res.data);
      }
    } catch (error) {
      console.error("Failed to load transfers", error);
      toast.error("Failed to load Transfers");
    }
  };

  const handleGRNSuccess = () => {
    loadGRNs();
    loadPurchases();
  };

  const handleViewPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsPODetailModalOpen(true);
  };

  const handleViewGRN = (grn: GRNData) => {
    setSelectedGRNId(grn._id);
    setIsGRNDetailModalOpen(true);
  };

  const handleTransferGRN = (grn: GRNData) => {
    setTransferGRNId(grn._id);
    setIsTransferModalOpen(true);
  };

  const handleTransferSuccess = () => {
    loadGRNs();
    loadTransfers();
  };

  const handleViewTransfer = (transfer: TransferData) => {
    setSelectedTransferId(transfer._id);
    setIsTransferDetailModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <ShoppingBag className="w-6 h-6" /> Purchasing Module
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("po")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "po"
              ? "border-b-2 border-yellow-800 text-yellow-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4" /> Purchase Order (PO)
        </button>
        <button
          onClick={() => setActiveTab("grn")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "grn"
              ? "border-b-2 border-yellow-800 text-yellow-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Goods Received Note (GRN)
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "transfer"
              ? "border-b-2 border-yellow-800 text-yellow-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Truck className="w-4 h-4" /> Transfer
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
            onViewPO={handleViewPO}
          />
          <CreatePOModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            suppliers={suppliers}
            products={products}
            onSuccess={loadPurchases}
          />
          <PODetailModal
            isOpen={isPODetailModalOpen}
            onClose={() => setIsPODetailModalOpen(false)}
            purchaseId={selectedPOId}
            suppliers={suppliers}
          />
        </>
      )}

      {/* GRN Tab */}
      {activeTab === "grn" && (
        <>
          <GRNList
            grnList={grnList}
            setIsCreateModalOpen={setIsCreateGRNModalOpen}
            onStatusChange={loadGRNs}
            onViewGRN={handleViewGRN}
            onTransferGRN={handleTransferGRN}
          />
          <CreateGRNModal
            isOpen={isCreateGRNModalOpen}
            onClose={() => setIsCreateGRNModalOpen(false)}
            purchaseOrders={poList}
            suppliers={suppliers}
            onSuccess={handleGRNSuccess}
          />
          <GRNDetailModal
            isOpen={isGRNDetailModalOpen}
            onClose={() => setIsGRNDetailModalOpen(false)}
            grnId={selectedGRNId}
          />
          <TransferWarehouseModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            grnId={transferGRNId}
            onSuccess={handleTransferSuccess}
          />
        </>
      )}

      {/* Transfer Tab */}
      {activeTab === "transfer" && (
        <>
          <TransferList
            transferList={transferList}
            onViewTransfer={handleViewTransfer}
            onStatusChange={loadTransfers}
          />
          <TransferDetailModal
            isOpen={isTransferDetailModalOpen}
            onClose={() => setIsTransferDetailModalOpen(false)}
            transferId={selectedTransferId}
          />
        </>
      )}
    </div>
  );
};
