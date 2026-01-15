import React, { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { updatePurchaseStatus } from "../../services/Purchase/updatePurchaseStatus";
import { toast } from "sonner";

interface PurchaseOrderListProps {
  poList: ApiPurchaseOrder[];
  suppliers: Supplier[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  loadPurchases: () => Promise<void>;
  onViewPO?: (po: ApiPurchaseOrder) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  poList,
  suppliers,
  setIsCreateModalOpen,
  loadPurchases,
  onViewPO,
}) => {
  const [poFilter, setPoFilter] = useState<"pending" | "arrived">("pending");

  const filteredPOs = poList.filter((po) => {
    const status = po.status?.toLowerCase() || "";
    if (poFilter === "pending") {
      return status === "pending";
    } else {
      return status === "arrived" || status === "received";
    }
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updatePurchaseStatus(id, status);
      if (res.success) {
        toast.success("Status updated successfully");
        loadPurchases();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update status", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="font-bold text-lg text-slate-800">
          Purchase Orders List
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-btn-primary text-dark px-4 py-2 rounded-lg hover:bg-btn-primary-hover flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create New PO
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setPoFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            poFilter === "pending"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setPoFilter("arrived")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            poFilter === "arrived"
              ? "bg-btn-primary text-dark"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Arrived
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">PO ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Note</th>
              <th className="p-4">Total Remaining</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No {poFilter} purchase orders found
                </td>
              </tr>
            ) : (
              filteredPOs.map((po) => {
                return (
                  <tr key={po._id} className="hover:bg-slate-50">
                    <td className="p-4  ">{po.poNumber}</td>
                    <td className="p-4">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {po.supplierId?.supplierName || "Unknown Supplier"}
                    </td>
                    <td className="p-4 font-medium">
                      {po.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          po.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {po.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 truncate max-w-xs">
                      {po.note}
                    </td>
                    <td className="p-4">{po.totalRemainingQuantity}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {po.status === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(po._id, "arrived")
                            }
                            className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors"
                          >
                            Mark Arrived
                          </button>
                        )}
                        <button
                          onClick={() => onViewPO?.(po)}
                          className="text-xs bg-primary/50 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
