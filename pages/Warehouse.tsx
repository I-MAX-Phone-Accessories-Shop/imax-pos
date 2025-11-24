import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRightLeft, Package } from 'lucide-react';

export const Warehouse: React.FC = () => {
  const { products, transferStock } = useApp();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);

  const handleTransfer = () => {
    if (!selectedProduct) return;
    transferStock(selectedProduct, qty);
    setQty(1);
    setSelectedProduct('');
    alert("Transfer Successful!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <Package className="w-6 h-6 text-blue-600" /> Warehouse Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Transfer Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <ArrowRightLeft className="w-5 h-5 mr-2 text-slate-500" /> 
            Transfer to Shop
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Select Product</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Wh: {p.stockWarehouse})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Quantity</label>
              <input 
                type="number" 
                min="1"
                className="w-full border rounded-lg p-2"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>

            <button 
              onClick={handleTransfer}
              disabled={!selectedProduct}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Confirm Transfer
            </button>
          </div>
        </div>

        {/* Warehouse Inventory View */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Warehouse Stock Level</h2>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Warehouse</th>
                  <th className="px-4 py-2 text-right">Shop</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">{p.stockWarehouse}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{p.stockShop}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};