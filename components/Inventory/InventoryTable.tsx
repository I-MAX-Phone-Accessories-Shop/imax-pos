import React from "react";
import { Edit, Eye } from "lucide-react";
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
            <th className="px-4 py-3">Product Code</th>
            <th className="px-4 py-3">{t("inventory.productName")}</th>
            <th className="px-4 py-3">{t("inventory.category")}</th>
            <th className="px-4 py-3 text-right">{t("inventory.cost")}</th>
            <th className="px-4 py-3 text-right">{t("inventory.price")}</th>
            <th className="px-4 py-3 text-center">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{p.productCode}</td>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-slate-500">{p.category}</td>
              <td className="px-4 py-3 text-right text-slate-400">
                {p.costPrice.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-bold text-slate-800">
                {p.sellingPrice.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onViewDetails(p.id)}
                    className="text-blue-600 hover:text-blue-700"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(p)}
                    className="text-primary hover:text-primary-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
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

