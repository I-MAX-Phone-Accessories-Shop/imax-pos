import React, { useState, useEffect, useRef } from "react";
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
import { ConfirmModal } from "../Common/ConfirmModal";

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
  loadPurchases: (
    page?: number,
    limit?: number,
    status?: "pending" | "arrived"
  ) => Promise<void>;
  loadDeletedPurchases: (page?: number, limit?: number) => Promise<void>;
  onViewPO?: (po: ApiPurchaseOrder) => void;
  pagination: PaginationData;
  deletedPagination: PaginationData;
  onCreateGRN?: (po: ApiPurchaseOrder) => void;
  poFilter: PoFilter;
  onPoFilterChange: (filter: PoFilter) => void;
  // Called after "Mark Arrived" succeeds; the parent moves to the Arrived tab
  onMarkedArrived?: (poId: string) => void;
  highlightId?: string | null;
  onHighlightDone?: () => void;
}

export type PoFilter = "pending" | "arrived" | "deleted";

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  poList,
  deletedPOList,
  suppliers,
  setIsCreateModalOpen,
  loadPurchases,
  loadDeletedPurchases,
  onViewPO,
  pagination,
  deletedPagination,
  onCreateGRN,
  poFilter,
  onPoFilterChange,
  onMarkedArrived,
  highlightId,
  onHighlightDone,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<ApiPurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use the filtered data from API instead of client-side filtering
  const displayList = poFilter === "deleted" ? deletedPOList : poList;


  // Scroll to and briefly highlight a row that was just moved into this list
  const [flashId, setFlashId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!highlightId) return;
    const row = tableRef.current?.querySelector<HTMLElement>(
      `[data-row-id="${highlightId}"]`,
    );
    if (!row) {
      // Not on this page: skip the highlight
      onHighlightDone?.();
      return;
    }
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlashId(highlightId);
    const timer = setTimeout(() => {
      setFlashId(null);
      onHighlightDone?.();
    }, 2000);
    return () => {
      clearTimeout(timer);
      setFlashId(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updatePurchaseStatus(id, status);
      if (res.success) {
        if (status === "arrived" && onMarkedArrived) {
          // Parent switches to Arrived (one load) and shows the toast
          onMarkedArrived(id);
        } else {
          toast.success("Status updated successfully");
          // Reload with current filter status
          loadPurchases(
            pagination.currentPage,
            pagination.itemsPerPage,
            poFilter
          );
        }
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
      loadPurchases(page, pagination.itemsPerPage, poFilter);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    loadPurchases(1, newLimit, poFilter);
  };

  const handleSoftDelete = async (po: ApiPurchaseOrder) => {
    setPoToDelete(po);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!poToDelete) return;

    setIsDeleting(true);
    try {
      const res = await softDeletePurchase(poToDelete._id);
      if (res.success) {
        toast.success("Purchase order deleted successfully");
        loadPurchases(pagination.currentPage, pagination.itemsPerPage);
        setDeleteModalOpen(false);
        setPoToDelete(null);
      } else {
        toast.error(res.message || "Failed to delete purchase order");
      }
    } catch (error: any) {
      console.error("Failed to delete purchase order", error);
      toast.error(error.message || "Failed to delete purchase order");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPoToDelete(null);
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
        loadDeletedPurchases(
          deletedPagination.currentPage,
          deletedPagination.itemsPerPage
        );
      } else {
        toast.error(res.message || "Failed to restore purchase order");
      }
    } catch (error: any) {
      console.error("Failed to restore purchase order", error);
      toast.error(error.message || "Failed to restore purchase order");
    }
  };

  const handleDeletedPageChange = (page: number) => {
    if (page >= 1 && page <= deletedPagination.totalPages) {
      loadDeletedPurchases(page, deletedPagination.itemsPerPage);
    }
  };

  const handleDeletedLimitChange = (newLimit: number) => {
    loadDeletedPurchases(1, newLimit);
  };

  const renderPagination = () => {
    const currentPagination =
      poFilter === "deleted" ? deletedPagination : pagination;
    const { currentPage, totalPages, totalItems, itemsPerPage } =
      currentPagination;

    // Hide pagination if total items are 10 or less
    if (totalItems <= 10) return null;

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
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                if (poFilter === "deleted") {
                  handleDeletedLimitChange(newLimit);
                } else {
                  handleLimitChange(newLimit);
                }
              }}
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
            onClick={() => {
              if (poFilter === "deleted") {
                handleDeletedPageChange(currentPage - 1);
              } else {
                handlePageChange(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  if (poFilter === "deleted") {
                    handleDeletedPageChange(page);
                  } else {
                    handlePageChange(page);
                  }
                }}
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
            onClick={() => {
              if (poFilter === "deleted") {
                handleDeletedPageChange(currentPage + 1);
              } else {
                handlePageChange(currentPage + 1);
              }
            }}
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
          onClick={() => onPoFilterChange("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            poFilter === "pending"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => onPoFilterChange("arrived")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            poFilter === "arrived"
              ? "bg-btn-primary text-dark"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Arrived
        </button>
        <button
          onClick={() => onPoFilterChange("deleted")}
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
        <div ref={tableRef} className="h-[calc(100vh-450px)] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0 z-10">
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
                    <tr
                      key={po._id}
                      data-row-id={po._id}
                      className={`transition-colors duration-700 ${
                        flashId === po._id
                          ? "bg-yellow-50 ring-2 ring-inset ring-yellow-300"
                          : "hover:bg-slate-50"
                      }`}
                    >
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
                                    <PackageCheck className="w-3 h-3" />
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
        </div>
        {renderPagination()}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete PO ${poToDelete?.poNumber}? This action can be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
