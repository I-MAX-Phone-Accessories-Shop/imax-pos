import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  PieChart,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const Sidebar: React.FC = () => {
  const { currentUser } = useApp();

  const menuItems = [
    { path: "/pos", label: "Checkout (POS)", icon: ShoppingCart },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/warehouse", label: "Warehouse", icon: Truck },
    { path: "/suppliers", label: "Suppliers", icon: Users },
    { path: "/purchasing", label: "Purchasing", icon: ShoppingBag },
    { path: "/credits", label: "Credit Sales", icon: CreditCard },
    { path: "/expenses", label: "Expenses", icon: PieChart },
    { path: "/reports", label: "Reports", icon: LayoutDashboard },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 pt-8 shadow-xl print:hidden">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold text-blue-400 tracking-tight">
          MobileAx
        </h1>
        <p className="text-slate-400 text-xs mt-1">POS System MVP</p>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          // Simple permission check: Staff cannot purchase
          if (item.path === "/purchasing" && currentUser.role !== "ADMIN")
            return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{currentUser.name}</p>
            <p className="text-xs text-slate-400">{currentUser.role}</p>
          </div>
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `mt-4 flex items-center text-xs transition-colors ${
              isActive ? "text-white" : "text-slate-400 hover:text-white"
            }`
          }
        >
          <Settings className="w-3 h-3 mr-1" /> Settings
        </NavLink>
      </div>
    </div>
  );
};
