import React from "react";
import { Store, DollarSign, CreditCard } from "lucide-react";

type TabType = "overall" | "paid" | "credit";

interface ReportTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ReportTabs: React.FC<ReportTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex gap-2 border-b">
      <button
        onClick={() => onTabChange("overall")}
        className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
          activeTab === "overall"
            ? "border-b-2 border-primary text-primary"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Store className="w-4 h-4" />
        Overall
      </button>
      <button
        onClick={() => onTabChange("paid")}
        className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
          activeTab === "paid"
            ? "border-b-2 border-green-600 text-green-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <DollarSign className="w-4 h-4" />
        Paid Orders
      </button>
      <button
        onClick={() => onTabChange("credit")}
        className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
          activeTab === "credit"
            ? "border-b-2 border-orange-600 text-orange-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <CreditCard className="w-4 h-4" />
        Credit Orders
      </button>
    </div>
  );
};

