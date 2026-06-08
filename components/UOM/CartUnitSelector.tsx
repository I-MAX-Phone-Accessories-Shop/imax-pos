import React, { useEffect } from "react";
import { UomConversion } from "../../types/uom";
import { getUnitOptions, getAvailableQuantityInUnit } from "../../utils/uom";

interface CartUnitSelectorProps {
  baseUnit: string;
  conversions?: UomConversion[];
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
  className?: string;
  disabled?: boolean;
  availableQuantity?: number;
  quantityByUnit?: Record<string, number>;
}

export const CartUnitSelector: React.FC<CartUnitSelectorProps> = ({
  baseUnit,
  conversions,
  selectedUnit,
  onUnitChange,
  className = "",
  disabled = false,
  availableQuantity,
  quantityByUnit,
}) => {
  const options = getUnitOptions(baseUnit, conversions);
  if (options.length <= 1) return null;

  const hasStockInfo = availableQuantity !== undefined;

  const optionAvailability = options.map((opt) => {
    if (!hasStockInfo) return { ...opt, outOfStock: false };
    const qty = getAvailableQuantityInUnit(
      baseUnit,
      opt.value,
      conversions,
      availableQuantity,
      quantityByUnit,
    );
    return { ...opt, outOfStock: qty < 1 };
  });

  const selectedUnavailable =
    hasStockInfo &&
    optionAvailability.find((o) => o.value === selectedUnit)?.outOfStock;

  useEffect(() => {
    if (selectedUnavailable) {
      const fallback = optionAvailability.find((o) => !o.outOfStock);
      if (fallback) onUnitChange(fallback.value);
    }
  }, [selectedUnavailable]);

  return (
    <select
      disabled={disabled}
      className={`text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-primary outline-none disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
      value={selectedUnit}
      onChange={(e) => onUnitChange(e.target.value)}
    >
      {optionAvailability.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.outOfStock}>
          {opt.label}
          {opt.outOfStock ? " (Out of stock)" : ""}
        </option>
      ))}
    </select>
  );
};
