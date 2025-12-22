import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Shield, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, setUserRole, logs } = useApp();

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">System Settings</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" /> Role Simulation
        </h2>
        <p className="text-slate-600 mb-4 text-sm">
            Toggle your active role to test permissions. <br/>
            <span className="font-semibold">Staff</span>: Cannot Purchase, Cannot Adjust Stock, Max 20% discount.
        </p>
        
        <div className="flex gap-4">
            <button 
                onClick={() => setUserRole(Role.ADMIN)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${currentUser.role === Role.ADMIN ? 'border-primary bg-primary/10 text-primary-700 font-bold' : 'border-slate-200 text-slate-600'}`}
            >
                Admin (Owner)
            </button>
            <button 
                onClick={() => setUserRole(Role.STAFF)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${currentUser.role === Role.STAFF ? 'border-primary bg-primary/10 text-primary-700 font-bold' : 'border-slate-200 text-slate-600'}`}
            >
                Staff
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Audit Logs
        </h2>
        <div className="overflow-auto max-h-[400px] bg-slate-50 rounded-lg border p-2">
            {logs.map(log => (
                <div key={log.id} className="p-3 border-b border-slate-200 last:border-0 text-sm">
                    <div className="flex justify-between mb-1">
                        <span className="font-bold text-slate-700">{log.action}</span>
                        <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                    <p className="text-xs text-primary mt-1">User: {log.user}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};