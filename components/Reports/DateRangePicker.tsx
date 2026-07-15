import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X, Lock } from "lucide-react";
import { Calendar, DateRange, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  fixedStartDate?: boolean;
  singleDate?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  fixedStartDate = false,
  singleDate = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
    key: string;
  }>({
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    key: "selection",
  });

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (startDate && endDate) {
      setDateRange({
        startDate,
        endDate,
        key: "selection",
      });
    } else if (startDate && singleDate) {
      setDateRange({
        startDate,
        endDate: startDate,
        key: "selection",
      });
    }
  }, [startDate, endDate, singleDate]);

  const handleRangeSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    if (selection.startDate && selection.endDate) {
      setDateRange({
        startDate: selection.startDate,
        endDate: selection.endDate,
        key: "selection",
      });
    }
  };

  const handleFixedStartSelect = (date: Date) => {
    if (startDate) {
      setDateRange({
        startDate: startDate,
        endDate: date,
        key: "selection",
      });
    }
  };

  const handleSingleDateSelect = (date: Date) => {
    setDateRange({
      startDate: date,
      endDate: date,
      key: "selection",
    });
  };

  const handleApply = () => {
    onChange(dateRange.startDate, dateRange.endDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    const today = new Date();
    if (fixedStartDate) {
      onChange(startDate, today);
    } else if (singleDate) {
      onChange(today, today);
    } else {
      onChange(null, null);
    }
    setDateRange({
      startDate: startDate || today,
      endDate: today,
      key: "selection",
    });
    setIsOpen(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-primary outline-none"
      >
        <CalendarIcon className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-700">
          {singleDate
            ? (startDate ? formatDate(startDate) : "Select date")
            : (startDate && endDate
              ? `${formatDate(startDate)} - ${formatDate(endDate)}`
              : "Select date range")
          }
        </span>
        {fixedStartDate && startDate && !singleDate && (
          <span title="Start date is fixed">
            <Lock className="w-3 h-3 text-slate-400" />
          </span>
        )}
        {(startDate || endDate) && !fixedStartDate && (
          <X
            className="w-4 h-4 text-slate-400 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {isOpen && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            className={
              isMobile
                ? "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
                : "absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 p-4"
            }
          >
            {isMobile && (
              <div className="p-4 border-b flex justify-between items-center shrink-0">
                <h3 className="font-semibold text-lg">
                  Select {singleDate ? "Date" : "Date Range"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            )}

            <div className={`${isMobile ? "overflow-y-auto flex-1 p-2" : ""}`}>
              {singleDate ? (
                <Calendar
                  date={dateRange.startDate}
                  onChange={handleSingleDateSelect}
                  color="#3b82f6"
                />
              ) : fixedStartDate ? (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-slate-500 mb-2">
                    Start Date (Fixed): <span className="font-medium text-slate-700">{formatDate(startDate)}</span>
                    <div className="mt-1">Select End Date:</div>
                  </div>
                  <Calendar
                    date={dateRange.endDate}
                    onChange={handleFixedStartSelect}
                    color="#3b82f6"
                    minDate={startDate || undefined}
                  />
                </div>
              ) : (
                <DateRange
                  ranges={[dateRange]}
                  onChange={handleRangeSelect}
                  moveRangeOnFirstSelection={false}
                  months={isMobile ? 1 : 2}
                  direction={isMobile ? "vertical" : "horizontal"}
                  rangeColors={["#3b82f6"]}
                />
              )}
            </div>

            <div
              className={
                isMobile
                  ? "p-4 border-t bg-slate-50 flex gap-2 shrink-0"
                  : "flex justify-end gap-2 mt-4 pt-4 border-t"
              }
            >
              {isMobile && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${isMobile ? "flex-1" : ""} px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className={`${isMobile ? "flex-1" : ""} px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium`}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
