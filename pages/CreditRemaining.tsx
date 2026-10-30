import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditRemaining,
  CreditRemainingResponse,
  CreditRemainingCustomer,
} from "../services/Reports/fetchCreditRemaining";
import {
  CreditReportHeader,
  SummaryCard,
  useCreditReportFilters,
} from "../components/Reports/CreditReportLayout";
import {
  formatCurrency,
  formatDisplayDate,
} from "../components/Reports/reportUtils";

// Same fixed start date the Credit Remaining card on Reports uses
const CREDIT_REMAINING_START_DATE = "2025-12-01";

const DAY_MS = 24 * 60 * 60 * 1000;

export const CreditRemaining: React.FC = () => {
  const navigate = useNavigate();
  const { date, dateStr, storefront, storefronts, updateParams } =
    useCreditReportFilters();

  const [report, setReport] = useState<CreditRemainingResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      setLoading(true);
      const response = await fetchCreditRemaining(
        CREDIT_REMAINING_START_DATE,
        dateStr,
        storefront,
      );
      if (cancelled) return;
      if (response.success) {
        setReport(response.data);
      } else {
        setReport(null);
        toast.error(response.message || "Failed to load credit remaining");
      }
      setLoading(false);
    };
    loadReport();
    return () => {
      cancelled = true;
    };
  }, [dateStr, storefront]);

  const customers = report?.customers || [];

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.creditPerson?.name, customer.creditPerson?.phone].some(
        (value) => value?.toLowerCase().includes(term),
      ),
    );
  }, [customers, search]);

  const displayDate = formatDisplayDate(date);

  // Days owing, counted up to the chosen date
  const getDaysOwing = (value: string) => {
    const endOfChosenDay = new Date(date);
    endOfChosenDay.setHours(23, 59, 59, 999);
    return Math.max(
      0,
      Math.floor((endOfChosenDay.getTime() - new Date(value).getTime()) / DAY_MS),
    );
  };

  const openCustomer = (customer: CreditRemainingCustomer) => {
    const person = customer.creditPerson;
    if (person) {
      navigate(`/credits/${person._id}`, {
        state: { name: person.name, phone: person.phone, initialTab: "orders" },
      });
    } else {
      navigate("/credit-orders");
    }
  };

  const thClass = "px-2 sm:px-4 py-3 font-semibold text-slate-600";

  return (
    <div className="p-4 sm:p-6">
      <CreditReportHeader
        title="Credit Remaining"
        subtitle={`Outstanding credit by customer as of ${displayDate}`}
        icon={Wallet}
        iconClassName="text-orange-600"
        dateStr={dateStr}
        date={date}
        storefront={storefront}
        storefronts={storefronts}
        updateParams={updateParams}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          color="orange"
          icon={Wallet}
          label="Total Remaining"
          value={
            loading || !report
              ? "-"
              : formatCurrency(report.totals.totalRemaining)
          }
          caption={`As of ${displayDate}`}
        />
        <SummaryCard
          color="blue"
          icon={Users}
          label="Customers owing"
          value={loading || !report ? "-" : report.totals.customerCount}
          caption="With outstanding credit"
        />
        <SummaryCard
          color="purple"
          icon={FileText}
          label="Unpaid orders"
          value={loading || !report ? "-" : report.totals.unpaidOrderCount}
          caption="Credit orders not fully paid"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
        <span className="text-sm text-slate-500">
          {loading
            ? ""
            : `${filteredCustomers.length} customer${
                filteredCustomers.length === 1 ? "" : "s"
              }`}
        </span>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-slate-500">Loading credit remaining...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No outstanding credit as of {displayDate}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No customers match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={`${thClass} w-12`}>#</th>
                  <th className={thClass}>Customer</th>
                  <th className={`${thClass} text-right`}>Unpaid orders</th>
                  <th className={`${thClass} text-right`}>Total credit</th>
                  <th className={`${thClass} text-right`}>Paid</th>
                  <th className={`${thClass} text-right`}>Remaining</th>
                  <th className={thClass}>Owing since</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map((customer, index) => {
                  const person = customer.creditPerson;
                  const days = customer.oldestUnpaidOrderDate
                    ? getDaysOwing(customer.oldestUnpaidOrderDate)
                    : null;
                  return (
                    <tr
                      key={person?._id || "none"}
                      onClick={() => openCustomer(customer)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openCustomer(customer);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      className="hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                    >
                      <td className="px-2 sm:px-4 py-3 text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                              person
                                ? "bg-orange-100 text-orange-700"
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
                      <td className="px-2 sm:px-4 py-3 text-right text-slate-600">
                        {customer.unpaidOrderCount}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(customer.totalCredit)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(customer.totalPaid)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-bold text-orange-600 whitespace-nowrap">
                        {formatCurrency(customer.remaining)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                        {customer.oldestUnpaidOrderDate ? (
                          <>
                            <p className="text-slate-700">
                              {formatDisplayDate(
                                new Date(customer.oldestUnpaidOrderDate),
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {days} day{days === 1 ? "" : "s"}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="pr-2 sm:pr-4 py-3">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
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
