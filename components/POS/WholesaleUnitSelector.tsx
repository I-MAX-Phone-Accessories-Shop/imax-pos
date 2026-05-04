import React from "react";
import { X, Package } from "lucide-react";
import { WholesaleUnit } from "../../services/Storefront/fetchStorefrontStock";

interface WholesaleUnitSelectorProps {
  isOpen: boolean;
  wholesaleUnits: WholesaleUnit[];
  onClose: () => void;
  onSelectUnit: (unit: WholesaleUnit) => void;
}

export const WholesaleUnitSelector: React.FC<WholesaleUnitSelectorProps> = ({
  isOpen,
  wholesaleUnits,
  onClose,
  onSelectUnit,
}) => {
  if (!isOpen) return null;

  const activeUnits = wholesaleUnits.filter(unit => unit.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Select Wholesale Unit
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeUnits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No active wholesale units available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeUnits.map((unit, index) => (
                <div
                  key={index}
                  onClick={() => onSelectUnit(unit)}
                  className="bg-purple-50 border border-purple-200 rounded-lg p-4 cursor-pointer hover:bg-purple-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-purple-800 text-lg">
                        {unit.unitName}
                      </h4>
                      <p className="text-sm text-purple-600">
                        1 {unit.unitName} = {unit.conversionRate} pieces
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-purple-600 font-medium">
                        Buying Price
                      </p>
                      <p className="font-bold text-purple-800">
                        {unit.buyingPrice.toLocaleString()} MMK
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-medium">
                        Selling Price
                      </p>
                      <p className="font-bold text-purple-800">
                        {unit.sellingPrice.toLocaleString()} MMK
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-600">
                        Profit per {unit.unitName}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {(unit.sellingPrice - unit.buyingPrice).toLocaleString()} MMK
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => onSelectUnit(null as any)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg p-4 transition-colors font-medium"
              >
                Sell by Individual Pieces
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
