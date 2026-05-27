import React from "react";
import { X, User, Phone, MapPin, RefreshCw } from "lucide-react";
import type { Customer } from "../../services/Customer/fetchCustomers";
import { useLanguage } from "../../context/LanguageContext";

interface CustomerDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  loading,
  customer,
  onClose,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const defaultAddress =
    customer?.addresses?.find((a) => a.isDefault) || customer?.addresses?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-row justify-between items-start gap-4 p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t("customers.detailTitle")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading || !customer ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-slate-500">{t("common.loading")}...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    {t("common.name")}
                  </p>
                  <p className="font-bold text-blue-800">{customer.name}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    {t("common.status")}
                  </p>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      customer.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {customer.isActive
                      ? t("customers.active")
                      : t("customers.inactive")}
                  </span>
                </div>
              </div>

              <div className="mb-6 flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{customer.phone}</span>
              </div>

              <div className="mb-6 text-sm text-slate-600">
                <p>
                  {t("customers.registered")}: {formatDate(customer.createdAt)}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t("customers.addresses")} ({customer.addresses?.length || 0})
                </h4>

                {customer.addresses?.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t("customers.noAddresses")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customer.addresses.map((addr, idx) => (
                      <div
                        key={addr._id || idx}
                        className={`p-4 rounded-lg border ${
                          addr.isDefault || addr === defaultAddress
                            ? "bg-teal-50 border-teal-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-slate-800 text-sm">
                            {addr.label || t("common.address")}
                          </p>
                          {addr.isDefault && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                              {t("customers.defaultAddress")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {addr.addressLine}, {addr.city}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
