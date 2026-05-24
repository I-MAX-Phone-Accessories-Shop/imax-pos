import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Store,
  ChevronDown,
  Loader2,
  Scan,
  X,
  User,
  Calculator,
  Calendar,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getSavedPrintPaperSize } from "../utils/printPaperSize";
import { detectDevice } from "../utils/deviceDetect";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import { createDirectSale } from "../services/Order/createDirectSale";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { deviceDetect } from "react-device-detect";
import { CartUnitSelector } from "../components/UOM/CartUnitSelector";
import {
  UomCartItem,
  cartLineToOrderProduct,
  cartLineSubtotal,
  createCartLine,
  getCartLineId,
  getCartLineUnitPrice,
  getInventoryUomFromStock,
} from "../utils/posCartUom";

// Payment methods
enum PaymentMethod {
  CASH = "Cash",
  KBZ_PAY = "KBZPay",
  WAVE_PAY = "WavePay",
  AYA_PAY = "AYA Pay",
  UAB_PAY = "UAB Pay",
  MMQR = "MMQR",
  BANK_TRANSFER = "Bank Transfer",
  NORMAL = "Normal",
  HOT = "Hot",
  FOC = "FOC",
}

type CartItem = UomCartItem;

export const DirectSale: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Data State
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Default to 100 for POS grid

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [markupAmount, setMarkupAmount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStorefrontMenu, setShowStorefrontMenu] = useState(false);
  const [useMarkup, setUseMarkup] = useState(false); // Toggle between discount and markup
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentType === "credit" ? PaymentMethod.NORMAL : PaymentMethod.CASH,
  );
  const [showDiscountCalculator, setShowDiscountCalculator] = useState(false);
  const [showMarkupCalculator, setShowMarkupCalculator] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [createdAt, setCreatedAt] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const devices = detectDevice();

  // Load storefronts and stock on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load storefronts
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        const activeStorefronts = sfResponse.data.filter(
          (sf) => sf.status === "active",
        );
        setStorefronts(activeStorefronts);

        // Auto-select first storefront
        if (activeStorefronts.length > 0) {
          setSelectedStorefrontId(activeStorefronts[0]._id);
        }
      }

      // Load categories
      const catResponse = await fetchCategories();
      if (catResponse.success && catResponse.data) {
        setCategories(catResponse.data);
      }

      // Load stock items
      await loadStockItems();
    } catch (error) {
      // console.error("Error loading initial data:", error);
      toast.error(t("directSale.failedToProcessSale"));
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }

    // Load credit personas separately
    loadCreditPersonas();
  };

  const loadCreditPersonas = async () => {
    try {
      const cpResponse = await fetchCreditPersonas();
      // console.log("Credit personas response:", cpResponse);
      if (cpResponse.success && cpResponse.data) {
        const activePersonas = cpResponse.data.filter((p) => !p.blacklist);
        // console.log("Active credit personas:", activePersonas);
        setCreditPersonas(activePersonas);
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
    }
  };

  useEffect(() => {
    loadStockItems();
  }, [selectedStorefrontId, search, selectedCategory, currentPage]);

  const loadStockItems = async () => {
    try {
      const response = await fetchStorefrontStock(
        selectedStorefrontId,
        currentPage,
        itemsPerPage,
        selectedCategory === "All" ? undefined : selectedCategory,
        search,
      );
      // console.log("response", response);
      if (response.success && response.data) {
        setAllStockItems(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error("Error loading stock items:", error);
      toast.error(t("pos.failedToLoadProducts"));
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadStockItems();
    setLoading(false);
    toast.success(t("pos.productsRefreshed"));
  };

  // Filter products by selected storefront (search and category handled by API)
  const filteredProducts = allStockItems.filter((item) => {
    const hideProduct = item.inventoryId?._id === "69a15d55218ec5ff9a3fe4a3";
    return !hideProduct;
  });

  // Get unique categories from current storefront products
  // (Categories are now fetched from API and stored in categories state)

  const addToCart = (stockItem: StorefrontStockItem) => {
    const newLine = createCartLine(stockItem, 1);
    const lineId = getCartLineId(newLine);

    setCart((prev) => {
      const existing = prev.find((item) => getCartLineId(item) === lineId);
      if (existing) {
        return prev.map((item) =>
          getCartLineId(item) === lineId
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prev, newLine];
    });
  };

  const updateQty = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getCartLineId(item) === lineId) {
          const newQty = item.qty + delta;
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const setQty = (lineId: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getCartLineId(item) === lineId) {
          if (newQty < 1) {
            return { ...item, qty: 1 };
          }
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const setCartLineUnit = (lineId: string, unit: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getCartLineId(item) !== lineId) return item;
        return { ...item, selectedUnit: unit };
      }),
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => getCartLineId(item) !== lineId));
  };

  // Handle barcode scanning from search input
  const handleBarcodeScan = async (searchValue: string) => {
    if (!searchValue.trim()) return;

    try {
      // Use API to find the exact product by barcode/code
      const response = await fetchStorefrontStock(
        selectedStorefrontId,
        1,
        1, // We only need the first matching item
        undefined,
        searchValue.trim(),
      );

      if (response.success && response.data && response.data.length > 0) {
        const matchingProduct = response.data[0];

        addToCart(matchingProduct);

        // Show success feedback
        toast.success(
          `${matchingProduct.inventoryId.productName} ${
            t("pos.addedToCart") || "added to cart"
          }`,
        );

        // Clear search input after successful scan
        setSearch("");
      } else {
        // If no exact match found via API, we just keep the search term as is
        // so the user can see if there are partial matches in the grid
        toast.error(t("pos.productNotFound") || "Product not found");
      }
    } catch (error) {
      console.error("Error during barcode scan:", error);
      toast.error(t("pos.failedToSearchProduct") || "Failed to search product");
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + cartLineSubtotal(item), 0);

  const totalAfterDiscount = Math.round(
    subtotal * (1 - (Number(discount) || 0) / 100),
  );
  const totalAfterMarkup = subtotal + markupAmount;

  const total = useMarkup ? totalAfterMarkup : totalAfterDiscount;
  const combinedDiscountAmount = useMarkup
    ? 0
    : Math.round(subtotal - totalAfterDiscount);

  // Auto-update paid amount when discount or subtotal changes in checkout modal
  useEffect(() => {
    if (
      showCheckoutModal &&
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC
    ) {
      // Update paid amount to match new total when discount or subtotal changes
      // Use Math.ceil to ensure it's always an integer
      // Skip for FOC as paid amount should be 0
      setPaidAmount(Math.ceil(total));
    }
  }, [showCheckoutModal, total, paymentType, paymentMethod]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Only validate paid amount for "paid" payment type, not for "credit" or "FOC"
    if (
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC &&
      paidAmount < total
    ) {
      toast.error(t("pos.paidAmountError"));
      return;
    }

    // For FOC, set paid amount to 0
    const finalPaidAmount =
      paymentMethod === PaymentMethod.FOC ? 0 : paidAmount;

    setIsProcessing(true);

    try {
      // Map payment method to API format
      const paymentMethodMap: Record<PaymentMethod, string> = {
        [PaymentMethod.CASH]: "cash",
        [PaymentMethod.KBZ_PAY]: "kpay",
        [PaymentMethod.WAVE_PAY]: "wavepay",
        [PaymentMethod.AYA_PAY]: "ayapay",
        [PaymentMethod.UAB_PAY]: "uabpay",
        [PaymentMethod.BANK_TRANSFER]: "bank_transfer",
        [PaymentMethod.NORMAL]: "normal",
        [PaymentMethod.HOT]: "hot",
        [PaymentMethod.FOC]: "foc",
        [PaymentMethod.MMQR]: "MMQR",
      };

      const discountAmount = useMarkup
        ? 0
        : Math.round(subtotal - totalAfterDiscount);

      const extraChange =
        paymentType === "paid" && finalPaidAmount > total
          ? finalPaidAmount - total
          : 0;

      const orderPayload = {
        saleType: "direct-sale" as const,
        ordersProducts: cart.map(cartLineToOrderProduct),
        subTotal: subtotal,
        tax: 0,
        discount: discountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        extraChange,
        paymentType: paymentType,
        paymentMethod: paymentMethodMap[paymentMethod],
      };

      const result = await createDirectSale(orderPayload);

      if (result.success) {
        const selectedStorefront = storefronts.find(
          (sf) => sf._id === selectedStorefrontId,
        );

        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: result.data?.orderNumber || `INV-${Date.now()}`,
          storefrontName: "HONGCHI Myanmar",
          items: cart.map((i) => ({
            name: i.stockItem.inventoryId.productName,
            code: i.stockItem.inventoryId.productCode,
            qty: i.qty,
            unit: i.selectedUnit,
            price: getCartLineUnitPrice(i),
          })),
          subtotal,
          discountPercent: discount,
          total,
          paidAmount: finalPaidAmount,
          change: finalPaidAmount - total,
          paymentMethod,
          note,
        };
        // Save receipt data and redirect to receipt page
        const receiptId = `receipt_${receiptData.invoiceNumber}`;
        localStorage.setItem(receiptId, JSON.stringify(receiptData));

        // Device detection for print method selection
        const device = detectDevice();
        // console.log("Device:", device);

        // Navigate to professional A4 receipt page
        navigate(
          `/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}&autoprint=1`,
        );
        setCart([]);
        setDiscount(0);
        setMarkup(0);
        setMarkupAmount(0);
        setNote("");
        setPaidAmount(0);
        setPaymentMethod(
          paymentType === "credit" ? PaymentMethod.NORMAL : PaymentMethod.CASH,
        );
        setPaymentType("paid");
        setSelectedCreditPersonId("");
        setCreatedAt(new Date().toISOString().split("T")[0]);

        // Show success modal instead of toast
        setSuccessOrderNumber(result.data?.orderNumber || `INV-${Date.now()}`);
        setShowSuccessModal(true);

        // Refresh stock after sale
        await loadStockItems();
      } else {
        toast.error(result.message || t("directSale.failedToProcessSale"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("directSale.failedToProcessSale"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle storefront change
  const handleStorefrontChange = (storefrontId: string) => {
    setSelectedStorefrontId(storefrontId);
    setCart([]); // Clear cart when switching storefronts
    setSelectedCategory("All");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-dark-600">{t("directSale.loading")}</p>
        </div>
      </div>
    );
  }

  if (storefronts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Store className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-dark-600">
            You are not assigned to any storefront. Please contact the
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-gray-100">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
        {/* Search Bar with Storefront Badge */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            {/* Combined Search/Barcode Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
              <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
              <input
                type="text"
                placeholder={
                  t("pos.searchOrScanBarcode") ||
                  "Search products or scan barcode..."
                }
                className="search-input w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  // When Enter is pressed, try to scan barcode first
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleBarcodeScan(search);
                    // If barcode was found and added, search is already cleared
                    // If not found, continue with regular search (filtering happens automatically)
                  }
                }}
                onBlur={() => {
                  // Auto-process barcode when input loses focus (useful for barcode scanners that auto-tab)
                  // Only if search value exists and looks like it could be a barcode (length >= 3)
                  // This helps with barcode scanners that send data on blur
                  if (search.trim() && search.trim().length >= 3) {
                    handleBarcodeScan(search);
                  }
                }}
                autoFocus
              />
            </div>

            {/* Category Selector */}
            <select
              className="border border-dark-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">{t("pos.allCategories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Storefront Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowStorefrontMenu(!showStorefrontMenu)}
                className="flex items-center gap-2 px-3 py-2.5 bg-dark text-white rounded-xl hover:bg-dark-800 transition-all shadow-sm"
              >
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {storefronts.find((sf) => sf._id === selectedStorefrontId)
                    ?.locationName || "Store"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-primary transition-transform duration-200 ${
                    showStorefrontMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showStorefrontMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStorefrontMenu(false)}
                  />
                  {/* Menu */}
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-dark-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-dark-50 border-b border-dark-200">
                      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                        {t("pos.selectStorefront")}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {storefronts.map((sf) => (
                        <button
                          key={sf._id}
                          onClick={() => {
                            handleStorefrontChange(sf._id);
                            setShowStorefrontMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${
                            sf._id === selectedStorefrontId
                              ? "bg-primary/20 border-l-4 border-primary"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              sf._id === selectedStorefrontId
                                ? "bg-primary text-white"
                                : "bg-dark-100 text-dark-500"
                            }`}
                          >
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-dark-800 truncate">
                              {sf.locationName}
                            </p>
                            <p className="text-xs text-dark-400">
                              {sf.locationCode}
                            </p>
                          </div>
                          {sf._id === selectedStorefrontId && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-dark-200 bg-dark-50">
                      <button
                        onClick={() => {
                          handleRefresh();
                          setShowStorefrontMenu(false);
                        }}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        {t("pos.refreshProducts")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Count */}
        <div className="mb-2 text-sm text-gray-600">
          {t("pos.showingProducts").replace(
            "{count}",
            filteredProducts.length.toString(),
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="text-sm text-gray-600">
              {t("pos.showingProducts").replace(
                "{count}",
                ((currentPage - 1) * itemsPerPage + 1).toString(),
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {t("common.previous") || "Prev"}
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-sm ${
                        currentPage === pageNum
                          ? "bg-primary text-white border-primary"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {t("common.next") || "Next"}
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-20">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {selectedStorefrontId
                ? t("pos.noProductsInStorefront")
                : t("pos.pleaseSelectStorefront")}
            </div>
          ) : (
            filteredProducts.map((stockItem) => (
              <div
                key={stockItem._id}
                onClick={() => addToCart(stockItem)}
                className={`bg-white p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col`}
              >
                <div className="">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2">
                    {stockItem.inventoryId.productName}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {stockItem.inventoryId.productCode}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stockItem.inventoryId.category}
                  </p>
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <span className="font-bold text-primary-600">
                    {(stockItem.inventoryId.sellingPrice || 0).toLocaleString()}{" "}
                    MMK
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white flex flex-col border-l border-gray-200 shadow-xl h-[calc(100vh-60px)] sticky top-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">{t("directSale.currentSale")}</h2>
          {selectedStorefrontId && (
            <p className="text-xs text-gray-400 mt-1">
              {
                storefronts.find((sf) => sf._id === selectedStorefrontId)
                  ?.locationName
              }
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              {t("pos.emptyCart")}
            </div>
          ) : (
            cart.map((item) => {
              const lineId = getCartLineId(item);
              const { baseUnit, conversions } = getInventoryUomFromStock(
                item.stockItem,
              );
              const unitPrice = getCartLineUnitPrice(item);
              return (
                <div
                  key={lineId}
                  className="flex flex-col gap-2 border-b border-gray-200 pb-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {item.stockItem.inventoryId.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {unitPrice.toLocaleString()} MMK / {item.selectedUnit} ·{" "}
                        {(unitPrice * item.qty).toLocaleString()} MMK
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(lineId)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CartUnitSelector
                      baseUnit={baseUnit}
                      conversions={conversions}
                      selectedUnit={item.selectedUnit}
                      onUnitChange={(unit) => setCartLineUnit(lineId, unit)}
                    />
                    <div className="cart-item-controls flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => updateQty(lineId, -1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setQty(lineId, value);
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          if (value < 1) setQty(lineId, 1);
                        }}
                        className="text-sm font-medium w-12 text-center border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-primary focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-gray-500">
                        {item.selectedUnit}
                      </span>
                      <button
                        onClick={() => updateQty(lineId, 1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary & Checkout Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("pos.items")}</span>
              <span>
                {cart.reduce((sum, item) => sum + item.qty, 0)}{" "}
                {t("pos.itemsLower")}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>{t("common.total")}</span>
              <span>{subtotal.toLocaleString()} MMK</span>
            </div>
          </div>

          <button
            onClick={() => {
              // Auto-fill paid amount with total when opening checkout modal
              // Set to 0 for FOC or Credit, otherwise use total
              const initialPaidAmount =
                paymentMethod === PaymentMethod.FOC || paymentType === "credit"
                  ? 0
                  : Math.ceil(total);
              setPaidAmount(initialPaidAmount);
              setShowCheckoutModal(true);
            }}
            disabled={cart.length === 0}
            className="start-btn w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t("pos.proceedToCheckout")}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 mb-1">
                {t("pos.processing")}
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we process your order...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b bg-primary/10">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">
                  {/* {t("pos.checkout")} */}
                  {devices.isMobile ? "Mobile" : "Desktop"}
                </h3>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {cart.reduce((sum, item) => sum + item.qty, 0)}{" "}
                {t("pos.itemsLower")} • {subtotal.toLocaleString()} MMK
              </p>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.paymentType")}
                </label>
                <select
                  className="payment-type-select w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={paymentType}
                  onChange={(e) => {
                    setPaymentType(e.target.value as "paid" | "credit");
                    if (e.target.value === "paid") {
                      setSelectedCreditPersonId("");
                      setPaymentMethod(PaymentMethod.CASH);
                      // Reset to total when switching back to paid
                      setPaidAmount(Math.ceil(total));
                    } else if (e.target.value === "credit") {
                      setPaymentMethod(PaymentMethod.NORMAL);
                      // Set initial value to zero for credit
                      setPaidAmount(0);
                    }
                  }}
                >
                  <option value="paid">{t("pos.paid")}</option>
                  <option value="credit">{t("pos.credit")}</option>
                </select>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.orderDate") || "Order Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Credit Person Selector - Only show when paymentType is credit */}
              {paymentType === "credit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("pos.selectCreditPerson")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                      className="w-full pl-9 pr-4 py-2.5 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-orange-50"
                      value={selectedCreditPersonId}
                      onChange={(e) =>
                        setSelectedCreditPersonId(e.target.value)
                      }
                    >
                      <option value="">
                        {creditPersonas.length === 0
                          ? `-- ${t("pos.noCreditPersons")} --`
                          : `-- ${t("pos.selectCreditPersonOptional")} --`}
                      </option>
                      {creditPersonas.map((persona) => (
                        <option key={persona._id} value={persona._id}>
                          {persona.name} - {persona.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.paymentMethod")}
                </label>
                <select
                  className="payment-method-select w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                >
                  {paymentType === "credit" ? (
                    <>
                      <option value={PaymentMethod.NORMAL}>
                        <span>normal</span>
                      </option>
                      <option value={PaymentMethod.HOT}>
                        <span>hot</span>
                      </option>
                    </>
                  ) : (
                    <>
                      <option value={PaymentMethod.CASH}>
                        {t("pos.cash")}
                      </option>
                      <option value={PaymentMethod.KBZ_PAY}>
                        {t("pos.kbzPay")}
                      </option>
                      <option value={PaymentMethod.WAVE_PAY}>
                        {t("pos.wavePay")}
                      </option>
                      <option value={PaymentMethod.AYA_PAY}>
                        {t("pos.ayaPay")}
                      </option>
                      <option value={PaymentMethod.UAB_PAY}>
                        {t("pos.uabPay")}
                      </option>
                      <option value={PaymentMethod.BANK_TRANSFER}>
                        {t("pos.bankTransfer")}
                      </option>
                      <option value={PaymentMethod.MMQR}>
                        <span>MMQR</span>
                      </option>
                      <option value={PaymentMethod.FOC}>
                        <span>FOC</span>
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* Discount/Markup Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Option
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={!useMarkup}
                      onChange={() => setUseMarkup(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">Discount</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={useMarkup}
                      onChange={() => setUseMarkup(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Markup</span>
                  </label>
                </div>
              </div>

              {/* Discount */}
              {!useMarkup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("pos.discount")} (%)
                    <button
                      onClick={() => setShowDiscountCalculator(true)}
                      className="ml-2 text-primary hover:text-primary-700 transition-colors"
                      title="Calculate discount percentage"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="discount-input w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Markup */}
              {useMarkup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Markup Amount (MMK)
                    <button
                      onClick={() => setShowMarkupCalculator(true)}
                      className="ml-2 text-primary hover:text-primary-700 transition-colors"
                      title="Add fixed markup amount"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={markupAmount}
                    onChange={(e) => setMarkupAmount(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {paymentMethod === PaymentMethod.FOC
                    ? `${t("pos.paidAmount")} (MMK) - ${t("pos.focMessage") || "Free of Charge"}`
                    : `${t("pos.paidAmount")} (MMK)`}
                  {paymentType === "paid" &&
                    paymentMethod !== PaymentMethod.FOC && (
                      <span className="text-red-500">*</span>
                    )}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={paymentMethod === PaymentMethod.FOC}
                  className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                    paymentMethod === PaymentMethod.FOC
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  value={paymentMethod === PaymentMethod.FOC ? 0 : paidAmount}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : Number(e.target.value);
                    // Use Math.ceil to ensure paid amount is always an integer
                    setPaidAmount(Math.ceil(value));
                  }}
                  placeholder={
                    paymentMethod === PaymentMethod.FOC
                      ? "0"
                      : t("pos.enterPaidAmount")
                  }
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.note")} ({t("common.optional")})
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("pos.notePlaceholder")}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("common.subtotal")}</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                {!useMarkup && discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      {t("common.discount")} ({discount}%)
                    </span>
                    <span>-{combinedDiscountAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                {useMarkup && markupAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Markup Amount</span>
                    <span>+{markupAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>{t("common.total")}</span>
                  <span>{total.toLocaleString()} MMK</span>
                </div>
                {paidAmount > 0 &&
                  paidAmount >= total &&
                  paymentType === "paid" && (
                    <div className="change-display-row flex justify-between text-sm text-green-600 font-medium">
                      <span>{t("common.change")}</span>
                      <span>{(paidAmount - total).toLocaleString()} MMK</span>
                    </div>
                  )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 space-y-2">
              <button
                onClick={() => {
                  handleCheckout();
                  setShowCheckoutModal(false);
                }}
                disabled={
                  cart.length === 0 ||
                  isProcessing ||
                  (paymentType === "paid" && paidAmount < total) ||
                  (paymentType === "credit" && paidAmount > total)
                }
                className="complete-sale-btn w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("pos.processing")}
                  </>
                ) : (
                  <>
                    {t("pos.completeSale")} • {total.toLocaleString()} MMK
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markup Calculator Modal */}
      {showMarkupCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Fixed Amount Markup
              </h2>
              <button
                onClick={() => {
                  setShowMarkupCalculator(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Subtotal */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Current Subtotal</p>
                <p className="text-2xl font-bold text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              {/* Markup Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Markup Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter markup amount..."
                  value={markupAmount}
                  onChange={(e) => setMarkupAmount(Number(e.target.value))}
                />
              </div>
              {/* Calculated Percentage */}
              {markupAmount && Number(markupAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">
                      Markup Amount:
                    </span>
                    <span className="font-bold text-blue-700">
                      {Number(markupAmount).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Percentage:</span>
                    <span className="font-bold text-blue-700">
                      {((Number(markupAmount) / subtotal) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Final Total:</span>
                    <span className="font-bold text-slate-800">
                      {(subtotal + Number(markupAmount)).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowMarkupCalculator(false);
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (markupAmount && Number(markupAmount) > 0) {
                      setMarkupAmount(Number(markupAmount));
                      setShowMarkupCalculator(false);
                      toast.success(
                        `Markup set to ${Number(markupAmount).toLocaleString()} MMK`,
                      );
                    }
                  }}
                  disabled={!markupAmount || Number(markupAmount) <= 0}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Markup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Calculator Modal */}
      {showDiscountCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Discount Calculator
              </h2>
              <button
                onClick={() => {
                  setShowDiscountCalculator(false);
                  setDiscountAmount("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Subtotal */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Current Subtotal</p>
                <p className="text-2xl font-bold text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              {/* Discount Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Discount Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter discount amount..."
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              {/* Calculated Percentage */}
              {discountAmount && Number(discountAmount) > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">
                      Discount Amount:
                    </span>
                    <span className="font-bold text-green-700">
                      {Number(discountAmount).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Percentage:</span>
                    <span className="font-bold text-green-700">
                      {((Number(discountAmount) / subtotal) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Final Total:</span>
                    <span className="font-bold text-slate-800">
                      {(subtotal - Number(discountAmount)).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDiscountCalculator(false);
                    setDiscountAmount("");
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (discountAmount && Number(discountAmount) > 0) {
                      const calculatedPercentage = (
                        (Number(discountAmount) / subtotal) *
                        100
                      ).toFixed(2);
                      setDiscount(Number(calculatedPercentage)); // Use number for consistency
                      setShowDiscountCalculator(false);
                      setDiscountAmount("");
                      toast.success(`Discount set to ${calculatedPercentage}%`);
                    }
                  }}
                  disabled={
                    !discountAmount ||
                    Number(discountAmount) <= 0 ||
                    Number(discountAmount) > subtotal
                  }
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Success Icon and Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("directSale.saleCompleted")}
              </h2>
              <p className="text-green-50 text-sm">
                Your order has been processed successfully
              </p>
            </div>

            {/* Action Button */}
            <div className="p-6 pt-6">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessOrderNumber("");
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
