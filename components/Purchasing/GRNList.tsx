import React, { useState } from "react";
import { Plus, Eye, CheckCircle, Warehouse } from "lucide-react";
import { GRNData } from "../../services/Purchase/fetchGRNs";
import { updateGRNStatus } from "../../services/Purchase/updateGRNStatus";
import { toast } from "sonner";

interface GRNListProps {
  grnList: GRNData[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  onViewGRN?: (grn: GRNData) => void;
  onStatusChange?: () => void;
  onTransferGRN?: (grn: GRNData) => void;
}

export const GRNList: React.FC<GRNListProps> = ({
  grnList,
  setIsCreateModalOpen,
  onViewGRN,
  onStatusChange,
  onTransferGRN,
}) => {
  const [grnFilter, setGrnFilter] = useState<"pending" | "completed">(
    "pending"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (grnId: string, newStatus: string) => {
    setUpdatingId(grnId);
    try {
      const res = await updateGRNStatus(grnId, newStatus);
      if (res.success) {
        toast.success("GRN status updated successfully");
        onStatusChange?.();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update GRN status", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredGRNs = grnList.filter((grn) => {
    const status = grn.status?.toLowerCase() || "";
    if (grnFilter === "pending") {
      return status === "pending";
    } else {
      return (
        status === "verified" ||
        status === "completed" ||
        status === "transferred"
      );
    }
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "verified":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "transferred":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="font-bold text-lg text-slate-800">
          Goods Received Notes List
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create New GRN
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setGrnFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            grnFilter === "pending"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setGrnFilter("completed")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            grnFilter === "completed"
              ? "bg-green-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Completed
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">GRN Number</th>
              <th className="p-4">Date</th>
              <th className="p-4">Items</th>
              <th className="p-4">Received Qty</th>
              <th className="p-4">Good / Bad</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Notes</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredGRNs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  No {grnFilter} GRNs found
                </td>
              </tr>
            ) : (
              filteredGRNs.map((grn) => (
                <tr key={grn._id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-blue-600">
                    {grn.grnNumber}
                  </td>
                  <td className="p-4">
                    {new Date(grn.grnDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                      {grn.lineItems.length} item(s)
                    </span>
                  </td>
                  <td className="p-4 font-medium">
                    {grn.totalReceivedQuantity}
                  </td>
                  <td className="p-4">
                    <span className="text-green-600 font-medium">
                      {grn.totalGoodQuantity}
                    </span>
                    {" / "}
                    <span className="text-red-600 font-medium">
                      {grn.totalBadQuantity}
                    </span>
                  </td>
                  <td className="p-4 font-medium">
                    {grn.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        grn.status
                      )}`}
                    >
                      {grn.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 truncate max-w-xs">
                    {grn.notes || "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {grn.status?.toLowerCase() === "pending" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(grn._id, "verified")
                          }
                          disabled={updatingId === grn._id}
                          className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100 border border-purple-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {updatingId === grn._id ? "..." : "Verify"}
                        </button>
                      )}
                      {grn.status?.toLowerCase() === "verified" && (
                        <button
                          onClick={() => onTransferGRN?.(grn)}
                          className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                        >
                          <Warehouse className="w-3 h-3" /> Transfer
                        </button>
                      )}
                      <button
                        onClick={() => onViewGRN?.(grn)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
