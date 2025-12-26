import React, { useState, useEffect } from "react";
import { Users, Plus, Phone, User, Loader2, X } from "lucide-react";
import { createSupplier } from "../services/Supplier/createSupplier";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { toast } from "sonner";
import { Supplier } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface SupplierFormData {
  supplierName: string;
  contactNumber: string;
}

export const Suppliers: React.FC = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<SupplierFormData>({
    supplierName: "",
    contactNumber: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await fetchSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error(t("suppliers.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierName || !formData.contactNumber) {
      toast.error(t("suppliers.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      await createSupplier(formData);
      toast.success(t("suppliers.supplierCreated"));

      // Reset form
      setFormData({
        supplierName: "",
        contactNumber: "",
      });
      setIsModalOpen(false);

      // Reload list
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {t("suppliers.title")}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-btn-primary hover:bg-btn-primary-hover text-dark px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t("suppliers.addSupplier")}
        </button>
      </div>

      {/* Suppliers List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("suppliers.registeredSuppliers")}</h2>
          <span className="bg-primary/20 text-primary-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {t("suppliers.total")}: {suppliers.length}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("suppliers.loading")}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>{t("suppliers.noSuppliers")}</p>
            <p className="text-sm mt-1">
              {t("suppliers.addFirstSupplier")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id || supplier._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {supplier.supplierName}
                      </h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Phone className="w-3 h-3 mr-1" />
                        {supplier.contactNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        supplier.isDeleted ? "bg-red-500" : "bg-green-500"
                      }`}
                    ></span>
                    <span className="text-xs text-slate-500">
                      {supplier.isDeleted ? t("suppliers.inactive") : t("suppliers.active")}
                    </span>
                  </div>
                </div>
                {supplier.createdAt && (
                  <div className="mt-3 pt-3 border-t text-xs text-slate-400">
                    {t("suppliers.added")}: {new Date(supplier.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t("suppliers.addNewSupplier")}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("suppliers.name")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full border rounded-lg pl-10 p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("suppliers.namePlaceholder")}
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("suppliers.contact")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    className="w-full border rounded-lg pl-10 p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("suppliers.contactPlaceholder")}
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-btn-primary text-dark rounded-lg hover:bg-btn-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("suppliers.creating")}
                    </>
                  ) : (
                    t("suppliers.createSupplier")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
