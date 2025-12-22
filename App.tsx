import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { POS } from "./pages/POS";
import { Warehouse } from "./pages/Warehouse";
import { WarehouseDetail } from "./pages/WarehouseDetail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Inventory } from "./pages/Inventory";
import { Purchasing } from "./pages/Purchasing";
import { Credits } from "./pages/Credits";
import { Expenses } from "./pages/Expenses";
import { Suppliers } from "./pages/Suppliers";

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" richColors />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 ml-64 p-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/warehouse/:id" element={<WarehouseDetail />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
