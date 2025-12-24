import React, { useState, useEffect } from "react";
import {
  UserPlus,
  RefreshCw,
  Search,
  Phone,
  User,
  AlertTriangle,
  CheckCircle,
  Ban,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";

export const Credits: React.FC = () => {
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  useEffect(() => {
    loadCreditPersonas();
  }, []);

  const loadCreditPersonas = async () => {
    setLoading(true);
    try {
      const response = await fetchCreditPersonas();
      if (response.success && response.data) {
        setCreditPersonas(response.data);
      } else {
        toast.error(response.message || "Failed to load credit personas");
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
      toast.error("Failed to load credit personas");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadCreditPersonas();
    toast.success("Credit personas refreshed");
  };

  const handleOpenAddModal = () => {
    setFormData({ name: "", phone: "" });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({ name: "", phone: "" });
  };

  const handleAddProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCreditPersona({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      if (response.success) {
        toast.success("Credit profile created successfully");
        handleCloseAddModal();
        loadCreditPersonas(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to create credit profile");
      }
    } catch (error) {
      console.error("Error creating credit profile:", error);
      toast.error("Failed to create credit profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter personas by search
  const filteredPersonas = creditPersonas.filter((persona) => {
    const searchLower = search.toLowerCase();
    return (
      persona.name.toLowerCase().includes(searchLower) ||
      persona.phone.includes(search)
    );
  });

  // Stats
  const totalPersonas = creditPersonas.length;
  const blacklistedCount = creditPersonas.filter((p) => p.blacklist).length;
  const activeCount = totalPersonas - blacklistedCount;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Credit Profiles
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage credit customers and their status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-btn-primary text-dark px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-btn-primary-hover transition-colors font-medium"
          >
            <UserPlus className="w-4 h-4" /> Add Credit Profile
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Profiles</p>
              <p className="text-2xl font-bold text-slate-800">{totalPersonas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Blacklisted</p>
              <p className="text-2xl font-bold text-slate-800">{blacklistedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Credit Personas Table */}
      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-800">
            Credit Profiles ({filteredPersonas.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading credit profiles...
          </div>
        ) : filteredPersonas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {search
              ? "No credit profiles found matching your search."
              : "No credit profiles found. Add your first credit profile."}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Blacklist Reason</th>
                <th className="px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPersonas.map((persona) => (
                <tr key={persona._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-slate-800">
                        {persona.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5" />
                      {persona.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {persona.blacklist ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <Ban className="w-3 h-3" /> Blacklisted
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {persona.blacklistReason ? (
                      <div className="flex items-center gap-1.5 text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {persona.blacklistReason}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(persona.createdAt).toLocaleDateString()}{" "}
                    {new Date(persona.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-200 border border-slate-200 font-medium transition-colors">
                        View
                      </button>
                      {!persona.blacklist && (
                        <button className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors">
                          Blacklist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Credit Profile Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add Credit Profile
              </h2>
              <button
                onClick={handleCloseAddModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter customer name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={handleCloseAddModal}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProfile}
                disabled={isSubmitting}
                className="px-4 py-2 bg-btn-primary text-dark rounded-lg hover:bg-btn-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Profile
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
