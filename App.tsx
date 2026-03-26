import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Sidebar } from "./components/Sidebar";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
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
import { CreditDetail } from "./pages/CreditDetail";
import { Expenses } from "./pages/Expenses";
import { Suppliers } from "./pages/Suppliers";
import { Orders } from "./pages/Orders";
import { CreditOrders } from "./pages/CreditOrders";
import { AccountManagement } from "./pages/AccountManagement";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PrintReceipt from "./pages/PrintReceipt";
import { AIChat } from "./pages/AIChat";
import { Tutorial } from "./components/Tutorial";
import { HelpCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const token = localStorage.getItem("authToken");
  const location = useLocation();

  const getTourType = (): "pos" | "inventory" => {
    if (location.pathname.includes("/inventory")) return "inventory";
    return "pos";
  };

  const isPosPage = location.pathname === "/pos";

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Only show header and sidebar if authenticated and not on POS page */}
      {token && !isPosPage && (
        <>
          {/* Header */}
          <header className="bg-dark border-b border-primary/20 sticky top-0 z-30 print:hidden shadow-lg">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors mr-3"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 text-primary" />
                </button>
                <h1 className="text-lg font-bold text-primary tracking-wide">
                  Auto Shop
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRunTutorial(true)}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary flex items-center gap-2"
                  title="Start Tutorial"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-xs font-medium hidden sm:inline">
                    ဆော့ဝဲ လမ်းညွှန်
                  </span>
                </button>
                <LanguageSwitcher />
              </div>
            </div>
          </header>

          <Tutorial
            run={runTutorial}
            onFinish={() => setRunTutorial(false)}
            tourType={getTourType()}
          />

          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      {/* For POS page, still register Sidebar but it will be toggled by POS-internal button if we want, or just let POS manage it */}
      {token && isPosPage && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/pos" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POS setSidebarOpen={setSidebarOpen} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute>
                <Warehouse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse/:id"
            element={
              <ProtectedRoute>
                <WarehouseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront"
            element={
              <ProtectedRoute>
                <Storefront />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront/:id"
            element={
              <ProtectedRoute>
                <StorefrontDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing"
            element={
              <ProtectedRoute>
                <Purchasing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-orders"
            element={
              <ProtectedRoute>
                <CreditOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits/:id"
            element={
              <ProtectedRoute>
                <CreditDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute>
                <AIChat />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/print-receipt/:orderId" element={<PrintReceipt />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <Toaster position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
};

export default App;
