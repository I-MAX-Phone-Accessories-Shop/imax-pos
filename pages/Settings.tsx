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
} from "lucide-react";
import {
  fetchStockAuditLogs,
  StockAuditLog,
} from "../services/StockAudit/fetchStockAuditLogs";
import { toast } from "sonner";

export const Settings: React.FC = () => {
  const { currentUser, setUserRole, logs } = useApp();
  const [stockAuditLogs, setStockAuditLogs] = useState<StockAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadStockAuditLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        System Settings
      </h1>

      {/* <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" /> Role Simulation
        </h2>
        <p className="text-slate-600 mb-4 text-sm">
            Toggle your active role to test permissions. <br/>
            <span className="font-semibold">Staff</span>: Cannot Purchase, Cannot Adjust Stock, Max 20% discount.
        </p>
        
        <div className="flex gap-4">
            <button 
                onClick={() => setUserRole(Role.ADMIN)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${currentUser.role === Role.ADMIN ? 'border-primary bg-primary/10 text-primary-700 font-bold' : 'border-slate-200 text-slate-600'}`}
            >
                Admin (Owner)
            </button>
            <button 
                onClick={() => setUserRole(Role.STAFF)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${currentUser.role === Role.STAFF ? 'border-primary bg-primary/10 text-primary-700 font-bold' : 'border-slate-200 text-slate-600'}`}
            >
                Staff
            </button>
        </div>
      </div> */}

      {/* <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Audit Logs
        </h2>
        <div className="overflow-auto max-h-[400px] bg-slate-50 rounded-lg border p-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 border-b border-slate-200 last:border-0 text-sm"
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold text-slate-700">{log.action}</span>
                <span className="text-xs text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-600">{log.details}</p>
              <p className="text-xs text-primary mt-1">User: {log.user}</p>
            </div>
          ))}
        </div>
      </div> */}

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-primary" /> Stock Audit
            Logs
          </h2>
          <button
            onClick={loadStockAuditLogs}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p>Loading stock audit logs...</p>
          </div>
        ) : stockAuditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No stock audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Product
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Location
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Action
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                    Before
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                    After
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                    Change
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Admin
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stockAuditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {log.inventoryId.productName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.inventoryId.productCode} | {log.inventoryId.SKU}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {log.locationId.locationName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.locationId.locationCode} ({log.locationType})
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {log.beforeQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {log.afterQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {log.isIncrease ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : log.isDecrease ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : null}
                        <span
                          className={`font-bold ${
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
                    <td className="px-4 py-3 text-slate-600">
                      {log.adminId.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {log.reason || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
