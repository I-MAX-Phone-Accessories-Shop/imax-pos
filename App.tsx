import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { DemoBanner } from "./components/DemoBanner";
import { POS } from "./pages/POS";
import { Warehouse } from "./pages/Warehouse";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Inventory } from "./pages/Inventory";
import { Purchasing } from "./pages/Purchasing";
import { Credits } from "./pages/Credits";
import { Expenses } from "./pages/Expenses";

const AppContent: React.FC = () => {
  const [currentPage, setPage] = useState("pos");

  const renderPage = () => {
    switch (currentPage) {
      case "pos":
        return <POS />;
      case "warehouse":
        return <Warehouse />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      case "inventory":
        return <Inventory />;
      case "purchasing":
        return <Purchasing />;
      case "credits":
        return <Credits />;
      case "expenses":
        return <Expenses />;
      default:
        return <POS />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* <DemoBanner /> */}
      <div className="flex flex-1 relative">
        <Sidebar currentPage={currentPage} setPage={setPage} />
        <main className="flex-1 ml-64 p-0 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
