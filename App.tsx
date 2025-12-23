import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { POS } from "./pages/POS";
import { Warehouse } from "./pages/Warehouse";
import { WarehouseDetail } from "./pages/WarehouseDetail";
import { Storefront } from "./pages/Storefront";
import { StorefrontDetail } from "./pages/StorefrontDetail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Inventory } from "./pages/Inventory";
import { Purchasing } from "./pages/Purchasing";
import { Credits } from "./pages/Credits";
import { Expenses } from "./pages/Expenses";
import { Suppliers } from "./pages/Suppliers";
import { Orders } from "./pages/Orders";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="bg-dark border-b border-primary/20 sticky top-0 z-30 print:hidden shadow-lg">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors mr-3"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          {/* <img
            src="/imaslogo.jpg"
            alt="IMAS Logo"
            className="w-10 h-10 object-contain rounded-lg mr-2 shadow-md"
          /> */}
          <h1 className="text-lg font-bold text-primary tracking-wide">
            IMAS POS
          </h1>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/warehouse/:id" element={<WarehouseDetail />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="/storefront/:id" element={<StorefrontDetail />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchasing" element={<Purchasing />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </main>
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
