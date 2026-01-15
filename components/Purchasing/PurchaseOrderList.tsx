import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { updatePurchaseStatus } from "../../services/Purchase/updatePurchaseStatus";
import { softDeletePurchase } from "../../services/Purchase/softDeletePurchase";
import { restorePurchase } from "../../services/Purchase/restorePurchase";
import { toast } from "sonner";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PurchaseOrderListProps {
  poList: ApiPurchaseOrder[];
  deletedPOList: ApiPurchaseOrder[];
  suppliers: Supplier[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  loadPurchases: (page?: number, limit?: number) => Promise<void>;
  loadDeletedPurchases: (page?: number, limit?: number) => Promise<void>;
  onViewPO?: (po: ApiPurchaseOrder) => void;
  pagination: PaginationData;
  onCreateGRN?: (po: ApiPurchaseOrder) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  poList,
  deletedPOList,
  suppliers,
  setIsCreateModalOpen,
  loadPurchases,
  loadDeletedPurchases,
  onViewPO,
  pagination,
  onCreateGRN,
}) => {
  const [poFilter, setPoFilter] = useState<"pending" | "arrived" | "deleted">(
    "pending"
  );

  const filteredPOs = poList.filter((po) => {
    const status = po.status?.toLowerCase() || "";
    if (poFilter === "pending") {
      return status === "pending" && !po.isDeleted;
    } else if (poFilter === "arrived") {
      return (status === "arrived" || status === "received") && !po.isDeleted;
    } else if (poFilter === "deleted") {
      return po.isDeleted === true;
    }
    return false;
  });

  const displayList = poFilter === "deleted" ? deletedPOList : filteredPOs;

  useEffect(() => {
    if (poFilter === "deleted") {
      loadDeletedPurchases();
    }
  }, [poFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updatePurchaseStatus(id, status);
      if (res.success) {
        toast.success("Status updated successfully");
        loadPurchases(pagination.currentPage);
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update status", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadPurchases(page, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    loadPurchases(1, newLimit);
  };

  const handleSoftDelete = async (po: ApiPurchaseOrder) => {
    if (
      !window.confirm(
        `Are you sure you want to delete PO ${po.poNumber}? This action can be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await softDeletePurchase(po._id);
      if (res.success) {
        toast.success("Purchase order deleted successfully");
        loadPurchases(pagination.currentPage, pagination.itemsPerPage);
      } else {
        toast.error(res.message || "Failed to delete purchase order");
      }
    } catch (error: any) {
      console.error("Failed to delete purchase order", error);
      toast.error(error.message || "Failed to delete purchase order");
    }
  };

  const handleRestore = async (po: ApiPurchaseOrder) => {
    if (
      !window.confirm(`Are you sure you want to restore PO ${po.poNumber}?`)
    ) {
      return;
    }

    try {
      const res = await restorePurchase(po._id);
      if (res.success) {
        toast.success("Purchase order restored successfully");
        loadPurchases(pagination.currentPage, pagination.itemsPerPage);
        loadDeletedPurchases();
      } else {
        toast.error(res.message || "Failed to restore purchase order");
      }
    } catch (error: any) {
      console.error("Failed to restore purchase order", error);
      toast.error(error.message || "Failed to restore purchase order");
    }
  };

  const renderPagination = () => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

    if (totalPages <= 1 && totalItems <= 10) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Showing {startItem} to {endItem} of {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50 border"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
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
        <button
          onClick={() => setPoFilter("deleted")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            poFilter === "deleted"
              ? "bg-red-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Deleted
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
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No {poFilter} purchase orders found
                </td>
              </tr>
            ) : (
              displayList.map((po) => {
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
                        {poFilter === "deleted" ? (
                          <>
                            <button
                              onClick={() => onViewPO?.(po)}
                              className="text-xs bg-primary/50 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => handleRestore(po)}
                              className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onViewPO?.(po)}
                              className="text-xs bg-primary/50 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
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
                            {(po.status === "arrived" ||
                              po.status === "received") &&
                              po.totalRemainingQuantity > 0 && (
                                <button
                                  onClick={() => onCreateGRN?.(po)}
                                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                                >
                                  <PackageCheck className="w-3 h-3" /> Create
                                  GRN
                                </button>
                              )}
                            {po.status === "pending" && (
                              <button
                                onClick={() => handleSoftDelete(po)}
                                className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {renderPagination()}
      </div>
    </div>
  );
};
