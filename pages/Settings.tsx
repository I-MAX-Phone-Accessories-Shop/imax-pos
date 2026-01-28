import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Role } from "../types";
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Truck,
  FileText,
} from "lucide-react";
import {
  fetchStockAuditLogs,
  StockAuditLog,
} from "../services/StockAudit/fetchStockAuditLogs";
import {
  fetchTransfers,
  TransferData,
} from "../services/Purchase/fetchTransfers";
import { toast } from "sonner";
import { TransferList } from "../components/Purchasing/TransferList";
import { TransferDetailModal } from "../components/Purchasing/TransferDetailModal";

export const Settings: React.FC = () => {
  const { currentUser, setUserRole, logs } = useApp();
  const [stockAuditLogs, setStockAuditLogs] = useState<StockAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferList, setTransferList] = useState<TransferData[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null,
  );
  const [isTransferDetailModalOpen, setIsTransferDetailModalOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "transfer">("audit");

  const loadStockAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetchStockAuditLogs();
      if (response.success && response.data) {
        setStockAuditLogs(response.data);
      } else {
        toast.error(response.message || "Failed to load stock audit logs");
      }
    } catch (error) {
      console.error("Error loading stock audit logs:", error);
      toast.error("Failed to load stock audit logs");
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await fetchTransfers();
      if (res.success) {
        setTransferList(res.data.reverse());
      }
    } catch (error) {
      console.error("Failed to load transfers", error);
      toast.error("Failed to load transfers");
    }
  };

  const handleViewTransfer = (transfer: TransferData) => {
    setSelectedTransferId(transfer._id);
    setIsTransferDetailModalOpen(true);
  };

  useEffect(() => {
    loadStockAuditLogs();
    loadTransfers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-4 sm:p-6 max-w-full">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800">
        System Settings
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === "audit"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
          <span className="hidden sm:inline">Stock Audit Logs</span>
          <span className="sm:hidden">Audit</span>
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === "transfer"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Truck className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
          <span className="hidden sm:inline">Transfer Management</span>
          <span className="sm:hidden">Transfers</span>
        </button>
      </div>

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />{" "}
              Stock Audit Logs
            </h2>
            <button
              onClick={loadStockAuditLogs}
              disabled={loading}
              className="hidden sm:flex items-center gap-2 bg-slate-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 sm:p-8 text-center text-slate-500">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm sm:text-base">
                Loading stock audit logs...
              </p>
            </div>
          ) : stockAuditLogs.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-slate-500">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm sm:text-base">No stock audit logs found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="">
                <div className="overflow-x-auto h-[calc(100vh-350px)] sm:h-[calc(100vh-330px)] overflow-y-auto">
                  <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-slate-50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Date</span>
                          <span className="sm:hidden">Date</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Product</span>
                          <span className="sm:hidden">Product</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Location</span>
                          <span className="sm:hidden">Location</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Action</span>
                          <span className="sm:hidden">Action</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">Before</span>
                          <span className="sm:hidden">Before</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">After</span>
                          <span className="sm:hidden">After</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">Change</span>
                          <span className="sm:hidden">Change</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Admin</span>
                          <span className="sm:hidden">Admin</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Reason</span>
                          <span className="sm:hidden">Reason</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stockAuditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50">
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs">
                            <span className="truncate">
                              {formatDate(log.createdAt)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              <span
                                className="truncate"
                                title={log.inventoryId?.productName}
                              >
                                {log.inventoryId?.productName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span
                                className="truncate"
                                title={`${log.inventoryId?.productCode} | ${log.inventoryId?.SKU}`}
                              >
                                {log.inventoryId?.productCode} |{" "}
                                {log.inventoryId?.SKU}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              <span
                                className="truncate"
                                title={log.locationId?.locationName}
                              >
                                {log.locationId?.locationName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span
                                className="truncate"
                                title={`${log.locationId?.locationCode} (${log.locationType})`}
                              >
                                {log.locationId?.locationCode} (
                                {log.locationType})
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                log.action === "add"
                                  ? "bg-green-100 text-green-700"
                                  : log.action === "remove"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {log.beforeQuantity.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {log.afterQuantity.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {log.isIncrease ? (
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              ) : log.isDecrease ? (
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                              ) : null}
                              <span
                                className={`font-bold text-xs sm:text-sm ${
                                  log.isIncrease
                                    ? "text-green-600"
                                    : log.isDecrease
                                      ? "text-red-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {log.quantityChange > 0 ? "+" : ""}
                                {log.quantityChange.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-600 text-xs sm:text-sm">
                            <span
                              className="truncate"
                              title={log?.adminId?.name}
                            >
                              {log?.adminId?.name || "-"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                            <span
                              className="truncate"
                              title={log?.reason || "-"}
                            >
                              {log?.reason || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transfer Management Tab */}
      {activeTab === "transfer" && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />{" "}
              Transfer Management
            </h2>
            <button
              onClick={loadTransfers}
              className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <TransferList
            transferList={transferList}
            onViewTransfer={handleViewTransfer}
            onStatusChange={loadTransfers}
          />
        </div>
      )}

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        isOpen={isTransferDetailModalOpen}
        onClose={() => setIsTransferDetailModalOpen(false)}
        transferId={selectedTransferId}
      />
    </div>
  );
};
