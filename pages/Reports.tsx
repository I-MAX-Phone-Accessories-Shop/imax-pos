import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Reports: React.FC = () => {
  const { sales, products, expenses } = useApp();

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => {
    const cost = s.items.reduce((cSum, item) => {
        const p = products.find(prod => prod.id === item.productId);
        return cSum + ((p?.costPrice || 0) * item.qty);
    }, 0);
    return sum + (s.total - cost);
  }, 0);
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalProfit - totalExpenses;

  // Data for Category Pie Chart
  const categoryData = sales.flatMap(s => s.items).reduce((acc: any, item) => {
      const p = products.find(prod => prod.id === item.productId);
      const cat = p?.category || 'Other';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += item.qty;
      return acc;
  }, {});

  const pieData = Object.keys(categoryData).map(key => ({ name: key, value: categoryData[key] }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Data for Sales Trend (Dummy logical grouping for MVP - grouped by sale count/sequence as date parsing is complex for demo)
  const salesData = sales.slice(0, 10).reverse().map(s => ({
      name: s.invoiceNumber.split('-')[2], // Use random part as ID
      amount: s.total
  }));

  return (
    <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow border border-primary/20">
                <p className="text-slate-500 text-xs uppercase font-bold">Total Sales</p>
                <p className="text-2xl font-bold text-slate-900">{totalSales.toLocaleString()} MMK</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-green-100">
                <p className="text-slate-500 text-xs uppercase font-bold">Gross Profit</p>
                <p className="text-2xl font-bold text-green-600">{totalProfit.toLocaleString()} MMK</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-red-100">
                <p className="text-slate-500 text-xs uppercase font-bold">Expenses</p>
                <p className="text-2xl font-bold text-red-500">{totalExpenses.toLocaleString()} MMK</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow border border-indigo-100">
                <p className="text-slate-500 text-xs uppercase font-bold">Net Profit</p>
                <p className="text-2xl font-bold text-indigo-600">{netProfit.toLocaleString()} MMK</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border h-80">
                <h3 className="font-bold text-slate-700 mb-4">Sales by Category</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border h-80">
                <h3 className="font-bold text-slate-700 mb-4">Recent Sales Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};