import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  code?: string;
  qty: number;
  price: number;
}

interface ReceiptData {
  invoiceNumber: string;
  storefrontName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  change?: number;
  note?: string;
}

const PrintReceipt: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get receipt data from localStorage or URL params
    const storedData = localStorage.getItem(`receipt_${orderId}`);
    console.log(`receipt_${orderId}`);
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setReceiptData(data);
      } catch (error) {
        console.error("Failed to parse receipt data:", error);
        toast.error("Failed to load receipt data");
      }
    } else {
      // Try to get from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get("data");
      if (dataParam) {
        try {
          const data = JSON.parse(atob(dataParam));
          setReceiptData(data);
        } catch (error) {
          console.error("Failed to parse URL data:", error);
          toast.error("Failed to load receipt data");
        }
      }
    }
    setLoading(false);
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(-1);
    localStorage.removeItem(`receipt_${orderId}`);
  };

  // Auto show print dialog when page loads and navigate back after print
  useEffect(() => {
    if (receiptData) {
      // Immediately trigger print dialog
      setTimeout(() => {
        window.print();
        // Navigate back after print dialog is closed
        setTimeout(() => {
          navigate(-1);
          localStorage.removeItem(`receipt_${orderId}`);
        }, 100);
      }, 100);
    }
  }, [receiptData, navigate, orderId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🧾</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Receipt Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The requested receipt could not be found or has expired.
          </p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:bg-white print-page-wrapper">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            visibility: visible !important;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .voucher-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: white !important;
          }
          .print-page-wrapper {
            visibility: visible !important;
          }
        }
        @media screen {
          body {
            background: #f5f5f5;
          }
          .voucher-container {
            max-width: 210mm;
            margin: 20px auto;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            min-height: 297mm;
            padding: 20mm;
          }
          .print-page-wrapper {
            visibility: hidden !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #1E90FF;
          color: white;
          text-align: center;
          padding: 12px;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 12px;
        }
        th:first-child { text-align: left; }
        th:last-child { text-align: right; }
        td {
          padding: 12px;
          background-color: #E8E8E8;
          color: #000;
          font-size: 13px;
          border-bottom: 3px solid white;
        }
        td:first-child { text-align: left; }
        td:nth-child(2) { text-align: left; }
        td:nth-child(3) { text-align: center; }
        td:nth-child(4) { text-align: center; }
        td:last-child { text-align: right; font-weight: 600; }
      `}</style>

      {/* Header - Hidden during print */}
      <div className="no-print bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 mb-6">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Print Preview
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-primary-blue text-white px-8 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 font-bold"
            >
              🖨️ Print Now
            </button>
            <button
              onClick={handleBack}
              className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-all font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="voucher-container">
        {/* Company Header */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <img
              src="/topnotch.png"
              alt="TopNotch Logo"
              className="mx-auto"
              style={{ width: "120px", height: "120px", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-bold mb-1">INVOICE TO :</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold mb-1">
              INVOICE NO : {receiptData.invoiceNumber}
            </p>
            <p className="text-sm font-bold">
              DATE: {formatDate(receiptData.date)}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>NO</th>
                <th style={{ width: "45%" }}>ITEM DESCRIPTION</th>
                <th style={{ width: "15%" }}>PRICE</th>
                <th style={{ width: "15%" }}>QTY.</th>
                <th style={{ width: "15%" }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.price.toLocaleString()}</td>
                  <td>{item.qty}</td>
                  <td>{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary and Notes */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <p className="text-sm font-bold mb-2">Payment Info:</p>
              <p className="text-sm">Method: {receiptData.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm font-bold mb-2">Terms & Conditions</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span>SUB TOTAL:</span>
              <span>{receiptData.subtotal.toLocaleString()}</span>
            </div>
            {receiptData.discountPercent > 0 && (
              <div className="flex justify-between mb-2 text-sm">
                <span>DISCOUNT:</span>
                <span>
                  -
                  {(
                    (receiptData.subtotal * receiptData.discountPercent) /
                    100
                  ).toLocaleString()}
                </span>
              </div>
            )}
            <div
              className="flex justify-between py-3 px-4 font-bold text-base text-white"
              style={{ backgroundColor: "#1E90FF" }}
            >
              <span>TOTAL:</span>
              <span>{receiptData.total.toLocaleString()} MMK</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-lg font-bold italic mb-1">
            Thank you for your business!
          </p>
          <div className="border-t border-gray-300 mt-8 pt-4">
            <p className="text-xs text-right">
              Authorised Sign: _________________
            </p>
          </div>
        </div>

        {/* Contact Bar */}
        <div
          className="mt-6 py-3 px-4 flex justify-between text-white text-xs"
          style={{ backgroundColor: "#000" }}
        >
          <span>Contact Us: 09960780006 www.topnotchmm.com</span>
          <span>TopNotch</span>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
