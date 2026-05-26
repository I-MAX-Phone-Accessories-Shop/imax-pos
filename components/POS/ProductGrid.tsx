import React from "react";
import { Search, Scan, Store, ChevronDown, RefreshCw } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { StorefrontStockItem } from "../../services/Storefront/fetchStorefrontStock";
import type { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";

interface ProductGridProps {
  search: string;
  onSearchChange: (value: string) => void;
  onBarcodeScan: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  storefronts: StorefrontProfile[];
  selectedStorefrontId: string;
  showStorefrontMenu: boolean;
  onToggleStorefrontMenu: () => void;
  loading: boolean;
  filteredProducts: StorefrontStockItem[];
  onAddToCart: (item: StorefrontStockItem) => void;
  onRefresh: () => void;
  onStorefrontChange: (id: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  search, onSearchChange, onBarcodeScan,
  selectedCategory, onCategoryChange, categories,
  currentPage, totalPages, totalItems, onPageChange,
  storefronts, selectedStorefrontId, showStorefrontMenu,
  onToggleStorefrontMenu, loading, filteredProducts,
  onAddToCart, onRefresh, onStorefrontChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
            <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
            <input
              type="text"
              placeholder={t("pos.searchOrScanBarcode") || "Search products or scan barcode..."}
              className="search-input w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
              value={search}
              onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  onBarcodeScan(search);
                }
              }}
              autoFocus
            />
          </div>

          <select
            className="border border-dark-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="All">{t("pos.allCategories")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <button
              onClick={onToggleStorefrontMenu}
              className="flex items-center gap-2 px-3 py-2.5 bg-[#1E2937] text-white rounded-xl hover:bg-[#334155] transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium max-w-[120px] truncate">
                {storefronts.find((sf) => sf._id === selectedStorefrontId)?.locationName || "Store"}
              </span>
              <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-200 ${showStorefrontMenu ? "rotate-180" : ""}`} />
            </button>

            {showStorefrontMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={onToggleStorefrontMenu} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-dark-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-dark-50 border-b border-dark-200">
                    <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider">{t("pos.selectStorefront")}</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {storefronts.map((sf) => (
                      <button
                        key={sf._id}
                        onClick={() => { onStorefrontChange(sf._id); onToggleStorefrontMenu(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${sf._id === selectedStorefrontId ? "bg-primary/20 border-l-4 border-primary" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sf._id === selectedStorefrontId ? "bg-primary text-white" : "bg-dark-100 text-dark-500"}`}>
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark-800 truncate">{sf.locationName}</p>
                          <p className="text-xs text-dark-400">{sf.locationCode}</p>
                        </div>
                        {sf._id === selectedStorefrontId && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-dark-200 bg-dark-50">
                    <button onClick={() => { onRefresh(); onToggleStorefrontMenu(); }} disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      {t("pos.refreshProducts")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        {t("pos.showingProducts").replace("{count}", filteredProducts.length.toString())}
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="text-sm text-gray-600">
            {((currentPage - 1) * 100 + 1)} to {Math.min(currentPage * 100, totalItems)} of {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="First Page"
            ><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >{t("common.previous") || "Prev"}</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pn = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <button key={pn} onClick={() => onPageChange(pn)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-sm ${currentPage === pn ? "bg-primary text-white border-primary" : "hover:bg-gray-50 border-gray-200"}`}
                >{pn}</button>
              );
            })}
            <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >{t("common.next") || "Next"}</button>
            <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Last Page"
            ><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>
        </div>
      )}

      <div className="flex overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-20">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            {selectedStorefrontId ? t("pos.noProductsInStorefront") : t("pos.pleaseSelectStorefront")}
          </div>
        ) : (
          filteredProducts.map((item) => (
            <div key={item._id} onClick={() => onAddToCart(item)}
              className={`bg-white p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col ${item.availableQuantity === 0 ? "opacity-50 grayscale pointer-events-none" : ""}`}
            >
              <div>
                <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{item.inventoryId.productName}</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">{item.inventoryId.productCode}</p>
                <p className="text-xs text-gray-500 mt-1">{item.inventoryId.category}</p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="font-bold text-[#212529]">{item.inventoryId.sellingPrice.toLocaleString()} MMK</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
