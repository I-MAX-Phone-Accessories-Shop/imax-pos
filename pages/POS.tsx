import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  CreditCard,
  DollarSign,
  RefreshCw,
  Store,
  ChevronDown,
  Loader2,
  Scan,
  X,
  User,
  Calculator,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { CartPanel } from "../components/POS/CartPanel";
import { printThermalReceipt } from "../components/ThermalReceipt";
import { detectDevice } from "../utils/deviceDetect";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { createOrder } from "../services/Order/createOrder";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { deviceDetect } from "react-device-detect";

// Payment methods
enum PaymentMethod {
  CASH = "Cash",
  KBZ_PAY = "KBZPay",
  WAVE_PAY = "WavePay",
  AYA_PAY = "AYA Pay",
  UAB_PAY = "UAB Pay",
  BANK_TRANSFER = "Bank Transfer",
  NORMAL = "Normal",
  HOT = "Hot",
  FOC = "FOC",
}

interface CartItem {
  stockItem: StorefrontStockItem;
  qty: number;
}

// Stock at or below this (and above 0) counts as low stock
const LOW_STOCK_THRESHOLD = 10;

type StockFilter = "all" | "in" | "low" | "out";

const matchesStockFilter = (availableQuantity: number, filter: StockFilter) => {
  switch (filter) {
    case "in":
      return availableQuantity > 0;
    case "low":
      return availableQuantity >= 1 && availableQuantity <= LOW_STOCK_THRESHOLD;
    case "out":
      return availableQuantity <= 0;
    default:
      return true;
  }
};

export const POS: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Data State
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  // Mobile (< lg) cart bottom sheet and floating button pulse
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isCartButtonPulsing, setIsCartButtonPulsing] = useState(false);
  const prevCartCountRef = useRef(0);
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

      // Load stock items
      await loadStockItems();
    } catch (error) {
      // console.error("Error loading initial data:", error);
      toast.error(t("pos.failedToLoadData"));
    } finally {
      setIsProcessing(false);
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

  const loadStockItems = async () => {
    try {
      const response = await fetchStorefrontStock(selectedStorefrontId);
      // console.log("response", response);
      if (response.success && response.data) {
        setAllStockItems(response.data);
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

  const visibleStockItems = allStockItems.filter(
    (item) => item.inventoryId?._id !== "69a15d55218ec5ff9a3fe4a3",
  );

  // Filter products by search (name, code, SKU) and category
  const searchTerm = search.toLowerCase();
  const searchedProducts = visibleStockItems.filter((item) => {
    // const matchesStorefront = item.storefrontId?._id === selectedStorefrontId;
    const matchesSearch = [
      item.inventoryId?.productName,
      item.inventoryId?.productCode,
      item.inventoryId?.SKU,
    ].some((value) => value?.toLowerCase().includes(searchTerm));
    const matchesCategory =
      selectedCategory === "All" ||
      item.inventoryId?.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Counts for the stock filter options (real stock, not cart-adjusted)
  const stockFilterCounts: Record<StockFilter, number> = {
    all: searchedProducts.length,
    in: 0,
    low: 0,
    out: 0,
  };
  searchedProducts.forEach((item) => {
    (["in", "low", "out"] as StockFilter[]).forEach((filter) => {
      if (matchesStockFilter(item.availableQuantity, filter)) {
        stockFilterCounts[filter] += 1;
      }
    });
  });

  const filteredProducts = searchedProducts.filter((item) =>
    matchesStockFilter(item.availableQuantity, stockFilter),
  );

  const cartQtyByStockId = cart.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.stockItem._id] = item.qty;
      return acc;
    },
    {},
  );

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setStockFilter("all");
  };

  const renderStockInfo = (stockItem: StorefrontStockItem) => {
    const inCart = cartQtyByStockId[stockItem._id] || 0;
    const remaining = Math.max(0, stockItem.availableQuantity - inCart);

    let badge: React.ReactNode;
    if (stockItem.availableQuantity <= 0) {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 whitespace-nowrap">
          {t("pos.stockOut")}
        </span>
      );
    } else if (remaining === 0) {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
          {t("pos.allInCart")}
        </span>
      );
    } else if (remaining <= LOW_STOCK_THRESHOLD) {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
          {t("pos.stockLow").replace("{n}", remaining.toString())}
        </span>
      );
    } else {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 whitespace-nowrap">
          {t("pos.stockIn").replace("{n}", remaining.toString())}
        </span>
      );
    }

    return (
      <div className="flex flex-col items-end gap-0.5">
        {badge}
        {inCart > 0 && (
          <span className="text-[11px] text-gray-400">
            {t("pos.inCart").replace("{n}", inCart.toString())}
          </span>
        )}
      </div>
    );
  };

  // Get unique categories from current storefront products
  const categories = [
    ...new Set(
      allStockItems
        .filter((item) => item.storefrontId?._id === selectedStorefrontId)
        .map((item) => item.inventoryId?.category)
        .filter(Boolean),
    ),
  ].sort();

  const addToCart = (stockItem: StorefrontStockItem) => {
    if (stockItem.availableQuantity <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.stockItem._id === stockItem._id,
      );
      if (existing) {
        if (existing.qty + 1 > stockItem.availableQuantity) {
          toast.error(t("pos.cannotExceedStock"));
          return prev;
        }
        return prev.map((item) =>
          item.stockItem._id === stockItem._id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prev, { stockItem, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.stockItem._id === id) {
          const newQty = item.qty + delta;
          if (newQty > item.stockItem.availableQuantity) {
            toast.error(t("pos.cannotExceedStock"));
            return item;
          }
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const setQty = (id: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.stockItem._id === id) {
          // Validate quantity
          if (newQty < 1) {
            return { ...item, qty: 1 };
          }
          if (newQty > item.stockItem.availableQuantity) {
            toast.error(t("pos.cannotExceedStock"));
            return { ...item, qty: item.stockItem.availableQuantity };
          }
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.stockItem._id !== id));
  };

  // Handle barcode scanning from search input
  const handleBarcodeScan = (searchValue: string) => {
    if (!searchValue.trim()) return;

    // Filter products by selected storefront first
    const storefrontProducts = allStockItems.filter((item) => {
      const matchesStorefront = item.storefrontId?._id === selectedStorefrontId;
      const isHidden = item.inventoryId?._id === "69a15d55218ec5ff9a3fe4a3";
      return matchesStorefront && !isHidden;
    });

    // Find matching product by barcode, productCode, or SKU (case-insensitive)
    // Only try exact matches (not partial) for barcode scanning
    const matchingProduct = storefrontProducts.find((item) => {
      const barcodeToMatch = searchValue.trim().toLowerCase();
      const productBarcode =
        (item.inventoryId as any)?.barcode?.toLowerCase() || "";
      const productCode = item.inventoryId.productCode?.toLowerCase() || "";
      const sku = item.inventoryId.SKU?.toLowerCase() || "";

      // Exact match only for barcode scanning
      return (
        (productBarcode && productBarcode === barcodeToMatch) ||
        (productCode && productCode === barcodeToMatch) ||
        (sku && sku === barcodeToMatch)
      );
    });

    if (matchingProduct) {
      // Check if product is in stock
      if (matchingProduct.availableQuantity <= 0) {
        toast.error(t("pos.outOfStock"));
        setSearch(""); // Clear search
        return;
      }

      // Add to cart (will increment if already exists)
      addToCart(matchingProduct);

      // Show success feedback
      toast.success(
        `${matchingProduct.inventoryId.productName} ${t("pos.addedToCart") || "added to cart"
        }`,
        {
          duration: 1500,
        },
      );

      // Clear search after successful barcode scan
      setSearch("");
      return true; // Indicate barcode was found and processed
    }

    return false; // No barcode match found, continue with regular search
  };

  // Calculate totals
  const getItemPrice = (item: StorefrontStockItem) => {
    // Use sellingPrice from inventory if available, otherwise use placeholder
    return item.inventoryId.sellingPrice; // Default to 10000 MMK if not available
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item.stockItem) * item.qty,
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const selectedStorefrontName = selectedStorefrontId
    ? storefronts.find((sf) => sf._id === selectedStorefrontId)?.locationName
    : undefined;

  const totalAfterDiscount = Math.ceil(
    subtotal * (1 - Math.ceil(discount) / 100),
  );
  const totalAfterMarkup = subtotal + markupAmount;

  const total = useMarkup ? totalAfterMarkup : totalAfterDiscount;
  const combinedDiscountAmount = useMarkup
    ? 0
    : Math.ceil(subtotal - totalAfterDiscount);

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
      };

      const discountAmount = useMarkup ? 0 : subtotal - totalAfterDiscount;

      const orderPayload = {
        storefrontId: selectedStorefrontId,
        ordersProducts: cart.map((item) => ({
          inventoryId: item.stockItem.inventoryId._id,
          quantity: item.qty,
        })),
        subTotal: subtotal,
        discount: discountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        paymentType: paymentType,
        paymentMethod: paymentMethodMap[paymentMethod],
        ...(paymentType === "credit" && selectedCreditPersonId
          ? { creditPersonId: selectedCreditPersonId }
          : {}),
      };

      const result = await createOrder(orderPayload);

      if (result.success) {
        const selectedStorefront = storefronts.find(
          (sf) => sf._id === selectedStorefrontId,
        );

        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: result.data?.orderNumber || `INV-${Date.now()}`,
          storefrontName: selectedStorefront?.locationName || "Store",
          items: cart.map((i) => ({
            name: i.stockItem.inventoryId.productName,
            code: i.stockItem.inventoryId.productCode,
            qty: i.qty,
            price: getItemPrice(i.stockItem),
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
        console.log("Device:", device);

        // Auto-print receipt based on device
        if (device.isAndroid || device.isIOS) {
          // For mobile devices (Android/iOS), navigate to receipt page
          navigate(`/print-receipt/${receiptData.invoiceNumber}`);
        } else {
          // For desktop/Windows, use thermal receipt function
          printThermalReceipt(receiptData, "58mm");
        }
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

        toast.success(t("pos.saleCompleted"));

        // Refresh stock after sale
        await loadStockItems();
      } else {
        toast.error(result.message || t("pos.failedToProcessSale"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("pos.failedToProcessSale"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToCheckout = () => {
    // Auto-fill paid amount with total when opening checkout modal
    // Set to 0 for FOC or Credit, otherwise use total
    const initialPaidAmount =
      paymentMethod === PaymentMethod.FOC || paymentType === "credit"
        ? 0
        : Math.ceil(total);
    setPaidAmount(initialPaidAmount);
    // Close the mobile sheet first so overlays never stack
    setIsCartSheetOpen(false);
    setShowCheckoutModal(true);
  };

  // Pulse the floating cart button when an item is added
  useEffect(() => {
    if (cartItemCount > prevCartCountRef.current) {
      setIsCartButtonPulsing(true);
      const timer = setTimeout(() => setIsCartButtonPulsing(false), 300);
      prevCartCountRef.current = cartItemCount;
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartItemCount;
  }, [cartItemCount]);

  // Close the sheet when the cart empties (last item removed, sale done)
  useEffect(() => {
    if (cart.length === 0) setIsCartSheetOpen(false);
  }, [cart.length]);

  // While the sheet is open: lock body scroll, close on Esc, and close if
  // the screen grows to the desktop layout
  useEffect(() => {
    if (!isCartSheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCartSheetOpen(false);
    };
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleResize = () => {
      if (desktopQuery.matches) setIsCartSheetOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleResize);
    };
  }, [isCartSheetOpen]);

  // Handle storefront change
  const handleStorefrontChange = (storefrontId: string) => {
    setSelectedStorefrontId(storefrontId);
    setCart([]); // Clear cart when switching storefronts
    setSelectedCategory("All");
    setStockFilter("all");
  };

  if (loading && storefronts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-dark-600">{t("pos.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-gray-100">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col px-4 lg:px-6 py-4 overflow-hidden">
        {/* Search Bar with Storefront Badge */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Combined Search/Barcode Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
              <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
              <input
                type="text"
                placeholder={
                  t("pos.searchOrScanBarcode") ||
                  "Search products or scan barcode..."
                }
                className="w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

            {/* Stock Filter */}
            <select
              className="border border-dark-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            >
              <option value="all">
                {t("pos.filterAllStock")} ({stockFilterCounts.all})
              </option>
              <option value="in">
                {t("pos.filterInStock")} ({stockFilterCounts.in})
              </option>
              <option value="low">
                {t("pos.filterLowStock").replace(
                  "{n}",
                  LOW_STOCK_THRESHOLD.toString(),
                )}{" "}
                ({stockFilterCounts.low})
              </option>
              <option value="out">
                {t("pos.filterOutOfStock")} ({stockFilterCounts.out})
              </option>
            </select>

            {/* Storefront Settings Button */}
            <div className="relative ml-auto">
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
                  className={`w-4 h-4 text-primary transition-transform duration-200 ${showStorefrontMenu ? "rotate-180" : ""
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
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${sf._id === selectedStorefrontId
                            ? "bg-primary/20 border-l-4 border-primary"
                            : ""
                            }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${sf._id === selectedStorefrontId
                              ? "bg-primary text-dark"
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

        {/* Product Grid */}
        <div className="flex overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-28 lg:pb-20">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {!selectedStorefrontId ? (
                t("pos.pleaseSelectStorefront")
              ) : visibleStockItems.length === 0 ? (
                t("pos.noProductsInStorefront")
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span>{t("pos.noProductsMatchFilters")}</span>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-dark-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t("pos.clearFilters")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredProducts.map((stockItem) => (
              <div
                key={stockItem._id}
                onClick={() => addToCart(stockItem)}
                className={`bg-white p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col ${stockItem.availableQuantity <= 0
                  ? "opacity-50 grayscale pointer-events-none"
                  : ""
                  }`}
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
                <div className="mt-auto pt-4 flex justify-between items-end gap-2">
                  <span className="font-bold text-primary-600">
                    {getItemPrice(stockItem).toLocaleString()} MMK
                  </span>
                  {renderStockInfo(stockItem)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Sidebar (lg and up) */}
      <div className="hidden lg:flex w-96 bg-white flex-col border-l border-gray-200 shadow-xl h-[calc(100vh-60px)] sticky top-0">
        <CartPanel
          variant="sidebar"
          cart={cart}
          storefrontName={selectedStorefrontName}
          subtotal={subtotal}
          itemCount={cartItemCount}
          getItemPrice={getItemPrice}
          onUpdateQty={updateQty}
          onSetQty={setQty}
          onRemove={removeFromCart}
          onCheckout={handleProceedToCheckout}
        />
      </div>

      {/* Floating cart button (below lg) */}
      <button
        type="button"
        onClick={() => {
          if (cart.length > 0) setIsCartSheetOpen(true);
        }}
        disabled={cart.length === 0}
        aria-disabled={cart.length === 0}
        aria-label={t("pos.cartButtonLabel")
          .replace("{count}", cartItemCount.toString())
          .replace("{total}", subtotal.toLocaleString())}
        className={`lg:hidden fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 h-14 flex items-center gap-3 pl-3 pr-4 rounded-2xl shadow-lg transition-transform duration-300 ${
          cart.length === 0
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-btn-primary hover:bg-btn-primary-hover text-dark active:scale-95"
        } ${isCartButtonPulsing ? "scale-110" : "scale-100"}`}
      >
        <span className="relative">
          <ShoppingCart className="w-6 h-6" />
          <span
            className={`absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${
              cart.length === 0 ? "bg-gray-400 text-white" : "bg-dark text-white"
            }`}
          >
            {cartItemCount}
          </span>
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[11px] font-medium opacity-80">
            {t("pos.viewCart")}
          </span>
          <span className="text-sm font-bold">
            {subtotal.toLocaleString()} MMK
          </span>
        </span>
      </button>

      {/* Cart bottom sheet (below lg) */}
      <div className="lg:hidden" aria-hidden={!isCartSheetOpen}>
        <div
          className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-[250ms] ${
            isCartSheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsCartSheetOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("pos.currentSale")}
          className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col transition-transform duration-[250ms] ease-out ${
            isCartSheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex justify-center pt-2">
            <span className="w-10 h-1.5 rounded-full bg-gray-300" />
          </div>
          <CartPanel
            variant="sheet"
            cart={cart}
            storefrontName={selectedStorefrontName}
            subtotal={subtotal}
            itemCount={cartItemCount}
            getItemPrice={getItemPrice}
            onUpdateQty={updateQty}
            onSetQty={setQty}
            onRemove={removeFromCart}
            onCheckout={handleProceedToCheckout}
            onClose={() => setIsCartSheetOpen(false)}
          />
        </div>
      </div>

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
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                  className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${paymentMethod === PaymentMethod.FOC
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                    }`}
                  value={
                    paymentMethod === PaymentMethod.FOC ? 0 : paidAmount
                  }
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : Number(e.target.value);
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
                    <div className="flex justify-between text-sm text-green-600 font-medium">
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
                  (paymentType === "paid" && paidAmount < total)
                }
                className="w-full bg-btn-primary hover:bg-btn-primary-hover text-dark py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  onChange={(e) => setMarkupAmount(e.target.value)}
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
    </div>
  );
};
