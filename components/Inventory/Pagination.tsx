import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { ProductsPagination } from "../../services/Inventory/fetchProducts";

interface PaginationProps {
  pagination: ProductsPagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

// Page numbers to show, with "ellipsis" gaps, e.g. 1 … 4 5 6 … 12
const getPageItems = (
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("ellipsis");
    items.push(p);
  });
  return items;
};

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

  if (totalPages <= 1) return null;

  const from = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  const navButtonClass =
    "flex items-center gap-1 px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <span className="text-sm text-slate-500">
        {t("inventory.showingRange")
          .replace("{from}", from.toString())
          .replace("{to}", to.toString())
          .replace("{total}", totalItems.toString())}
      </span>
      <nav className="flex items-center gap-1 flex-wrap" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className={navButtonClass}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.previous")}</span>
        </button>
        {getPageItems(currentPage, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              disabled={disabled || item === currentPage}
              aria-current={item === currentPage ? "page" : undefined}
              className={`min-w-[2.5rem] px-3 py-2 text-sm border rounded-lg transition-colors ${
                item === currentPage
                  ? "bg-blue-600 text-white border-blue-600 cursor-default"
                  : "bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          className={navButtonClass}
        >
          <span className="hidden sm:inline">{t("common.next")}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
