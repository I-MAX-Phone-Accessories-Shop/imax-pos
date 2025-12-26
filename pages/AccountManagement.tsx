import React, { useState, useEffect } from "react";
import {
  Users,
  RefreshCw,
  Shield,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminAccounts,
  AdminAccount,
} from "../services/Admin/fetchAdminAccounts";
import { updateAdminAccount } from "../services/Admin/updateAdminAccount";
import { softDeleteAdminAccount } from "../services/Admin/softDeleteAdminAccount";
import { restoreAdminAccount } from "../services/Admin/restoreAdminAccount";
import { deleteAdminAccount } from "../services/Admin/deleteAdminAccount";
import { createAdminAccount } from "../services/Admin/createAdminAccount";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";

export const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(
    null
  );
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AdminAccount | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore State
  const [restoringAccountId, setRestoringAccountId] = useState<string | null>(
    null
  );

  // Hard Delete Modal State
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [accountToHardDelete, setAccountToHardDelete] =
    useState<AdminAccount | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  // Create Account Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    locationId: "",
    role: "cashier",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationProfiles, setLocationProfiles] = useState<LocationProfile[]>(
    []
  );

  useEffect(() => {
    loadAccounts();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await fetchLocationProfiles();
      console.log("Location profiles response:", response);
      if (response.success && response.data) {
        // Ensure data is an array
        const locations = Array.isArray(response.data) ? response.data : [];

        console.log("All locations from API:", locations);

        // Filter only active locations that are not deleted
        const activeLocations = locations.filter(
          (location) =>
            location.status === "active" &&
            !location.isDeleted &&
            !location.deletedAt
        );
        console.log("Active locations after filter:", activeLocations);

        // If we have active locations, use them; otherwise show all non-deleted
        if (activeLocations.length > 0) {
          setLocationProfiles(activeLocations);
        } else {
          // Fallback: show all non-deleted locations
          const nonDeleted = locations.filter(
            (location) => !location.isDeleted && !location.deletedAt
          );
          console.log("No active locations, using non-deleted:", nonDeleted);
          setLocationProfiles(nonDeleted);

          // If still empty, show all locations for debugging
          if (nonDeleted.length === 0 && locations.length > 0) {
            console.log("No non-deleted locations, showing all:", locations);
            setLocationProfiles(locations);
          }
        }
      } else {
        console.error("Failed to load locations:", response.message);
        setLocationProfiles([]);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
      setLocationProfiles([]);
    }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetchAdminAccounts();
      if (response.success && response.data) {
        setAccounts(response.data.accounts);
      } else {
        toast.error(response.message || "Failed to load accounts");
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "bg-purple-100 text-purple-700";
      case "cashier":
        return "bg-blue-100 text-blue-700";
      case "manager":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (account: AdminAccount) => {
    if (account.softDeleted) {
      return (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" /> Deleted
        </span>
      );
    }
    return (
      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name?.toLowerCase().includes(search.toLowerCase()) ||
      account.role?.toLowerCase().includes(search.toLowerCase()) ||
      account.locationId?.locationName
        ?.toLowerCase()
        .includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      account.role?.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? !account.softDeleted && !account.deletedAt
        : account.softDeleted || !!account.deletedAt;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(
    new Set(accounts.map((a) => a.role).filter(Boolean))
  );

  // Available roles for selection
  const availableRoles = ["owner", "cashier"];

  const handleOpenEditModal = (account: AdminAccount) => {
    setSelectedAccount(account);
    setEditFormData({
      name: account.name,
      role: account.role,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAccount(null);
    setEditFormData({
      name: "",
      role: "",
    });
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) return;

    if (!editFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!editFormData.role) {
      toast.error("Role is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateAdminAccount(selectedAccount._id, {
        name: editFormData.name.trim(),
        role: editFormData.role,
      });

      if (response.success) {
        toast.success("Account updated successfully!");
        handleCloseEditModal();
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to update account");
      }
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast.error(error.message || "Failed to update account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (account: AdminAccount) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  const handleSoftDeleteAccount = async () => {
    if (!accountToDelete) return;

    setIsDeleting(true);
    try {
      const response = await softDeleteAdminAccount(accountToDelete._id);

      if (response.success) {
        toast.success(
          `Account "${response.data.name}" deactivated successfully!`
        );
        handleCloseDeleteModal();
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to deactivate account");
      }
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      toast.error(error.message || "Failed to deactivate account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreAccount = async (account: AdminAccount) => {
    setRestoringAccountId(account._id);
    try {
      const response = await restoreAdminAccount(account._id);

      if (response.success) {
        toast.success(`Account "${response.data.name}" restored successfully!`);
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to restore account");
      }
    } catch (error: any) {
      console.error("Error restoring account:", error);
      toast.error(error.message || "Failed to restore account");
    } finally {
      setRestoringAccountId(null);
    }
  };

  const handleOpenHardDeleteModal = (account: AdminAccount) => {
    setAccountToHardDelete(account);
    setIsHardDeleteModalOpen(true);
  };

  const handleCloseHardDeleteModal = () => {
    setIsHardDeleteModalOpen(false);
    setAccountToHardDelete(null);
  };

  const handleHardDeleteAccount = async () => {
    if (!accountToHardDelete) return;

    setIsHardDeleting(true);
    try {
      const response = await deleteAdminAccount(accountToHardDelete._id);

      if (response.success) {
        toast.success(
          `Account "${accountToHardDelete.name}" permanently deleted!`
        );
        handleCloseHardDeleteModal();
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to delete account");
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsHardDeleting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.name.trim()) {
      toast.error("Account name is required");
      return;
    }

    if (!createFormData.password) {
      toast.error("Password is required");
      return;
    }

    if (createFormData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (createFormData.password !== createFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!createFormData.role) {
      toast.error("Role is required");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: createFormData.name.trim(),
        password: createFormData.password,
        confirmPassword: createFormData.confirmPassword,
        role: createFormData.role,
        ...(createFormData.locationId && {
          locationId: createFormData.locationId,
        }),
      };

      const response = await createAdminAccount(payload);

      if (response.success) {
        toast.success("Account created successfully!");
        setIsCreateModalOpen(false);
        setCreateFormData({
          name: "",
          password: "",
          confirmPassword: "",
          locationId: "",
          role: "cashier",
        });
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to create account");
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  const activeCount = accounts.filter(
    (a) => !a.softDeleted && !a.deletedAt
  ).length;
  const deletedCount = accounts.filter(
    (a) => a.softDeleted || !!a.deletedAt
  ).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Account Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadLocations(); // Reload locations when opening modal
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Account
          </button>
          <button
            onClick={loadAccounts}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Accounts</p>
              <p className="text-2xl font-bold text-slate-800">
                {accounts.length}
              </p>
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
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Deleted</p>
              <p className="text-2xl font-bold text-slate-800">
                {deletedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Roles</p>
              <p className="text-2xl font-bold text-slate-800">
                {uniqueRoles.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <select
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={String(role)} value={String(role)}>
                  {String(role).charAt(0).toUpperCase() + String(role).slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-500">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-slate-500">Loading accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No accounts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Name</th>
                <th className="p-4 font-semibold text-slate-600">Role</th>
                <th className="p-4 font-semibold text-slate-600">Location</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600">
                  Last Active
                </th>
                <th className="p-4 font-semibold text-slate-600">Created</th>
                <th className="p-4 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAccounts.map((account) => (
                <tr key={account._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-slate-800">
                        {account.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getRoleColor(
                        account.role
                      )}`}
                    >
                      {account.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {account.locationId ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800">
                            {account.locationId.locationName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {account.locationId.locationCode} •{" "}
                            {account.locationId.type}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No location</span>
                    )}
                  </td>
                  <td className="p-4">{getStatusBadge(account)}</td>
                  <td className="p-4 text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(account.lastActiveAt)}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {formatDate(account.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(account)}
                        disabled={account.softDeleted}
                        className="text-xs bg-primary/20 text-primary-600 px-3 py-1.5 rounded hover:bg-primary/30 border border-primary/30 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      {!account.softDeleted ? (
                        <button
                          onClick={() => handleOpenDeleteModal(account)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Deactivate
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreAccount(account)}
                            disabled={restoringAccountId === account._id}
                            className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {restoringAccountId === account._id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Restoring...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3" /> Restore
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenHardDeleteModal(account)}
                            disabled={
                              isHardDeleting &&
                              accountToHardDelete?._id === account._id
                            }
                            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 border border-red-700 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isHardDeleting &&
                            accountToHardDelete?._id === account._id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Deleting...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Delete
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Account
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter account name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, role: e.target.value })
                  }
                >
                  <option value="">Select Role</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Info Display */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-slate-700">
                    {selectedAccount._id}
                  </span>
                </div>
                {selectedAccount.locationId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-700">
                      {selectedAccount.locationId.locationName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="text-slate-700">
                    {formatDate(selectedAccount.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> Update Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Deactivate Account
              </h2>
              <button
                onClick={handleCloseDeleteModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to deactivate this account? This action
                  will prevent the user from accessing the system.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-medium text-slate-800">
                    {accountToDelete.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-medium text-slate-800">
                    {accountToDelete.role?.toUpperCase()}
                  </span>
                </div>
                {accountToDelete.locationId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-800">
                      {accountToDelete.locationId.locationName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-slate-700 text-xs">
                    {accountToDelete._id}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSoftDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Deactivate Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirmation Modal */}
      {isHardDeleteModalOpen && accountToHardDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center bg-red-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Permanently Delete Account
              </h2>
              <button
                onClick={handleCloseHardDeleteModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-2">
                      ⚠️ WARNING: This action cannot be undone!
                    </p>
                    <p className="text-sm text-red-800">
                      You are about to permanently delete this account from the
                      system. This will remove all associated data and cannot be
                      reversed. Please make sure you want to proceed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-medium text-slate-800">
                    {accountToHardDelete.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-medium text-slate-800">
                    {accountToHardDelete.role?.toUpperCase()}
                  </span>
                </div>
                {accountToHardDelete.locationId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-800">
                      {accountToHardDelete.locationId.locationName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-slate-700 text-xs">
                    {accountToHardDelete._id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-red-600">Deactivated</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseHardDeleteModal}
                  disabled={isHardDeleting}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHardDeleteAccount}
                  disabled={isHardDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isHardDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Create New Account
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateFormData({
                    name: "",
                    password: "",
                    confirmPassword: "",
                    locationId: "",
                    role: "cashier",
                  });
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter account name"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={createFormData.role}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="cashier">Cashier</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location (Optional)
                </label>
                <select
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  value={createFormData.locationId}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      locationId: e.target.value,
                    })
                  }
                >
                  <option value="">No location</option>
                  {locationProfiles.length === 0 ? (
                    <option disabled>Loading locations...</option>
                  ) : (
                    <>
                      {locationProfiles.filter(
                        (loc) => loc.type === "storefront"
                      ).length > 0 && (
                        <optgroup label="Storefronts">
                          {locationProfiles
                            .filter((loc) => loc.type === "storefront")
                            .map((loc) => (
                              <option key={loc._id} value={loc._id}>
                                {loc.locationName} ({loc.locationCode})
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {locationProfiles.filter(
                        (loc) => loc.type === "warehouse"
                      ).length > 0 && (
                        <optgroup label="Warehouses">
                          {locationProfiles
                            .filter((loc) => loc.type === "warehouse")
                            .map((loc) => (
                              <option key={loc._id} value={loc._id}>
                                {loc.locationName} ({loc.locationCode})
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {locationProfiles.length > 0 &&
                        locationProfiles.filter(
                          (loc) => loc.type === "storefront"
                        ).length === 0 &&
                        locationProfiles.filter(
                          (loc) => loc.type === "warehouse"
                        ).length === 0 && (
                          <option disabled>
                            No active locations available
                          </option>
                        )}
                    </>
                  )}
                </select>
                {locationProfiles.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    No locations found. Please check if locations are available.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full border rounded-lg p-2 pr-10 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Enter password"
                    value={createFormData.password}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        password: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="w-full border rounded-lg p-2 pr-10 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Confirm password"
                    value={createFormData.confirmPassword}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateFormData({
                      name: "",
                      password: "",
                      confirmPassword: "",
                      locationId: "",
                      role: "cashier",
                    });
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create Account
                    </>
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
