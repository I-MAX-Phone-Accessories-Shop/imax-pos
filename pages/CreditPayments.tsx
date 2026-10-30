import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  CreditCard,
  Loader2,
  Receipt,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditRecords,
  CreditRecord,
  CreditRecordPerson,
} from "../services/Reports/fetchCreditRecords";
import {
  CreditReportHeader,
  SummaryCard,
  useCreditReportFilters,
} from "../components/Reports/CreditReportLayout";
import {
  formatCurrency,
  formatDisplayDate,
  getCreditRecordPerson,
  PAYMENT_METHOD_COLORS,
} from "../components/Reports/reportUtils";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const CreditPayments: React.FC = () => {
  const navigate = useNavigate();
  const { date, dateStr, storefront, storefronts, updateParams } =
    useCreditReportFilters();

  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [outstandingByPerson, setOutstandingByPerson] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadRecords = async () => {
      setLoading(true);
      const response = await fetchCreditRecords(
        dateStr,
        dateStr,
        storefront,
        undefined,
        true,
      );
      if (cancelled) return;
      if (response.success) {
        setRecords(response.data);
        setOutstandingByPerson(response.outstandingByPerson || {});
      } else {
        setRecords([]);
        setOutstandingByPerson({});
        toast.error(response.message || "Failed to load credit payments");
      }
      setLoading(false);
    };
    loadRecords();
    return () => {
      cancelled = true;
    };
  }, [dateStr, storefront]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matching = term
      ? records.filter((record) => {
          const person = getCreditRecordPerson(record);
          return [
            person?.name,
            person?.phone,
            record.orderId?.orderNumber,
          ].some((value) => value?.toLowerCase().includes(term));
        })
      : records;
    return [...matching].sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    );
  }, [records, search]);

  const totalCollected = records.reduce(
    (sum, record) => sum + (record.paidAmount || 0),
    0,
  );
  const customerCount = new Set(
    records
      .map((record) => getCreditRecordPerson(record)?._id)
      .filter(Boolean),
  ).size;
  const showStorefrontColumn = storefront === "all";
  const displayDate = formatDisplayDate(date);

  const openCustomer = (person: CreditRecordPerson) => {
    navigate(`/credits/${person._id}`, {
      state: { name: person.name, phone: person.phone, initialTab: "payments" },
    });
  };

  const renderMethodBadge = (method: string) => {
    const color = PAYMENT_METHOD_COLORS[method] || "#64748b";
    return (
      <span
        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap"
        style={{ color, backgroundColor: `${color}1a` }}
      >
        {method ? method.replace(/_/g, " ") : "-"}
      </span>
    );
  };

  const renderRemaining = (person: CreditRecordPerson | null) => {
    if (!person) return <span className="text-slate-400">—</span>;
    const remaining = outstandingByPerson[person._id];
    if (remaining === undefined) return <span className="text-slate-400">—</span>;
    if (remaining > 0) {
      return (
        <span className="font-semibold text-orange-600">
          {formatCurrency(remaining)}
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">
        Fully paid
      </span>
    );
  };

  const thClass = "px-2 sm:px-4 py-3 font-semibold text-slate-600";

  return (
    <div className="p-4 sm:p-6">
      <CreditReportHeader
        title="Credit Payments"
        subtitle="Credit payments collected from customers"
        icon={CreditCard}
        iconClassName="text-green-600"
        dateStr={dateStr}
        date={date}
        storefront={storefront}
        storefronts={storefronts}
        updateParams={updateParams}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          color="green"
          icon={Wallet}
          label="Total Collected"
          value={loading ? "-" : formatCurrency(totalCollected)}
          caption={displayDate}
        />
        <SummaryCard
          color="blue"
          icon={Receipt}
          label="Payments"
          value={loading ? "-" : records.length}
          caption="Payment records"
        />
        <SummaryCard
          color="purple"
          icon={Users}
          label="Customers"
          value={loading ? "-" : customerCount}
          caption="Distinct customers"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
        <span className="text-sm text-slate-500">
          {loading
            ? ""
            : `${filteredRecords.length} payment${
                filteredRecords.length === 1 ? "" : "s"
              }`}
        </span>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or order no."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-slate-500">Loading credit payments...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No credit payments on {displayDate}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No payments match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thClass}>Time</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Order no.</th>
                  {showStorefrontColumn && (
                    <th className={thClass}>Storefront</th>
                  )}
                  <th className={thClass}>Method</th>
                  <th className={`${thClass} text-right`}>Amount paid</th>
                  <th className={`${thClass} text-right`}>
                    Remaining (as of today)
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.map((record) => {
                  const person = getCreditRecordPerson(record);
                  return (
                    <tr
                      key={record._id}
                      onClick={person ? () => openCustomer(person) : undefined}
                      onKeyDown={
                        person
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openCustomer(person);
                              }
                            }
                          : undefined
                      }
                      tabIndex={person ? 0 : undefined}
                      role={person ? "link" : undefined}
                      className={
                        person
                          ? "hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                          : ""
                      }
                    >
                      <td
                        className="px-2 sm:px-4 py-3 text-slate-600 whitespace-nowrap"
                        title={formatDateTime(record.paymentDate)}
                      >
                        {formatTime(record.paymentDate)}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                              person
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {person?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            {person ? (
                              <>
                                <p className="font-medium text-slate-800 truncate">
                                  {person.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {person.phone || "-"}
                                </p>
                              </>
                            ) : (
                              <p className="font-medium text-slate-400 italic">
                                No customer assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 max-w-xs">
                        <p className="font-medium text-slate-800 whitespace-nowrap">
                          {record.orderId?.orderNumber || "-"}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {record.notes}
                          </p>
                        )}
                      </td>
                      {showStorefrontColumn && (
                        <td className="px-2 sm:px-4 py-3 text-slate-600">
                          {record.orderId?.storefrontId?.locationName || "-"}
                        </td>
                      )}
                      <td className="px-2 sm:px-4 py-3">
                        {renderMethodBadge(record.paymentMethod)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-bold text-green-700 whitespace-nowrap">
                        {formatCurrency(record.paidAmount || 0)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right whitespace-nowrap">
                        {renderRemaining(person)}
                      </td>
                      <td className="pr-2 sm:pr-4 py-3">
                        {person && (
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
