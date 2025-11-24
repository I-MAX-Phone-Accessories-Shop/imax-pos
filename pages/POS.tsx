import React, { useState, useEffect, useRef } from "react";
import { Search, Trash2, Plus, Minus, Printer, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Product, ProductCategory, PaymentMethod, Role } from "../types";

export const POS: React.FC = () => {
  const { products, processSale, customers } = useApp();
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [discount, setDiscount] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState<any>(null); // Stores sale object for receipt
  const [note, setNote] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stockShop <= 0) {
      alert("Out of stock in Shop! Transfer from Warehouse first.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stockShop) {
          alert("Cannot exceed shop stock.");
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === id) {
          const newQty = item.qty + delta;
          if (newQty > item.product.stockShop) return item; // Block logic
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.qty,
    0
  );
  const total = subtotal * (1 - discount / 100);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.CREDIT && !selectedCustomerId) {
      alert("Please select a customer for credit sales.");
      return;
    }

    const result = processSale(
      cart.map((i) => ({ ...i.product, qty: i.qty })),
      discount,
      paymentMethod,
      selectedCustomerId || undefined,
      note
    );

    if (result.success) {
      // Generate a temp receipt object for display
      const receiptData = {
        date: new Date().toISOString(),
        invoiceNumber: "Generating...", // In real app, get from response
        items: cart.map((i) => ({
          name: i.product.name,
          qty: i.qty,
          price: i.product.sellingPrice,
        })),
        subtotal,
        discountPercent: discount,
        total,
        paymentMethod,
        note,
      };
      setShowReceipt(receiptData);
      setCart([]);
      setDiscount(0);
      setNote("");
      setPaymentMethod(PaymentMethod.CASH);
      setSelectedCustomerId("");
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded-lg px-4 py-2 bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {Object.values(ProductCategory).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md hover:border-blue-300 flex flex-col ${
                product.stockShop === 0
                  ? "opacity-50 grayscale pointer-events-none"
                  : ""
              }`}
            >
              <div className="flex-1">
                <h3 className="font-medium text-slate-800 text-sm line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {product.category}
                </p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="font-bold text-blue-600">
                  {product.sellingPrice.toLocaleString()} MMK
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    product.stockShop < product.lowStockThreshold
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {product.stockShop} in Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white flex flex-col border-l shadow-lg h-[calc(100vh-4rem)] fixed right-0 bottom-0 top-10 lg:relative lg:top-0 lg:h-auto">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-bold text-lg text-slate-700">Current Sale</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">
              Cart is empty
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between items-start border-b pb-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.product.sellingPrice.toLocaleString()} x {item.qty}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="p-1 bg-slate-100 rounded hover:bg-slate-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="p-1 bg-slate-100 rounded hover:bg-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Payment Method
            </label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              {Object.values(PaymentMethod).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {paymentMethod === PaymentMethod.CREDIT && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Customer
              </label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full border rounded p-2 text-sm"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Serial number, backdate reason..."
            />
          </div>

          <div className="pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span>{subtotal.toLocaleString()} MMK</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Discount</span>
              <span className="text-green-600">
                -{((subtotal * discount) / 100).toLocaleString()} MMK
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 mt-2">
              <span>Total</span>
              <span>{total.toLocaleString()} MMK</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={cart.length === 0}
          >
            Charge {total.toLocaleString()} MMK
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 no-print">
              <h3 className="font-bold">Receipt Preview</h3>
              <button onClick={() => setShowReceipt(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Layout */}
            <div
              id="receipt-content"
              className="font-mono text-xs p-2 border border-gray-200 bg-gray-50"
            >
              <div className="text-center mb-4">
                <h1 className="font-bold text-lg uppercase">
                  MobileAx Accessories
                </h1>
                <p>123 Tech Street, Yangon</p>
                <p>Ph: 09-123456789</p>
              </div>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              <p>Inv: {showReceipt.invoiceNumber || "PENDING"}</p>
              <p>Date: {new Date().toLocaleString()}</p>
              <div className="border-b border-dashed border-gray-400 my-2"></div>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-right">Price</th>
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
                <span>Subtotal</span>
                <span>{showReceipt.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{showReceipt.discountPercent}%</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1">
                <span>TOTAL</span>
                <span>{showReceipt.total.toLocaleString()}</span>
              </div>
              <div className="text-center mt-4 text-[10px]">
                Thank you for shopping!
                <br />
                No refund, exchange within 3 days.
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
                setShowReceipt(null);
              }}
              className="w-full mt-4 bg-slate-800 text-white py-2 rounded flex justify-center items-center gap-2 hover:bg-slate-700 no-print"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
