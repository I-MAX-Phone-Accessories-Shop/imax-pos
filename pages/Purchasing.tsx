import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Plus } from 'lucide-react';

export const Purchasing: React.FC = () => {
  const { products, addStockToWarehouse } = useApp();
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState<{ productId: string; qty: number; cost: number }[]>([]);
  
  // Temp input state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);

  const addItem = () => {
    if (!selectedProduct || qty <= 0) return;
    setItems(prev => [...prev, { productId: selectedProduct, qty, cost }]);
    setSelectedProduct('');
    setQty(1);
    setCost(0);
  };

  const submitPurchase = () => {
    if (!supplier || items.length === 0) return;
    addStockToWarehouse(supplier, items);
    setSupplier('');
    setItems([]);
    alert("Stock Added to Warehouse!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <ShoppingBag className="w-6 h-6 text-green-600" /> Purchasing (Stock In)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold text-lg mb-4">New Purchase Entry</h2>
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Supplier Name</label>
                <input className="w-full border rounded p-2" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Main Distributor" />
              </div>
              
              <div className="border-t pt-4 mt-4">
                 <label className="block text-xs font-bold text-slate-500 mb-2">Add Item to Purchase</label>
                 <div className="flex gap-2 mb-2">
                    <select className="flex-1 border rounded p-2 text-sm" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-2">
                     <input type="number" className="w-24 border rounded p-2 text-sm" placeholder="Qty" value={qty} onChange={e => setQty(Number(e.target.value))} />
                     <input type="number" className="flex-1 border rounded p-2 text-sm" placeholder="Cost Price" value={cost} onChange={e => setCost(Number(e.target.value))} />
                     <button onClick={addItem} className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200"><Plus className="w-5 h-5" /></button>
                 </div>
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
             <h2 className="font-bold text-lg mb-4">Purchase Summary</h2>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b"><th>Item</th><th>Qty</th><th>Cost</th></tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => {
                            const p = products.find(x => x.id === item.productId);
                            return (
                                <tr key={i} className="border-b">
                                    <td className="py-2">{p?.name}</td>
                                    <td>{item.qty}</td>
                                    <td>{item.cost}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
             </div>
             <button 
                onClick={submitPurchase}
                disabled={items.length === 0 || !supplier}
                className="w-full bg-green-600 text-white py-3 rounded-lg mt-4 hover:bg-green-700 disabled:opacity-50"
            >
                Confirm Stock In
             </button>
        </div>
      </div>
    </div>
  );
};