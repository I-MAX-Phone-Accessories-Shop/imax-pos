import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PieChart } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { expenses, addExpense } = useApp();
  const [form, setForm] = useState({ title: '', amount: 0, category: 'General' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.amount <= 0) return;
    addExpense({
        ...form,
        date: new Date().toISOString()
    });
    setForm({ title: '', amount: 0, category: 'General' });
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <PieChart className="w-6 h-6 text-red-500" /> Shop Expenses
            </h1>
            <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Title</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {expenses.map(e => (
                            <tr key={e.id}>
                                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{e.title} <span className="text-xs text-slate-400 bg-slate-100 px-1 rounded ml-1">{e.category}</span></td>
                                <td className="px-4 py-3 text-right font-medium">{e.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h2 className="font-bold text-lg mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500">Title</label>
                    <input className="w-full border rounded p-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500">Amount</label>
                    <input type="number" className="w-full border rounded p-2" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500">Category</label>
                    <select className="w-full border rounded p-2" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option>General</option>
                        <option>Utilities</option>
                        <option>Salary</option>
                        <option>Maintenance</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">Record Expense</button>
            </form>
        </div>
    </div>
  );
};