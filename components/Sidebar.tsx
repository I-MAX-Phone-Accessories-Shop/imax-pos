import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Store,
  CreditCard,
  PieChart,
  Settings,
  ShoppingBag,
  Users,
  X,
  Receipt,
  Shield,
  LogOut,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { removeAuthToken } from "../services/axios";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    // Get admin data from localStorage
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("adminData");
    toast.success(t("sidebar.loggedOut"));
    navigate("/login");
    onClose();
  };

  const menuItems = [
    { path: "/pos", label: t("sidebar.checkout"), icon: ShoppingCart },
    { path: "/inventory", label: t("sidebar.inventory"), icon: Package },
    { path: "/warehouse", label: t("sidebar.warehouse"), icon: Truck },
    { path: "/storefront", label: t("sidebar.storefront"), icon: Store },
    { path: "/suppliers", label: t("sidebar.suppliers"), icon: Users },
    { path: "/purchasing", label: t("sidebar.purchasing"), icon: ShoppingBag },
    { path: "/orders", label: t("sidebar.orders"), icon: Receipt },
    {
      path: "/credit-orders",
      label: t("sidebar.creditOrder"),
      icon: CreditCard,
    },
    { path: "/credits", label: t("sidebar.creditSales"), icon: CreditCard },
    { path: "/expenses", label: t("sidebar.expenses"), icon: PieChart },
    { path: "/reports", label: t("sidebar.reports"), icon: LayoutDashboard },
    { path: "/accounts", label: t("sidebar.accountManagement"), icon: Shield },
  ];

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`w-72 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl print:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-primary/20">
          <div className="flex items-center gap-3">
            {/* <img
              src="/imaslogo.jpg"
              alt="IMAS Logo"
              className="w-12 h-12 object-contain rounded-lg"
            /> */}
            <div>
              <h1 className="text-xl font-bold text-primary tracking-tight">
                OTAS POS
              </h1>
              <p className="text-dark-500 text-xs">{t("app.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            // Permission check: Only owner can access Account Management
            const userRole = adminData?.role || currentUser.role;
            if (item.path === "/accounts" && userRole !== "owner") return null;
            if (
              item.path === "/purchasing" &&
              userRole !== "admin" &&
              userRole !== "owner"
            )
              return null;
            if (
              item.path === "/inventory" &&
              userRole !== "admin" &&
              userRole !== "owner"
            )
              return null;
            if (
              item.path === "/warehouse" &&
              userRole !== "admin" &&
              userRole !== "owner"
            )
              return null;
            if (
              item.path === "/suppliers" &&
              userRole !== "admin" &&
              userRole !== "owner"
            )
              return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-dark shadow-lg shadow-primary/25"
                      : "text-dark-400 hover:bg-primary/10 hover:text-primary"
                  }`
                }
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Icon
                  className={`w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110`}
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-primary/20 bg-dark-950/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-dark font-bold text-sm">
              {(adminData?.name || currentUser.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {adminData?.name || currentUser.name}
              </p>
              <p className="text-xs text-dark-500">
                {adminData?.role || currentUser.role}
              </p>
            </div>
          </div>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors mb-2 ${
                isActive
                  ? "bg-primary text-dark"
                  : "text-dark-400 hover:text-primary hover:bg-primary/10"
              }`
            }
          >
            <Settings className="w-4 h-4" /> {t("sidebar.settings")}
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" /> {t("sidebar.logout")}
          </button>
        </div>
      </div>
    </>
  );
};
