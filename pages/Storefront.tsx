import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Plus,
  X,
  Phone,
  MapPin,
  User,
  Mail,
  ChevronRight,
  Edit,
} from "lucide-react";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { createStorefrontProfile } from "../services/Storefront/createStorefrontProfile";
import { updateStorefrontProfile } from "../services/Storefront/updateStorefrontProfile";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

interface StorefrontProfileFormData {
  storefrontCode: string;
  storefrontName: string;
  storefrontAddress: string;
  storefrontPhone: string;
  storefrontEmail: string;
  managerName: string;
  status: "active" | "inactive";
  description: string;
  notes: string;
}

export const Storefront: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [storefrontProfiles, setStorefrontProfiles] = useState<
    StorefrontProfile[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StorefrontProfileFormData>({
    storefrontCode: "",
    storefrontName: "",
    storefrontAddress: "",
    storefrontPhone: "",
    storefrontEmail: "",
    managerName: "",
    status: "active",
    description: "",
    notes: "",
  });

  useEffect(() => {
    loadStorefrontProfiles();
  }, []);

  const loadStorefrontProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetchStorefrontProfiles();
      console.log(response);
      if (response.success && response.data) {
        setStorefrontProfiles(response.data);
      }
    } catch (error) {
      console.log(error);
      console.error("Failed to load storefront profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      storefrontCode: "",
      storefrontName: "",
      storefrontAddress: "",
      storefrontPhone: "",
      storefrontEmail: "",
      managerName: "",
      status: "active",
      description: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleOpenEdit = (profile: StorefrontProfile) => {
    setEditingId(profile._id);
    setFormData({
      storefrontCode: profile.locationCode,
      storefrontName: profile.locationName,
      storefrontAddress: profile.locationAddress,
      storefrontPhone: profile.locationPhone,
      storefrontEmail: profile.locationEmail || "",
      managerName: profile.managerName || "",
      status: profile.status || "active",
      description: profile.description || "",
      notes: profile.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.storefrontCode ||
      !formData.storefrontName ||
      !formData.storefrontAddress ||
      !formData.storefrontPhone
    ) {
      toast.error(t("storefront.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload (handle optional fields and formatting)
      const payload: any = {
        storefrontCode: formData.storefrontCode.toUpperCase(),
        storefrontName: formData.storefrontName,
        storefrontAddress: formData.storefrontAddress,
        storefrontPhone: formData.storefrontPhone,
      };

      // Add optional fields only if they have values
      if (formData.storefrontEmail) {
        payload.storefrontEmail = formData.storefrontEmail.toLowerCase();
      }
      if (formData.managerName) {
        payload.managerName = formData.managerName;
      }
      if (formData.status) {
        payload.status = formData.status;
      }
      if (formData.description) {
        payload.description = formData.description;
      }
      if (formData.notes) {
        payload.notes = formData.notes;
      }

      if (editingId) {
        // Update existing storefront
        await updateStorefrontProfile(editingId, payload);
        toast.success(t("storefront.profileUpdated"));
      } else {
        // Create new storefront
        await createStorefrontProfile(payload);
        toast.success(t("storefront.profileCreated"));
      }

      loadStorefrontProfiles();
      handleCloseModal();
    } catch (error: any) {
      toast.error(
        error.message ||
          (editingId
            ? t("storefront.failedToUpdate")
            : t("storefront.failedToCreate"))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          {t("storefront.title")}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-btn-primary hover:bg-btn-primary-hover text-dark px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t("storefront.addStorefront")}
        </button>
      </div>

      {/* Storefront Profiles List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-slate-500" />
          {t("storefront.profiles")}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-500">
            {t("storefront.loading")}
          </div>
        ) : storefrontProfiles.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {t("storefront.noStorefronts")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storefrontProfiles.map((profile) => (
              <div
                key={profile._id}
                onClick={() =>
                  navigate(`/storefront/${profile._id}`, {
                    state: {
                      storefrontName: profile.locationName,
                      storefrontCode: profile.locationCode,
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(profile);
                      }}
                      className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                      title={t("common.edit")}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
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
                  {t("storefront.viewStockItems")}{" "}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Storefront Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                {editingId
                  ? t("storefront.editProfile")
                  : t("storefront.newProfile")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.locationCode")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none uppercase"
                    placeholder={t("storefront.codePlaceholder")}
                    value={formData.storefrontCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontCode: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.status")}
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
                    <option value="active">{t("storefront.active")}</option>
                    <option value="inactive">{t("storefront.inactive")}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.locationName")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("storefront.namePlaceholder")}
                    value={formData.storefrontName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.locationAddress")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength={500}
                    rows={2}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("storefront.addressPlaceholder")}
                    value={formData.storefrontAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontAddress: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.locationPhone")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("storefront.phonePlaceholder")}
                    value={formData.storefrontPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontPhone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.locationEmail")}
                  </label>
                  <input
                    type="email"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("storefront.emailPlaceholder")}
                    value={formData.storefrontEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.managerName")}
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("storefront.managerPlaceholder")}
                    value={formData.managerName}
                    onChange={(e) =>
                      setFormData({ ...formData, managerName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("storefront.description")}
                </label>
                <textarea
                  maxLength={1000}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("storefront.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("storefront.notes")}
                </label>
                <textarea
                  maxLength={500}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("storefront.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting
                    ? editingId
                      ? t("storefront.updating")
                      : t("storefront.creating")
                    : editingId
                    ? t("storefront.updateStorefront")
                    : t("storefront.createStorefront")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
