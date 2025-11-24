import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentMethod } from '../types';
import { CreditCard, UserPlus } from 'lucide-react';

export const Credits: React.FC = () => {
  const { customers, addCustomer, recordPayment } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedCust, setSelectedCust] = useState<string | null>(null);

  const handleAddCustomer = () => {
    if (newCustomer.name) {
      addCustomer({ ...newCustomer });
      setIsAddOpen(false);
      setNewCustomer({ name: '', phone: '' });
    }
  };

  const handlePay = (id: string) => {
    if (paymentAmount <= 0) return;
    recordPayment(id, paymentAmount, PaymentMethod.CASH);
    setPaymentAmount(0);
    setSelectedCust(null);
    alert("Payment Recorded");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" /> Credit Ledger
        </h1>
        <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700"
        >
            <UserPlus className="w-4 h-4" /> New Customer
        </button>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Outstanding Balance</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                <td className={`px-4 py-3 text-right font-bold ${c.outstandingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {c.outstandingBalance.toLocaleString()} MMK
                </td>
                <td className="px-4 py-3 text-right">
                    {selectedCust === c.id ? (
                        <div className="flex items-center justify-end gap-2">
                            <input 
                                type="number" 
                                className="w-24 border rounded p-1 text-xs" 
                                placeholder="Amount"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(Number(e.target.value))}
                            />
                            <button onClick={() => handlePay(c.id)} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Pay</button>
                            <button onClick={() => setSelectedCust(null)} className="text-xs text-red-500">X</button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setSelectedCust(c.id)}
                            className="text-indigo-600 hover:underline text-xs font-medium"
                            disabled={c.outstandingBalance <= 0}
                        >
                            Record Payment
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white p-6 rounded-lg w-80">
                <h3 className="font-bold mb-4">Add Customer</h3>
                <input className="w-full border rounded p-2 mb-2" placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input className="w-full border rounded p-2 mb-4" placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                <button onClick={handleAddCustomer} className="w-full bg-indigo-600 text-white py-2 rounded">Save</button>
                <button onClick={() => setIsAddOpen(false)} className="w-full mt-2 text-slate-500 text-sm">Cancel</button>
             </div>
        </div>
      )}
    </div>
  );
};