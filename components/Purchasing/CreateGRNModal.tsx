import React, { useState } from "react";
import { Modal } from "../Modal";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { createGRN } from "../../services/Purchase/createGRN";
import { toast } from "sonner";

interface ExtendedGRNItem {
  productId: string;
  productCode: string;
  name: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyGood: number;
  qtyBad: number;
  costPrice: number;
}

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrders: ApiPurchaseOrder[];
  suppliers: Supplier[];
  onSuccess: () => void;
}

export const CreateGRNModal: React.FC<CreateGRNModalProps> = ({
  isOpen,
  onClose,
  purchaseOrders,
  suppliers,
  onSuccess,
}) => {
  const [selectedPOId, setSelectedPOId] = useState("");
  const [grnItems, setGRNItems] = useState<ExtendedGRNItem[]>([]);
  const [grnNote, setGRNNote] = useState("");
  const [grnDate, setGrnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingPOs = purchaseOrders.filter((p) => {
    const status = p.status?.toLowerCase();
    return status === "arrived";
  });

  const selectedPO = purchaseOrders.find((p) => p._id === selectedPOId);

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(
      (s) => s.id === supplierId || s._id === supplierId
    );
    return supplier ? supplier.supplierName : "Unknown Supplier";
  };

  const loadPOItems = () => {
    if (!selectedPOId) return;
    const po = purchaseOrders.find((p) => p._id === selectedPOId);
    if (!po) return;

    const grnItemsForPO: ExtendedGRNItem[] = po.products.map((item) => ({
      productId: item.inventoryId,
      productCode: item.productCode || "",
      name: item.productName,
      qtyOrdered: item.purchaseQuantity,
      qtyReceived: item.purchaseQuantity,
      qtyGood: item.purchaseQuantity,
      qtyBad: 0,
      costPrice: item.buyingPrice,
    }));

    setGRNItems(grnItemsForPO);
  };

  const updateGRNItem = (
    index: number,
    field: keyof ExtendedGRNItem,
    value: number
  ) => {
    setGRNItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "qtyReceived") {
        item.qtyReceived = value;
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

  const resetForm = () => {
    setSelectedPOId("");
    setGRNItems([]);
    setGRNNote("");
    setGrnDate(new Date().toISOString().split("T")[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitGRN = async () => {
    if (!selectedPOId) {
      toast.error("Please select a Purchase Order");
      return;
    }

    if (grnItems.length === 0) {
      toast.error("Please load PO items first");
      return;
    }

    for (const item of grnItems) {
      if (item.qtyReceived !== item.qtyGood + item.qtyBad) {
        toast.error(
          `For ${item.name}: Received quantity must equal Good + Bad quantities`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        purchasingId: selectedPOId,
        lineItems: grnItems.map((item) => ({
          productCode: item.productCode,
          goodQuantity: item.qtyGood,
          badQuantity: item.qtyBad,
        })),
        grnDate: grnDate,
        notes: grnNote,
      };

      const result = await createGRN(payload);

      if (result.success) {
        toast.success("GRN Created Successfully!");
        resetForm();
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || "Failed to create GRN");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating GRN");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Goods Received Note"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - PO Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Purchase Order
            </label>
            <select
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={selectedPOId}
              onChange={(e) => {
                setSelectedPOId(e.target.value);
                setGRNItems([]);
              }}
            >
              <option value="">Select PO...</option>
              {pendingPOs.map((po) => (
                <option key={po._id} value={po._id}>
                  PO-{po.createdAt.split("T")[0]} -{" "}
                  {getSupplierName(po.supplierId)} ({po.status})
                </option>
              ))}
            </select>
          </div>

          {selectedPO && (
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-semibold text-slate-800 mb-3">PO Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-medium">
                    {getSupplierName(selectedPO.supplierId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium">
                    {new Date(selectedPO.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-medium">
                    {selectedPO.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Products:</span>
                  <span className="font-medium">
                    {selectedPO.products.length} item(s)
                  </span>
                </div>
              </div>
              <button
                onClick={loadPOItems}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Load PO Items
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              GRN Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={grnDate}
              onChange={(e) => setGrnDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={grnNote}
              onChange={(e) => setGRNNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Right Panel - GRN Items */}
        <div className="flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-3">
            GRN Items - Check & Separate Good/Bad
          </h3>
          <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 p-4">
            {grnItems.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                Select a PO and click "Load PO Items" to start
              </div>
            ) : (
              <div className="space-y-4">
                {grnItems.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="font-semibold text-slate-800 mb-3">
                      {item.name}{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        ({item.productCode})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="bg-slate-50 p-2 rounded">
                        <label className="text-xs text-slate-500">
                          Ordered:
                        </label>
                        <div className="font-semibold">{item.qtyOrdered}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <label className="text-xs text-slate-500">Cost:</label>
                        <div className="font-semibold">
                          {item.costPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">
                          Received Qty:
                        </label>
                        <input
                          type="number"
                          className="w-full border rounded-lg p-2 text-sm"
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">
                            Good:
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2 text-sm bg-green-50 focus:ring-green-500"
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
                            className="w-full border rounded-lg p-2 text-sm bg-red-50 focus:ring-red-500"
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
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠ Received must equal Good + Bad
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={submitGRN}
              disabled={grnItems.length === 0 || !selectedPOId || isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create GRN"}
            </button>
            <p className="text-xs text-slate-500 text-center">
              Only good items will be added to Warehouse. Bad items are logged
              but not added to stock.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
