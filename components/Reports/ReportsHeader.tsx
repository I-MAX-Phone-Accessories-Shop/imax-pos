import React from "react";
import { RefreshCw } from "lucide-react";
import { LocationProfile } from "../../services/Location/fetchLocationProfiles";
import { DateRangePicker } from "./DateRangePicker";

interface ReportsHeaderProps {
  storefronts: LocationProfile[];
  selectedStorefront: string;
  onStorefrontChange: (storefrontId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  storefronts,
  selectedStorefront,
  onStorefrontChange,
  onRefresh,
  loading,
  startDate,
  endDate,
  onDateRangeChange,
}) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
      <div className="flex items-center gap-4">
        <select
          value={selectedStorefront}
          onChange={(e) => onStorefrontChange(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">All Storefronts</option>
          {storefronts.map((sf) => (
            <option key={sf._id} value={sf._id}>
              {sf.locationName} ({sf.locationCode})
            </option>
          ))}
        </select>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onDateRangeChange}
        />
        {/* <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button> */}
      </div>
    </div>
  );
};
