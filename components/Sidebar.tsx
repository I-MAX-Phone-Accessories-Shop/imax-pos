import React from "react";
import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useApp } from "../context/AppContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();

  const menuItems = [
    { path: "/pos", label: "Checkout (POS)", icon: ShoppingCart },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/warehouse", label: "Warehouse", icon: Truck },
    { path: "/storefront", label: "Storefront", icon: Store },
    { path: "/suppliers", label: "Suppliers", icon: Users },
    { path: "/purchasing", label: "Purchasing", icon: ShoppingBag },
    { path: "/orders", label: "Orders", icon: Receipt },
    { path: "/credits", label: "Credit Sales", icon: CreditCard },
    { path: "/expenses", label: "Expenses", icon: PieChart },
    { path: "/reports", label: "Reports", icon: LayoutDashboard },
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
            <img
              src="/imaslogo.jpg"
              alt="IMAS Logo"
              className="w-12 h-12 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-primary tracking-tight">
                IMAS
              </h1>
              <p className="text-dark-500 text-xs">POS System</p>
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

            // Simple permission check: Staff cannot purchase
            if (item.path === "/purchasing" && currentUser.role !== "ADMIN")
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
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {currentUser.name}
              </p>
              <p className="text-xs text-dark-500">{currentUser.role}</p>
            </div>
          </div>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-dark"
                  : "text-dark-400 hover:text-primary hover:bg-primary/10"
              }`
            }
          >
            <Settings className="w-4 h-4" /> Settings
          </NavLink>
        </div>
      </div>
    </>
  );
};
