import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
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
  ChevronLeft,
  Menu,
  LogOut as LogOutIcon,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
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
  customPrice?: number;
  itemDiscount?: number;
  remark?: string;
}

interface POSProps {
  setSidebarOpen?: (open: boolean) => void;
}

export const POS: React.FC<POSProps> = ({ setSidebarOpen }) => {
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
  const [viewMode, setViewMode] = useState<"categories" | "products">("categories");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const { currentUser } = useApp();
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
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
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<{
    index: number;
    item: CartItem;
  } | null>(null);
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [tempRemark, setTempRemark] = useState("");
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

  // Filter products by selected storefront and search
  const filteredProducts = allStockItems.filter((item) => {
    const hideProduct = item.inventoryId?._id === "69a15d55218ec5ff9a3fe4a3";
    const matchesSearch = item.inventoryId?.productName
      ?.toLowerCase()
      .includes(search.toLowerCase());

    // If searching, ignore category filter to show all matches
    if (search.trim()) return !hideProduct && matchesSearch;

    const matchesCategory =
      selectedCategory === "All" ||
      item.inventoryId?.category === selectedCategory;

    return !hideProduct && matchesSearch && matchesCategory;
  });

  // Auto-switch to products view when searching
  useEffect(() => {
    if (search.trim() && viewMode === "categories") {
      setViewMode("products");
      setActiveCategory("Search Results");
      setSelectedCategory("All");
    } else if (!search.trim() && activeCategory === "Search Results") {
      setViewMode("categories");
      setActiveCategory("");
      setSelectedCategory("All");
    }
  }, [search]);

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
      const existingIndex = prev.findIndex(
        (item) => item.stockItem._id === stockItem._id,
      );
      if (existingIndex !== -1) {
        if (prev[existingIndex].qty + 1 > stockItem.availableQuantity) {
          toast.error(t("pos.cannotExceedStock"));
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          stockItem,
          qty: 1,
          customPrice: getItemPrice(stockItem),
          itemDiscount: 0,
          remark: "",
        },
      ];
    });
    // Dispatch custom event for tutorial validation
    window.dispatchEvent(new CustomEvent("product-added"));
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
    (sum, item) =>
      sum + (item.customPrice || getItemPrice(item.stockItem)) * item.qty,
    0,
  );

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
          price: item.customPrice || getItemPrice(item.stockItem),
          remark: item.remark,
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
            originalPrice: getItemPrice(i.stockItem),
            price: i.customPrice || getItemPrice(i.stockItem),
            remark: i.remark,
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

  // Handle storefront change
  const handleStorefrontChange = (storefrontId: string) => {
    setSelectedStorefrontId(storefrontId);
    setCart([]); // Clear cart when switching storefronts
    setSelectedCategory("All");
  };

  const handleUpdateCartItem = () => {
    if (!editingCartItem) return;

    setCart((prev) => {
      const updated = [...prev];
      updated[editingCartItem.index] = {
        ...updated[editingCartItem.index],
        qty: tempQty,
        customPrice: tempPrice,
        remark: tempRemark,
      };
      return updated;
    });
    setShowQuantityModal(false);
    setEditingCartItem(null);
    toast.success(t("pos.itemUpdated") || "Item updated successfully");
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Blue Header */}
      <div className="h-14 bg-blue-800 flex items-center justify-between px-4 text-white shadow-md z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen?.(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-wide">Sale Invoice</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium opacity-90">
              {currentUser?.name || "salemanager3"}
            </span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
            title="Exit POS"
          >
            <LogOutIcon className="w-5 h-5 opacity-80 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Cart Sidebar (Left) */}
        <div className="w-[450px] bg-white flex flex-col border-r border-gray-200 shadow-sm relative">
          <div className="p-4 space-y-3 bg-gray-50/50 border-b">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                  Date
                </label>
                <div className="relative mt-0.5">
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                  Voucher No
                </label>
                <div className="flex gap-1 mt-0.5">
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value="VOU-1"
                    readOnly
                  />
                  <button className="p-2 bg-gray-100 border rounded-lg hover:bg-gray-200 transition-colors">
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Table Header */}
          <div className="grid grid-cols-12 px-4 py-2 bg-blue-50/30 border-b text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            <div className="col-span-1">Sr</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-4 text-right">Amount</div>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-2 py-1 bg-white">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="grid grid-cols-2 gap-2 opacity-40">
                    <div className="w-12 h-1 bg-gray-300 rounded"></div>
                    <div className="w-12 h-1 bg-gray-300 rounded"></div>
                    <div className="w-8 h-1 bg-gray-300 rounded"></div>
                    <div className="w-16 h-1 bg-gray-300 rounded"></div>
                  </div>
                  <X className="w-8 h-8 mx-auto mt-4 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-500">No Sale</p>
                  <p className="text-xs">You have made no sales.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-px">
                {cart.map((item, index) => (
                  <div
                    key={item.stockItem._id}
                    onClick={() => {
                      setEditingCartItem({ index, item });
                      setTempQty(item.qty);
                      setTempPrice(item.customPrice || getItemPrice(item.stockItem));
                      setTempRemark(item.remark || "");
                      setShowQuantityModal(true);
                    }}
                    className="grid grid-cols-12 px-2 py-3 items-center group hover:bg-blue-50/50 rounded-lg transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                  >
                    <div className="col-span-1 text-xs text-gray-400 font-medium">
                      {index + 1}
                    </div>
                    <div className="col-span-5 pr-2">
                      <p className="text-xs font-bold text-gray-800 line-clamp-2 myanmar-font">
                        {item.stockItem.inventoryId.productName}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {(item.customPrice || getItemPrice(item.stockItem)).toLocaleString()} MMK
                      </p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xs font-bold text-gray-700">
                        {item.qty}
                      </span>
                    </div>
                    <div className="col-span-4 text-right flex flex-col items-end">
                      <span className="text-[13px] font-bold text-blue-700">
                        {((item.customPrice || getItemPrice(item.stockItem)) * item.qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 bg-gray-50 border-t shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-2 gap-y-2 mb-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center pr-6">
                  <span className="text-xs text-gray-500 font-medium">Amount</span>
                  <span className="text-sm font-bold text-gray-800">
                    {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pr-6">
                  <span className="text-xs text-gray-500 font-medium">Discount</span>
                  <span className="text-sm font-bold text-gray-800">
                    {combinedDiscountAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pr-6">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    Outsta...
                  </span>
                  <span className="text-sm font-bold text-gray-800">0</span>
                </div>
              </div>
              <div className="flex flex-col justify-end items-end relative border-l border-gray-200 pl-4">
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="absolute top-2 right-0 px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-200 transition-colors"
                >
                  Detail
                </button>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Net Amount
                </span>
                <span className="text-2xl font-black text-orange-600 tracking-tight">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const initialPaidAmount =
                  paymentMethod === PaymentMethod.FOC || paymentType === "credit"
                    ? 0
                    : Math.ceil(total);
                setPaidAmount(initialPaidAmount);
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
            >
              <span className="relative z-10">Confirm</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>
        </div>

        {/* Categories/Products Section (Right) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {/* Right Header: Search & Category Title */}
          <div className="h-[74px] border-b flex items-center justify-between px-6 bg-gray-50/30">
            <div className="flex items-center gap-4">
              {viewMode === "products" && (
                <button
                  onClick={() => setViewMode("categories")}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-blue-900"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-xl font-black text-blue-900 truncate max-w-[300px] myanmar-font capitalize">
                {viewMode === "categories" ? "Categories" : activeCategory}
              </h2>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-900/40" />
              <input
                type="text"
                placeholder="Search Items"
                className="w-full pl-10 pr-4 py-2 bg-blue-900 font-medium text-white placeholder-blue-300 rounded-full border-none focus:ring-4 focus:ring-blue-100 outline-none text-sm shadow-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/20">
            {viewMode === "categories" ? (
              /* Category Grid */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setSelectedCategory(category);
                      setViewMode("products");
                    }}
                    className="aspect-[5/3] bg-blue-100/50 hover:bg-blue-800 border-2 border-blue-200 hover:border-blue-900 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1"
                  >
                    <span className="font-bold text-blue-900 group-hover:text-white myanmar-font text-base line-clamp-2">
                      {category}
                    </span>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 group-hover:text-blue-200 opacity-60">
                      View Products
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((stockItem) => (
                  <button
                    key={stockItem._id}
                    onClick={() => addToCart(stockItem)}
                    className={`flex flex-col text-left bg-white border-2 border-blue-100 rounded-xl p-3 h-full transition-all hover:shadow-xl hover:border-blue-600 active:scale-95 group relative overflow-hidden ${stockItem.availableQuantity === 0
                        ? "opacity-50 grayscale cursor-not-allowed"
                        : ""
                      }`}
                  >
                    <div className="space-y-1 z-10">
                      <h3 className="font-bold text-gray-800 text-[13px] line-clamp-2 leading-snug group-hover:text-blue-900 transition-colors myanmar-font">
                        {stockItem.inventoryId.productName}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-auto pt-2">
                        <span className="text-lg font-black text-blue-600">
                          {getItemPrice(stockItem).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">MMK</span>
                      </div>
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 z-10">
                      Stock: {stockItem.availableQuantity}
                    </div>

                    {/* Hover Effect Layer */}
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors"></div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 italic">
                    <ShoppingBag className="w-12 h-12 mb-4 opacity-10" />
                    No products found in this category
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                  className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${paymentMethod === PaymentMethod.FOC
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
                  (paymentType === "paid" && paidAmount < total)
                }
                className="complete-sale-btn w-full bg-btn-primary hover:bg-btn-primary-hover text-dark py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Quantity Edit Modal */}
      {showQuantityModal && editingCartItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-blue-900 myanmar-font">
                {editingCartItem.item.stockItem.inventoryId.productName}
              </h3>
              <button
                onClick={() => setShowQuantityModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-6">
              {/* Qty & Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Qty</label>
                <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setTempQty(Math.max(1, tempQty - 1))}
                    className="p-3 bg-gray-50 hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    className="flex-1 text-center font-bold text-lg outline-none border-x-2 border-gray-200"
                    value={tempQty}
                    onChange={(e) => setTempQty(Number(e.target.value))}
                  />
                  <button
                    onClick={() => {
                      if (tempQty + 1 <= editingCartItem.item.stockItem.availableQuantity) {
                        setTempQty(tempQty + 1);
                      } else {
                        toast.error(t("pos.cannotExceedStock"));
                      }
                    }}
                    className="p-3 bg-gray-50 hover:bg-green-50 text-green-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Unit</label>
                <div className="relative">
                  <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white outline-none appearance-none focus:border-blue-500 transition-colors">
                    <option>ဒါဇင်</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price Level & Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price Level</label>
                <div className="relative">
                  <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white outline-none appearance-none focus:border-blue-500 transition-colors">
                    <option>SP</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Sale Price</label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors font-bold text-gray-700"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Number(e.target.value))}
                />
              </div>

              {/* Discount & Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Item Discount</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors font-medium text-gray-700 bg-gray-50"
                  value="Normal"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Amount</label>
                <div className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50 font-bold text-blue-900">
                  {(tempQty * tempPrice).toLocaleString()}
                </div>
              </div>

              {/* Remark */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Remark</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    value={tempRemark}
                    onChange={(e) => setTempRemark(e.target.value)}
                  />
                  {tempRemark && (
                    <button
                      onClick={() => setTempRemark("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 bg-gray-50 border-t flex gap-4">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-white transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCartItem}
                className="flex-1 py-4 bg-blue-900 border-2 border-blue-900 rounded-xl font-bold text-white hover:bg-blue-800 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10"
              >
                Confirm
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
