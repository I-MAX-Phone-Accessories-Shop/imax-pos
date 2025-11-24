import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Edit, AlertCircle } from 'lucide-react';
import { Product, ProductCategory } from '../types';

export const Inventory: React.FC = () => {
  const { products, addProduct, updateProduct } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: ProductCategory.PHONE_COVER,
    stockWarehouse: 0,
    stockShop: 0,
    costPrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 5
  });

  const handleSave = () => {
    if (!formData.name || !formData.sellingPrice) return alert("Name and Selling Price required");
    
    if (editingId) {
      updateProduct(editingId, formData);
    } else {
      addProduct({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as Product);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', category: ProductCategory.PHONE_COVER, stockWarehouse: 0, stockShop: 0, costPrice: 0, sellingPrice: 0, lowStockThreshold: 5 });
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData(p);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Product Inventory</h1>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
            + Add Product
        </button>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Whse</th>
              <th className="px-4 py-3 text-right">Shop</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.category}</td>
                <td className="px-4 py-3 text-right text-slate-400">{p.costPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{p.sellingPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{p.stockWarehouse}</td>
                <td className="px-4 py-3 text-right">
                    <span className={`${p.stockShop < p.lowStockThreshold ? 'text-red-600 font-bold flex items-center justify-end gap-1' : ''}`}>
                       {p.stockShop < p.lowStockThreshold && <AlertCircle className="w-3 h-3"/>} {p.stockShop}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500">Name</label>
                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500">Category</label>
                <select className="w-full border rounded p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}>
                    {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500">Low Stock Alert</label>
                <input type="number" className="w-full border rounded p-2" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500">Cost Price</label>
                <input type="number" className="w-full border rounded p-2" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500">Selling Price</label>
                <input type="number" className="w-full border rounded p-2" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};