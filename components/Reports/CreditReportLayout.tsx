import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../../services/Location/fetchLocationProfiles";
import { DateRangePicker } from "./DateRangePicker";
import { formatDateParam, parseDateParam } from "./reportUtils";

// Shared URL-driven filters (?date=YYYY-MM-DD&storefront=<id|all>) and the
// active storefront list for the credit report pages
export const useCreditReportFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storefronts, setStorefronts] = useState<LocationProfile[]>([]);

  const dateParam = searchParams.get("date");
  const date = useMemo(
    () => parseDateParam(dateParam) || new Date(),
    [dateParam],
  );
  const dateStr = formatDateParam(date);
  const storefront = searchParams.get("storefront") || "all";

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    // An empty value removes the param
    Object.entries(updates).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const loadStorefronts = async () => {
      const response = await fetchLocationProfiles().catch(() => null);
      if (response?.success) {
        setStorefronts(
          response.data
            .filter(
              (loc) => loc.type === "storefront" && loc.status === "active",
            )
            .reverse(),
        );
      }
    };
    loadStorefronts();
  }, []);

  return { date, dateStr, storefront, storefronts, updateParams };
};

interface CreditReportHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName: string;
  dateStr: string;
  date: Date;
  storefront: string;
  storefronts: LocationProfile[];
  updateParams: (updates: Record<string, string>) => void;
}

export const CreditReportHeader: React.FC<CreditReportHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  dateStr,
  date,
  storefront,
  storefronts,
  updateParams,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
      <div className="flex items-start gap-3">
        <button
          onClick={() =>
            navigate(
              `/reports?tab=revenue&date=${dateStr}&storefront=${storefront}`,
            )
          }
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Back to Reports"
          aria-label="Back to Reports"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${iconClassName}`} />
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={storefront}
          onChange={(e) => updateParams({ storefront: e.target.value })}
          className="px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm sm:text-base bg-white"
        >
          <option value="all">All Storefronts</option>
          {storefronts.map((sf) => (
            <option key={sf._id} value={sf._id}>
              {sf.locationName}
            </option>
          ))}
        </select>
        <DateRangePicker
          startDate={date}
          endDate={date}
          singleDate
          onChange={(_start, end) => {
            if (end) updateParams({ date: formatDateParam(end) });
          }}
        />
      </div>
    </div>
  );
};

const SUMMARY_CARD_COLORS = {
  green: {
    card: "bg-green-50 border-green-200",
    icon: "text-green-600",
    label: "text-green-800",
    value: "text-green-900",
    caption: "text-green-600",
  },
  blue: {
    card: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    label: "text-blue-800",
    value: "text-blue-900",
    caption: "text-blue-600",
  },
  purple: {
    card: "bg-purple-50 border-purple-200",
    icon: "text-purple-600",
    label: "text-purple-800",
    value: "text-purple-900",
    caption: "text-purple-600",
  },
  orange: {
    card: "bg-orange-50 border-orange-200",
    icon: "text-orange-600",
    label: "text-orange-800",
    value: "text-orange-900",
    caption: "text-orange-600",
  },
};

interface SummaryCardProps {
  color: keyof typeof SUMMARY_CARD_COLORS;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  color,
  icon: Icon,
  label,
  value,
  caption,
}) => {
  const colors = SUMMARY_CARD_COLORS[color];
  return (
    <div className={`rounded-lg p-4 border ${colors.card}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${colors.icon}`} />
        <span className={`text-sm font-medium ${colors.label}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
      <p className={`text-xs mt-1 ${colors.caption}`}>{caption}</p>
    </div>
  );
};
