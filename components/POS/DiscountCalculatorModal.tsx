import React from "react";
import { X, Calculator } from "lucide-react";

interface DiscountCalculatorModalProps {
  show: boolean;
  onClose: () => void;
  subtotal: number;
  discountAmount: string;
  onDiscountAmountChange: (v: string) => void;
  onApply: () => void;
}

export const DiscountCalculatorModal: React.FC<DiscountCalculatorModalProps> = ({
  show, onClose, subtotal, discountAmount, onDiscountAmountChange, onApply,
}) => {
  if (!show) return null;

  const numAmount = Number(discountAmount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Discount Calculator
          </h2>
          <button onClick={() => { onClose(); onDiscountAmountChange(""); }} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-500 mb-1">Current Subtotal</p>
            <p className="text-2xl font-bold text-slate-800">{subtotal.toLocaleString()} MMK</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Amount (MMK)</label>
            <input type="number" min="0" max={subtotal}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Enter discount amount..."
              value={discountAmount} onChange={(e) => onDiscountAmountChange(e.target.value)}
            />
          </div>
          {numAmount > 0 && (
            <div className="bg-[#E8F5E9] border border-[#A5D6A7] p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Discount Amount:</span>
                <span className="font-bold text-green-700">{numAmount.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Percentage:</span>
                <span className="font-bold text-green-700">{((numAmount / subtotal) * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Final Total:</span>
                <span className="font-bold text-slate-800">{(subtotal - numAmount).toLocaleString()} MMK</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => { onClose(); onDiscountAmountChange(""); }} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={onApply}
              disabled={!discountAmount || numAmount <= 0 || numAmount > subtotal}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >Apply Discount</button>
          </div>
        </div>
      </div>
    </div>
  );
};
