import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  RefreshCw,
  UserPlus,
  X,
  Loader2,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  Customer,
  CustomerAddress,
  CustomerPagination,
  fetchCustomers,
} from "../services/Customer/fetchCustomers";
import { registerCustomer } from "../services/Customer/registerCustomer";
import { updateCustomer } from "../services/Customer/updateCustomer";
import { updateCustomerTier, CustomerTier } from "../services/Customer/updateCustomerTier";
import { CustomerDetailModal } from "../components/Customer/CustomerDetailModal";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TIER_OPTIONS: { value: CustomerTier | null; label: string; color: string; multiplier: string; factor: number }[] = [
  { value: null, label: "Regular", color: "bg-slate-100 text-slate-700", multiplier: "1x", factor: 10 },
  { value: "silver", label: "Silver", color: "bg-gray-100 text-gray-700", multiplier: "1.5x", factor: 15 },
  { value: "gold", label: "Gold", color: "bg-yellow-100 text-yellow-700", multiplier: "2x", factor: 20 },
  { value: "platinum", label: "Platinum", color: "bg-purple-100 text-purple-700", multiplier: "3x", factor: 30 },
];

const getTierDisplay = (tier?: string) => {
  const found = TIER_OPTIONS.find((t) => t.value === tier);
  return found || TIER_OPTIONS[0];
};

export const Customers: React.FC = () => {
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<CustomerPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    phone: string;
    addresses: CustomerAddress[];
  }>({
    name: "",
    phone: "",
    addresses: [],
  });

  const [updatingTierCustomerId, setUpdatingTierCustomerId] = useState<string | null>(null);

  const totalItems = pagination?.totalItems ?? customers.length;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetchCustomers({ page, limit });

      if (response.success) {
        setCustomers(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination({
            currentPage: page,
            totalPages: 1,
            totalItems: response.data.length,
            itemsPerPage: response.data.length,
          });
        }
      } else {
        setCustomers([]);
        setPagination(null);
        toast.error(response.message || t("customers.failedToLoad"));
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error(t("customers.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.addresses?.some(
          (a) =>
            a.city?.toLowerCase().includes(q) ||
            a.addressLine?.toLowerCase().includes(q),
        ),
    );
  }, [customers, search]);

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleTierChange = async (customerId: string, newTier: CustomerTier | null) => {
    setUpdatingTierCustomerId(customerId);
    try {
      const result = await updateCustomerTier(customerId, newTier);
      if (result.success) {
        toast.success("Customer tier updated");
        loadCustomers();
      } else {
        toast.error(result.message || "Failed to update tier");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update tier");
    } finally {
      setUpdatingTierCustomerId(null);
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (!pagination) return;
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

  const getDefaultAddressPreview = (customer: Customer) => {
    const addr =
      customer.addresses?.find((a) => a.isDefault) || customer.addresses?.[0];
    if (!addr) return "-";
    return `${addr.addressLine}, ${addr.city}`;
  };

  const handleOpenRegisterModal = () => {
    setFormData({ name: "", phone: "", password: "" });
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setFormData({ name: "", phone: "", password: "" });
  };

  const handleRegisterCustomer = async () => {
    if (!formData.name.trim()) {
      toast.error(t("customers.nameRequired"));
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(t("customers.phoneRequired"));
      return;
    }
    // if (!formData.password.trim()) {
    //   toast.error(t("customers.passwordRequired"));
    //   return;
    // }
    // if (formData.password.trim().length < 6) {
    //   toast.error(t("customers.passwordMinLength"));
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const response = await registerCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: "password123",
      });

      if (response.success) {
        toast.success(response.message || t("customers.registerSuccess"));
        handleCloseRegisterModal();
        setPage(1);
        loadCustomers();
      } else {
        toast.error(response.message || t("customers.registerFailed"));
      }
    } catch (error: any) {
      console.error("Error registering customer:", error);
      toast.error(error?.message || t("customers.registerFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeAddresses = (addresses: CustomerAddress[]) => {
    const hasDefault = addresses.some((a) => a.isDefault);
    if (!addresses.length) return [];
    if (hasDefault) return addresses;
    return addresses.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomerId(customer._id);
    setEditFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      addresses: normalizeAddresses(
        (customer.addresses || []).map((a) => ({
          label: a.label || "",
          addressLine: a.addressLine || "",
          city: a.city || "",
          isDefault: !!a.isDefault,
        })),
      ),
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomerId(null);
    setEditSubmitting(false);
    setEditFormData({ name: "", phone: "", addresses: [] });
  };

  const handleAddAddress = () => {
    setEditFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          label: "",
          addressLine: "",
          city: "",
          isDefault: prev.addresses.length === 0,
        },
      ],
    }));
  };

  const handleRemoveAddress = (idx: number) => {
    setEditFormData((prev) => {
      const next = prev.addresses.filter((_, i) => i !== idx);
      const hasDefault = next.some((a) => a.isDefault);
      const normalized = hasDefault
        ? next
        : next.map((a, i) => ({ ...a, isDefault: i === 0 }));
      return { ...prev, addresses: normalized };
    });
  };

  const handleSetDefaultAddress = (idx: number) => {
    setEditFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a, i) => ({ ...a, isDefault: i === idx })),
    }));
  };

  const handleUpdateAddressField = (
    idx: number,
    field: keyof Omit<CustomerAddress, "_id" | "isDefault">,
    value: string,
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a,
      ),
    }));
  };

  const handleEditCustomer = async () => {
    if (!editingCustomerId) return;

    if (!editFormData.name.trim()) {
      toast.error(t("customers.nameRequired"));
      return;
    }
    if (!editFormData.phone.trim()) {
      toast.error(t("customers.phoneRequired"));
      return;
    }

    const addresses = editFormData.addresses.map((a) => ({
      label: (a.label || "").trim(),
      addressLine: (a.addressLine || "").trim(),
      city: (a.city || "").trim(),
      isDefault: !!a.isDefault,
    }));

    if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
      addresses[0].isDefault = true;
    }

    if (addresses.some((a) => !a.addressLine || !a.city)) {
      toast.error(t("customers.addressFieldsRequired"));
      return;
    }

    setEditSubmitting(true);
    try {
      const response = await updateCustomer(editingCustomerId, {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        addresses,
      });

      if (response.success) {
        toast.success(response.message || t("customers.updateSuccess"));
        handleCloseEditModal();
        loadCustomers();
      } else {
        toast.error(response.message || t("customers.updateFailed"));
      }
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error?.message || t("customers.updateFailed"));
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            {t("customers.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("customers.subtitle")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={loadCustomers}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 sm:px-4 rounded-lg disabled:opacity-50 text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{t("common.refresh")}</span>
          </button>
          <button
            onClick={handleOpenRegisterModal}
            className="inline-flex items-center gap-2 bg-primary text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-primary/90 text-sm sm:text-base font-medium"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("customers.addCustomer")}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          {t("common.search")}
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("customers.searchPlaceholder")}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
        />
      </div>

      <div className="flex justify-between items-center mb-2 text-xs text-slate-500">
        <span>
          {t("customers.totalItemsLabel").replace(
            "{count}",
            totalItems.toString(),
          )}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("common.name")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("common.phone")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("common.address")}
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                {t("customers.addressCount")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("common.status")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("common.date")}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  {t("common.loading")}
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  {t("customers.noCustomers")}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => {
                const displayIndex =
                  ((pagination?.currentPage ?? 1) - 1) *
                    (pagination?.itemsPerPage ?? limit) +
                  index +
                  1;

                return (
                  <tr key={customer._id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {displayIndex}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {customer.name}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {customer.phone}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">
                      {getDefaultAddressPreview(customer)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {customer.addresses?.length ?? 0}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          customer.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {customer.isActive
                          ? t("customers.active")
                          : t("customers.inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenDetail(customer)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          {t("common.view")}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(customer)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                          title={t("common.edit")}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {t("common.edit")}
                          </span>
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2 text-xs text-slate-600">
          <div>
            {t("orders.paginationSummary")
              .replace("{page}", pagination.currentPage.toString())
              .replace("{totalPages}", pagination.totalPages.toString())
              .replace("{totalItems}", pagination.totalItems.toString())}
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-slate-200 bg-white text-xs disabled:opacity-50"
            >
              {t("common.previous")}
            </button>
            <span>
              {t("orders.page")} {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 rounded border border-slate-200 bg-white text-xs disabled:opacity-50"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      <CustomerDetailModal
        isOpen={detailOpen}
        loading={false}
        customer={selectedCustomer}
        onClose={() => {
          setDetailOpen(false);
          setSelectedCustomer(null);
        }}
        onTierChange={handleTierChange}
        isUpdatingTier={updatingTierCustomerId === selectedCustomer?._id}
      />

      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                {t("customers.registerTitle")}
              </h2>
              <button
                onClick={handleCloseRegisterModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("common.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder={t("customers.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("common.phone")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder={t("customers.phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("login.password")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder={t("customers.passwordPlaceholder")}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div> */}
            </div>

            <div className="p-6 border-t bg-slate-50 rounded-b-xl flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCloseRegisterModal}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors order-2 sm:order-1"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleRegisterCustomer}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("customers.registering")}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {t("customers.addCustomer")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                {t("customers.editTitle")}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("common.name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder={t("customers.namePlaceholder")}
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("common.phone")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder={t("customers.phonePlaceholder")}
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-800">
                  {t("customers.addresses")}
                </h3>
                <button
                  onClick={handleAddAddress}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t("customers.addAddress")}
                </button>
              </div>

              {editFormData.addresses.length === 0 ? (
                <div className="text-sm text-slate-500">
                  {t("customers.noAddresses")}
                </div>
              ) : (
                <div className="space-y-3">
                  {editFormData.addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="radio"
                              name="defaultAddress"
                              checked={!!addr.isDefault}
                              onChange={() => handleSetDefaultAddress(idx)}
                            />
                            {t("customers.defaultAddress")}
                          </label>
                        </div>
                        <button
                          onClick={() => handleRemoveAddress(idx)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t("customers.removeAddress")}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            {t("customers.addressLabel")}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                            value={addr.label || ""}
                            onChange={(e) =>
                              handleUpdateAddressField(
                                idx,
                                "label",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            {t("customers.city")}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                            value={addr.city || ""}
                            onChange={(e) =>
                              handleUpdateAddressField(
                                idx,
                                "city",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            {t("customers.addressLine")}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                            value={addr.addressLine || ""}
                            onChange={(e) =>
                              handleUpdateAddressField(
                                idx,
                                "addressLine",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 rounded-b-xl flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors order-2 sm:order-1"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleEditCustomer}
                disabled={editSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium order-1 sm:order-2"
              >
                {editSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("customers.updating")}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    {t("customers.updateCustomer")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
