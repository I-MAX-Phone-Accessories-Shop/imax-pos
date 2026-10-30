import React from "react";
import { ProductsPagination } from "../../services/Inventory/fetchProducts";
import { useLanguage } from "../../context/LanguageContext";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  pagination: ProductsPagination | null;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  pagination,
}) => {
  const { t } = useLanguage();

  const from =
    pagination && pagination.totalItems > 0
      ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1
      : 0;
  const to = pagination
    ? Math.min(
        pagination.currentPage * pagination.itemsPerPage,
        pagination.totalItems,
      )
    : 0;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <label className="text-sm font-medium text-slate-700">
        {t("inventory.filterByCategory")}:
      </label>
      <select
        className="border rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="All">{t("inventory.allCategories")}</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      {pagination && (
        <span className="text-sm text-slate-500">
          {t("inventory.showingRange")
            .replace("{from}", from.toString())
            .replace("{to}", to.toString())
            .replace("{total}", pagination.totalItems.toString())}
        </span>
      )}
    </div>
  );
};

