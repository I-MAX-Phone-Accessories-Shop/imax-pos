import React from "react";
import { UomConversion } from "../../types/uom";
import {
  formatMixedQuantities,
  getUnitOptions,
  mixedQuantitiesToBaseQuantity,
} from "../../utils/uom";

interface MixedUnitInputProps {
  baseUnit: string;
  conversions?: UomConversion[];
  value: Record<string, number>;
  onChange: (mixed: Record<string, number>) => void;
  maxBaseQuantity?: number;
  onExceedStock?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MixedUnitInput: React.FC<MixedUnitInputProps> = ({
  baseUnit,
  conversions,
  value,
  onChange,
  maxBaseQuantity,
  onExceedStock,
  className = "",
  disabled = false,
}) => {
  const options = getUnitOptions(baseUnit, conversions);
  const baseTotal = mixedQuantitiesToBaseQuantity(baseUnit, conversions, value);
  const summary = formatMixedQuantities(value);

  const updateUnit = (unit: string, raw: string) => {
    const parsed = raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0);
    const next = { ...value, [unit]: parsed };
    const nextBase = mixedQuantitiesToBaseQuantity(
      baseUnit,
      conversions,
      next,
    );
    if (
      maxBaseQuantity != null &&
      nextBase > maxBaseQuantity &&
      parsed > (value[unit] ?? 0)
    ) {
      onExceedStock?.();
      return;
    }
    onChange(next);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex flex-col gap-0.5 text-xs text-gray-600"
          >
            <span className="font-medium truncate">{opt.label}</span>
            <input
              type="number"
              min={0}
              step={1}
              disabled={disabled}
              value={value[opt.value] ?? 0}
              onChange={(e) => updateUnit(opt.value, e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:bg-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
        ))}
      </div>
      {summary && (
        <p className="text-xs text-gray-500">
          {summary}
          {baseTotal > 0 && (
            <span className="text-gray-400">
              {" "}
              · {baseTotal.toLocaleString()} {baseUnit}
            </span>
          )}
        </p>
      )}
    </div>
  );
};
