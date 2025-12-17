import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ShoppingBag, Plus, FileText, PackageCheck } from "lucide-react";
import { PurchaseOrderItem, GRNItem, Supplier, Product } from "../types";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { createPurchase } from "../services/Purchase/createPurchase";
import { toast } from "sonner";

type TabType = "po" | "grn";

export const Purchasing: React.FC = () => {
  const { purchaseOrders = [], createPurchaseOrder, createGRN } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("po");

  // PO State
  const [poSupplierId, setPOSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [poItems, setPOItems] = useState<PurchaseOrderItem[]>([]);
  const [poSelectedProduct, setPOSelectedProduct] = useState("");
  const [poQty, setPOQty] = useState(1);
  const [poItemNote, setPOItemNote] = useState("");
  const [poNote, setPONote] = useState("");
  const [poNewProductName, setPONewProductName] = useState("");

  // Fetch Suppliers and Products
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Suppliers
        const supplierRes = await fetchSuppliers();
        if (supplierRes.success) {
          setSuppliers(supplierRes.data);
        }

        // Fetch Products
        const productRes = await fetchProducts();
        console.log(productRes);
        // Handle potentially different response structures
        if (productRes.success && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        } else if (Array.isArray(productRes)) {
          setProducts(productRes);
        } else if (productRes.data && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  console.log("products", products);

  // GRN State
  const [selectedPOId, setSelectedPOId] = useState("");
  const [grnItems, setGRNItems] = useState<GRNItem[]>([]);
  const [grnNote, setGRNNote] = useState("");

  const addPOItem = () => {
    if (!poSelectedProduct && !poNewProductName) return;
    if (poQty <= 0) return;

    let productId = poSelectedProduct;
    let productName = "";

    if (poSelectedProduct) {
      const product = products.find(
        (p) => (p._id || p.id) === poSelectedProduct
      );
      if (!product) return;
      productName = product.productName || product.name;
    } else {
      // New product - generate ID
      productId = `new-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      productName = poNewProductName;
    }

    const newItem: PurchaseOrderItem = {
      productId,
      name: productName,
      qty: poQty,
      costPrice: 0,
      note: poItemNote,
    };

    setPOItems((prev) => [...prev, newItem]);
    setPOSelectedProduct("");
    setPONewProductName("");
    setPOQty(1);
    setPOItemNote("");
  };

  const submitPO = async () => {
    if (!poSupplierId || poItems.length === 0) {
      toast.error("Please select supplier and add at least one item");
      return;
    }

    // Calculate total amount
    const totalAmount = poItems.reduce(
      (sum, item) => sum + item.qty * item.costPrice,
      0
    );

    const payload = {
      products: poItems.map((item) => ({
        inventoryId: item.productId,
        purchaseQuantity: item.qty,
      })),
      supplierId: poSupplierId,
      note: poNote,
      totalAmount,
    };

    try {
      const response = await createPurchase(payload);
      if (response.success) {
        toast.success("Purchase Order Created Successfully!");
        setPOSupplierId("");
        setPOItems([]);
        setPONote("");
      } else {
        toast.error(response.message || "Failed to create Purchase Order");
      }
    } catch (error: any) {
      console.error("Failed to create PO:", error);
      toast.error(
        error.message || "An error occurred while creating the Purchase Order"
      );
    }
  };

  const loadPOItems = () => {
    if (!selectedPOId) return;
    const po = purchaseOrders.find((p) => p.id === selectedPOId);
    if (!po) return;

    const grnItemsForPO: GRNItem[] = po.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      qtyOrdered: item.qty,
      qtyReceived: item.qty, // Default to ordered quantity
      qtyGood: item.qty, // Default all as good
      qtyBad: 0, // Default no bad items
      costPrice: item.costPrice,
    }));

    setGRNItems(grnItemsForPO);
  };

  const updateGRNItem = (
    index: number,
    field: keyof GRNItem,
    value: number
  ) => {
    setGRNItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "qtyReceived") {
        item.qtyReceived = value;
        // Auto-adjust good items if received is less than current good
        if (value < item.qtyGood) {
          item.qtyGood = value;
          item.qtyBad = 0;
        }
      } else if (field === "qtyGood") {
        item.qtyGood = Math.min(value, item.qtyReceived);
        item.qtyBad = item.qtyReceived - item.qtyGood;
      } else if (field === "qtyBad") {
        item.qtyBad = Math.min(value, item.qtyReceived);
        item.qtyGood = item.qtyReceived - item.qtyBad;
      }

      updated[index] = item;
      return updated;
    });
  };

  const submitGRN = () => {
    if (!selectedPOId) {
      toast.error("Please select a Purchase Order");
      return;
    }

    if (grnItems.length === 0) {
      toast.error("Please load PO items first");
      return;
    }

    // Validate that qtyReceived = qtyGood + qtyBad for all items
    for (const item of grnItems) {
      if (item.qtyReceived !== item.qtyGood + item.qtyBad) {
        toast.error(
          `For ${item.name}: Received quantity must equal Good + Bad quantities`
        );
        return;
      }
    }

    const result = createGRN(selectedPOId, grnItems, grnNote);
    if (result.success) {
      setSelectedPOId("");
      setGRNItems([]);
      setGRNNote("");
      toast.success(
        "GRN Created! Only good items have been added to warehouse."
      );
    } else {
      toast.error(result.message || "Failed to create GRN");
    }
  };

  const selectedPO = purchaseOrders.find((p) => p.id === selectedPOId);
  const pendingPOs = purchaseOrders.filter(
    (p) => p.status === "PENDING" || p.status === "PARTIALLY_RECEIVED"
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <ShoppingBag className="w-6 h-6 text-green-600" /> Purchasing Module
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("po")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "po"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4" /> Purchase Order (PO)
        </button>
        <button
          onClick={() => setActiveTab("grn")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "grn"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Goods Received Note (GRN)
        </button>
      </div>

      {/* PO Tab */}
      {activeTab === "po" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="font-bold text-lg mb-4">Create Purchase Order</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Supplier Name
                </label>
                <select
                  className="w-full border rounded p-2"
                  value={poSupplierId}
                  onChange={(e) => setPOSupplierId(e.target.value)}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id || supplier._id}
                      value={supplier.id || supplier._id}
                    >
                      {supplier.supplierName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Add Item to PO
                </label>
                <div className="mb-2">
                  <select
                    className="w-full border rounded p-2 text-sm mb-2"
                    value={poSelectedProduct}
                    onChange={(e) => {
                      setPOSelectedProduct(e.target.value);
                      setPONewProductName("");
                    }}
                  >
                    <option value="">Select Existing Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        <span>{p.productName}</span>
                      </option>
                    ))}
                  </select>
                  {/* <div className="text-xs text-slate-500 mb-1">OR</div>
                  <input
                    className="w-full border rounded p-2 text-sm"
                    value={poNewProductName}
                    onChange={(e) => {
                      setPONewProductName(e.target.value);
                      setPOSelectedProduct("");
                    }}
                    placeholder="Enter new product name"
                  /> */}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Quantity
                  </label>
                  <div className="flex  gap-2">
                    <input
                      type="number"
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Qty"
                      value={poQty}
                      onChange={(e) => setPOQty(Number(e.target.value))}
                      min="1"
                    />
                    <button
                      onClick={addPOItem}
                      className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  value={poNote}
                  onChange={(e) => setPONote(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
            <h2 className="font-bold text-lg mb-4">PO Summary</h2>
            <div className="flex-1 overflow-auto mb-4">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th>Item</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{item.name}</td>
                      <td>{item.qty}</td>
                    </tr>
                  ))}
                  {poItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center text-slate-400 py-4"
                      >
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {poNote && (
              <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
                <span className="font-semibold text-gray-600 block mb-1">
                  Order Note:
                </span>
                <p className="text-gray-800">{poNote}</p>
              </div>
            )}
            <button
              onClick={submitPO}
              disabled={poItems.length === 0 || !poSupplierId}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Create Purchase Order
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Note: PO does NOT update stock. Use GRN to receive goods.
            </p>
          </div>
        </div>
      )}

      {/* GRN Tab */}
      {activeTab === "grn" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="font-bold text-lg mb-4">
              Create Goods Received Note
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Select Purchase Order
                </label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedPOId}
                  onChange={(e) => {
                    setSelectedPOId(e.target.value);
                    setGRNItems([]);
                  }}
                >
                  <option value="">Select PO...</option>
                  {pendingPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} - {po.supplierName} (
                      {po.status === "PARTIALLY_RECEIVED"
                        ? "Partially Received"
                        : "Pending"}
                      )
                    </option>
                  ))}
                </select>
                {selectedPO && (
                  <div className="mt-2 p-3 bg-slate-50 rounded text-sm">
                    <div>
                      <strong>PO:</strong> {selectedPO.poNumber}
                    </div>
                    <div>
                      <strong>Supplier:</strong> {selectedPO.supplierName}
                    </div>
                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedPO.date).toLocaleDateString()}
                    </div>
                    <button
                      onClick={loadPOItems}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Load PO Items
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  value={grnNote}
                  onChange={(e) => setGRNNote(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
            <h2 className="font-bold text-lg mb-4">
              GRN Items - Check & Separate Good/Bad
            </h2>
            <div className="flex-1 overflow-auto mb-4">
              {grnItems.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  Select a PO and click "Load PO Items" to start
                </div>
              ) : (
                <div className="space-y-4">
                  {grnItems.map((item, index) => (
                    <div key={index} className="border rounded p-3 bg-slate-50">
                      <div className="font-semibold mb-2">{item.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-slate-500">
                            Ordered:
                          </label>
                          <div className="font-semibold">{item.qtyOrdered}</div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">
                            Cost:
                          </label>
                          <div className="font-semibold">
                            {item.costPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">
                            Received Qty:
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded p-1 text-sm"
                            value={item.qtyReceived}
                            onChange={(e) =>
                              updateGRNItem(
                                index,
                                "qtyReceived",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            max={item.qtyOrdered}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">
                              Good:
                            </label>
                            <input
                              type="number"
                              className="w-full border rounded p-1 text-sm bg-green-50"
                              value={item.qtyGood}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "qtyGood",
                                  Number(e.target.value)
                                )
                              }
                              min="0"
                              max={item.qtyReceived}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">
                              Bad:
                            </label>
                            <input
                              type="number"
                              className="w-full border rounded p-1 text-sm bg-red-50"
                              value={item.qtyBad}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "qtyBad",
                                  Number(e.target.value)
                                )
                              }
                              min="0"
                              max={item.qtyReceived}
                            />
                          </div>
                        </div>
                        {item.qtyReceived !== item.qtyGood + item.qtyBad && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠ Received must equal Good + Bad
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={submitGRN}
              disabled={grnItems.length === 0 || !selectedPOId}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Create GRN (Only Good Items to Warehouse)
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Only good items will be added to Warehouse 1. Bad items are logged
              but not added to stock.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
