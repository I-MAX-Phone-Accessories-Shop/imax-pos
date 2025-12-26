import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  X,
  Building2,
  Phone,
  MapPin,
  User,
  Mail,
  ChevronRight,
} from "lucide-react";
import { createWarehouseProfile } from "../services/Warehouse/createWarehouseProfile";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import { toast } from "sonner";
import { WarehouseProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface WarehouseProfileFormData {
  warehouseCode: string;
  warehouseName: string;
  warehouseAddress: string;
  warehousePhone: string;
  warehouseEmail: string;
  managerName: string;
  status: "active" | "inactive";
  description: string;
  notes: string;
}

export const Warehouse: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [warehouseProfiles, setWarehouseProfiles] = useState<
    WarehouseProfile[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WarehouseProfileFormData>({
    warehouseCode: "",
    warehouseName: "",
    warehouseAddress: "",
    warehousePhone: "",
    warehouseEmail: "",
    managerName: "",
    status: "active",
    description: "",
    notes: "",
  });

  useEffect(() => {
    loadWarehouseProfiles();
  }, []);

  const loadWarehouseProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetchWarehouseProfiles();
      console.log(response);
      if (response.success && response.data) {
        setWarehouseProfiles(response.data);
      }
    } catch (error) {
      console.log(error);
      console.error("Failed to load warehouse profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.warehouseCode ||
      !formData.warehouseName ||
      !formData.warehouseAddress ||
      !formData.warehousePhone
    ) {
      toast.error(t("warehouse.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload (handle optional fields and formatting)
      const payload = {
        warehouseCode: formData.warehouseCode.toUpperCase(),
        warehouseName: formData.warehouseName,
        warehouseAddress: formData.warehouseAddress,
        warehousePhone: formData.warehousePhone,
        ...(formData.warehouseEmail && {
          warehouseEmail: formData.warehouseEmail.toLowerCase(),
        }),
        ...(formData.managerName && { managerName: formData.managerName }),
        status: formData.status,
        ...(formData.description && { description: formData.description }),
        ...(formData.notes && { notes: formData.notes }),
      };

      await createWarehouseProfile(payload);
      loadWarehouseProfiles();

      toast.success(t("warehouse.profileCreated"));
      setIsModalOpen(false);
      // Reset form
      setFormData({
        warehouseCode: "",
        warehouseName: "",
        warehouseAddress: "",
        warehousePhone: "",
        warehouseEmail: "",
        managerName: "",
        status: "active",
        description: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error(error.message || t("warehouse.failedToCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {t("warehouse.title")}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-btn-primary hover:bg-btn-primary-hover text-dark px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t("warehouse.addWarehouse")}
        </button>
      </div>

      {/* Warehouse Profiles List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-500" />
          {t("warehouse.profiles")}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-500">
            {t("warehouse.loading")}
          </div>
        ) : warehouseProfiles.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {t("warehouse.noWarehouses")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseProfiles.map((profile) => (
              <div
                key={profile._id}
                onClick={() =>
                  navigate(`/warehouse/${profile._id}`, {
                    state: {
                      warehouseName: profile.locationName,
                      warehouseCode: profile.locationCode,
                    },
                  })
                }
                className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 group-hover:text-primary transition-colors">
                      {profile.locationName}
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary-700 rounded-full">
                        {profile.locationCode}
                      </span>
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      {profile.locationAddress}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        profile.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {profile.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {profile.locationPhone}
                  </div>
                  {profile.managerName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {profile.managerName}
                    </div>
                  )}
                  {profile.locationEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {profile.locationEmail}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("warehouse.viewStockItems")} <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {t("warehouse.newProfile")}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationCode")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none uppercase"
                    placeholder={t("warehouse.codePlaceholder")}
                    value={formData.warehouseCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseCode: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.status")}
                  </label>
                  <select
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                  >
                    <option value="active">{t("warehouse.active")}</option>
                    <option value="inactive">{t("warehouse.inactive")}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.namePlaceholder")}
                    value={formData.warehouseName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationAddress")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength={500}
                    rows={2}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.addressPlaceholder")}
                    value={formData.warehouseAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseAddress: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationPhone")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.phonePlaceholder")}
                    value={formData.warehousePhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehousePhone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationEmail")}
                  </label>
                  <input
                    type="email"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.emailPlaceholder")}
                    value={formData.warehouseEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.managerName")}
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.managerPlaceholder")}
                    value={formData.managerName}
                    onChange={(e) =>
                      setFormData({ ...formData, managerName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("warehouse.description")}
                </label>
                <textarea
                  maxLength={1000}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("warehouse.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("warehouse.notes")}
                </label>
                <textarea
                  maxLength={500}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("warehouse.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? t("warehouse.creating") : t("warehouse.createWarehouse")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
