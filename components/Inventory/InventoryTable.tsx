import React from "react";
import { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onViewDetails: (productId: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onViewDetails,
}) => {
  const { t } = useLanguage();

  if (products.length === 0) {
    return (
      <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
        <p className="text-slate-500">{t("inventory.noProductsFound")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 border-b">
          <tr>
            <th className="px-4 py-3 text-center">{t("inventory.no")}</th>
            <th className="px-4 py-3">{t("inventory.productCode")}</th>
            <th className="px-4 py-3">{t("inventory.productName")}</th>
            <th className="px-4 py-3">{t("inventory.category")}</th>
            <th className="px-4 py-3 text-right">{t("inventory.cost")}</th>
            <th className="px-4 py-3 text-right">{t("inventory.price")}</th>
            <th className="px-4 py-3 text-center">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((p, index) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-center text-slate-600">
                {String(index + 1).padStart(2, "0")}
              </td>
              <td className="px-4 py-3 font-medium">{p.productCode}</td>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-slate-500">{p.category}</td>
              <td className="px-4 py-3 text-right text-slate-400">
                {p.costPrice.toLocaleString()} MMK
              </td>
              <td className="px-4 py-3 text-right font-bold text-slate-800">
                {p.sellingPrice.toLocaleString()} MMK
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onViewDetails(p.id)}
                    className="px-3 py-1.5 text-xs rounded-2xl border border-[#000] hover:bg-gray-200 transition-colors"
                  >
                    {t("inventory.checkItem")}
                  </button>
                  <button
                    onClick={() => onEdit(p)}
                    className="px-3 py-1.5 text-xs rounded-2xl border border-[#000] hover:bg-gray-200 transition-colors"
                  >
                    {t("inventory.editItem")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
