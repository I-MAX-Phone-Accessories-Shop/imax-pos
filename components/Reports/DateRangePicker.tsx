import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    endDate || new Date()
  );

  const pickerRef = useRef<HTMLDivElement>(null);

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
    if (endDate) {
      setSelectedDate(endDate);
    }
  }, [endDate]);

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleApply = () => {
    onChange(startDate, selectedDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    // Keep start date, clear end date (or set to today)
    // The requirement says "user can chose only end date". Start date is fixed.
    // Maybe resetting end date to today is safer than null if backend expects dates.
    const today = new Date();
    setSelectedDate(today);
    onChange(startDate, today);
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
          {endDate
            ? `End Date: ${formatDate(endDate)}`
            : "Select End Date"}
        </span>
        {endDate && (
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
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 p-4">
          <Calendar
            date={selectedDate}
            onChange={handleSelect}
            color="#3b82f6"
          />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

