import React, { useState } from "react";
import { PurchaseOrder, GRNItem } from "../../types";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";

interface GRNManagerProps {
  purchaseOrders: PurchaseOrder[];
}

export const GRNManager: React.FC<GRNManagerProps> = ({ purchaseOrders }) => {
  const { createGRN } = useApp();
  const [selectedPOId, setSelectedPOId] = useState("");
  const [grnItems, setGRNItems] = useState<GRNItem[]>([]);
  const [grnNote, setGRNNote] = useState("");

  const pendingPOs = purchaseOrders.filter(
    (p) => p.status === "PENDING" || p.status === "PARTIALLY_RECEIVED"
  );

  const selectedPO = purchaseOrders.find((p) => p.id === selectedPOId);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="font-bold text-lg mb-4">Create Goods Received Note</h2>
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
                      <label className="text-xs text-slate-500">Ordered:</label>
                      <div className="font-semibold">{item.qtyOrdered}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Cost:</label>
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
          Only good items will be added to Warehouse 1. Bad items are logged but
          not added to stock.
        </p>
      </div>
    </div>
  );
};
