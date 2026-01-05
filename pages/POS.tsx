import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  Printer,
  X,
  Store,
  RefreshCw,
  Loader2,
  ChevronDown,
  User,
} from "lucide-react";
import { toast } from "sonner";
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
import { useLanguage } from "../context/LanguageContext";

// Payment methods
enum PaymentMethod {
  CASH = "Cash",
  KBZ_PAY = "KBZPay",
  WAVE_PAY = "WavePay",
  AYA_PAY = "AYA Pay",
  UAB_PAY = "UAB Pay",
  BANK_TRANSFER = "Bank Transfer",
}

interface CartItem {
  stockItem: StorefrontStockItem;
  qty: number;
}

export const POS: React.FC = () => {
  const { t } = useLanguage();

  // Data State
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStorefrontMenu, setShowStorefrontMenu] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

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
          (sf) => sf.status === "active"
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
      console.error("Error loading initial data:", error);
      toast.error(t("pos.failedToLoadData"));
    } finally {
      setLoading(false);
    }

    // Load credit personas separately
    loadCreditPersonas();
  };

  const loadCreditPersonas = async () => {
    try {
      const cpResponse = await fetchCreditPersonas();
      console.log("Credit personas response:", cpResponse);
      if (cpResponse.success && cpResponse.data) {
        const activePersonas = cpResponse.data.filter((p) => !p.blacklist);
        console.log("Active credit personas:", activePersonas);
        setCreditPersonas(activePersonas);
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
    }
  };

  const loadStockItems = async () => {
    try {
      const response = await fetchStorefrontStock();
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
    const matchesStorefront = item.storefrontId?._id === selectedStorefrontId;
    const matchesSearch = item.inventoryId?.productName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      item.inventoryId?.category === selectedCategory;

    return matchesStorefront && matchesSearch && matchesCategory;
  });

  // Get unique categories from current storefront products
  const categories = [
    ...new Set(
      allStockItems
        .filter((item) => item.storefrontId?._id === selectedStorefrontId)
        .map((item) => item.inventoryId?.category)
        .filter(Boolean)
    ),
  ].sort();

  const addToCart = (stockItem: StorefrontStockItem) => {
    if (stockItem.availableQuantity <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.stockItem._id === stockItem._id
      );
      if (existing) {
        if (existing.qty + 1 > stockItem.availableQuantity) {
          toast.error(t("pos.cannotExceedStock"));
          return prev;
        }
        return prev.map((item) =>
          item.stockItem._id === stockItem._id
            ? { ...item, qty: item.qty + 1 }
            : item
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
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.stockItem._id !== id));
  };

  // Calculate totals
  const getItemPrice = (item: StorefrontStockItem) => {
    // Use sellingPrice from inventory if available, otherwise use placeholder
    return item.inventoryId.sellingPrice || 10000; // Default to 10000 MMK if not available
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item.stockItem) * item.qty,
    0
  );
  const total = subtotal * (1 - discount / 100);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Only validate paid amount for "paid" payment type, not for "credit"
    if (paymentType === "paid" && paidAmount < total) {
      toast.error(t("pos.paidAmountError"));
      return;
    }

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
      };

      const discountAmount = (subtotal * discount) / 100;

      const orderPayload = {
        storefrontId: selectedStorefrontId,
        ordersProducts: cart.map((item) => ({
          inventoryId: item.stockItem.inventoryId._id,
          quantity: item.qty,
        })),
        subTotal: subtotal,
        discount: discountAmount,
        finalAmount: total,
        paidAmount: paidAmount,
        paymentType: paymentType,
        paymentMethod: paymentMethodMap[paymentMethod],
        ...(paymentType === "credit" && selectedCreditPersonId
          ? { creditPersonId: selectedCreditPersonId }
          : {}),
      };

      const result = await createOrder(orderPayload);

      if (result.success) {
        const selectedStorefront = storefronts.find(
          (sf) => sf._id === selectedStorefrontId
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
          paidAmount,
          change: paidAmount - total,
          paymentMethod,
          note,
        };

        setShowReceipt(receiptData);
        setCart([]);
        setDiscount(0);
        setNote("");
        setPaidAmount(0);
        setPaymentMethod(PaymentMethod.CASH);
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
      <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
        {/* Search Bar with Storefront Badge */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("pos.searchProducts")}
                className="w-full pl-10 pr-4 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            filteredProducts.length.toString()
          )}
        </div>

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
                className={`bg-white p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col ${
                  stockItem.availableQuantity === 0
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
                <div className="mt-4 flex justify-between items-end">
                  <span className="font-bold text-primary-600">
                    {getItemPrice(stockItem).toLocaleString()} MMK
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
          <h2 className="font-bold text-lg">{t("pos.currentSale")}</h2>
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
            cart.map((item) => (
              <div
                key={item.stockItem._id}
                className="flex justify-between items-start border-b border-gray-200 pb-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.stockItem.inventoryId.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(getItemPrice(item.stockItem) * item.qty).toLocaleString()}{" "}
                    MMK
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => updateQty(item.stockItem._id, -1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.stockItem._id, 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.stockItem._id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded ml-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
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
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-btn-primary hover:bg-btn-primary-hover text-dark py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t("pos.proceedToCheckout")}
          </button>
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
                  {t("pos.checkout")}
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
                  <option value={PaymentMethod.CASH}>{t("pos.cash")}</option>
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
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.discount")} (%)
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

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.paidAmount")} (MMK){" "}
                  {paymentType === "paid" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={paidAmount || ""}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  placeholder={t("pos.enterPaidAmount")}
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
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      {t("common.discount")} ({discount}%)
                    </span>
                    <span>
                      -{((subtotal * discount) / 100).toLocaleString()} MMK
                    </span>
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

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="font-bold text-gray-800">
                {t("pos.receiptPreview")}
              </h3>
              <button
                onClick={() => setShowReceipt(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Thermal Receipt Layout */}
            <div
              id="receipt-content"
              className="font-mono text-xs p-4 border border-gray-200 bg-gray-50 rounded-lg"
            >
              <div className="text-center mb-4">
                <h1 className="font-bold text-lg uppercase text-gray-800">
                  {showReceipt.storefrontName}
                </h1>
                <p className="text-gray-500">IMAS POS System</p>
              </div>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              <p>
                {t("pos.orderNumber")}: {showReceipt.invoiceNumber}
              </p>
              <p>
                {t("common.date")}:{" "}
                {new Date(showReceipt.date).toLocaleString()}
              </p>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-1">{t("pos.items")}</th>
                    <th className="pb-1 text-right">{t("common.price")}</th>
                  </tr>
                </thead>
                <tbody>
                  {showReceipt.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>
                        {item.name}{" "}
                        <span className="text-[10px]">x{item.qty}</span>
                      </td>
                      <td className="text-right">
                        {(item.price * item.qty).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              <div className="flex justify-between">
                <span>{t("common.subtotal")}</span>
                <span>{showReceipt.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.discount")}</span>
                <span>{showReceipt.discountPercent}%</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1">
                <span>{t("common.total").toUpperCase()}</span>
                <span>{showReceipt.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>{t("pos.payment")}</span>
                <span>{showReceipt.paymentMethod}</span>
              </div>
              {showReceipt.paidAmount && (
                <div className="flex justify-between mt-1">
                  <span>{t("common.paid")}</span>
                  <span>{showReceipt.paidAmount.toLocaleString()}</span>
                </div>
              )}
              {showReceipt.change > 0 && (
                <div className="flex justify-between mt-1 font-bold">
                  <span>{t("common.change")}</span>
                  <span>{showReceipt.change.toLocaleString()}</span>
                </div>
              )}
              {showReceipt.note && (
                <div className="mt-2 text-[10px]">
                  {t("common.notes")}: {showReceipt.note}
                </div>
              )}
              <div className="text-center mt-4 text-[10px] text-gray-500">
                {t("pos.thankYou")}
                <br />
                {t("pos.receiptFooter")}
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
                setShowReceipt(null);
              }}
              className="w-full mt-4 bg-btn-secondary hover:bg-btn-secondary-hover text-primary py-2 rounded-lg flex justify-center items-center gap-2 transition-colors no-print font-medium"
            >
              <Printer className="w-4 h-4" /> {t("pos.print")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
