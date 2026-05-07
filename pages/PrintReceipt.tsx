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
            padding: 5mm !important;
            background: white !important;
          }
          .print-page-wrapper {
            visibility: visible !important;
          }
        }
        @media screen {
          body {
            background: white;
          }
          .voucher-container {
            max-width: 210mm;
            margin: 20px auto;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            min-height: 297mm;
            padding: 20mm;
            border-radius: 8px;
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
        .text-primary-blue { color: #2216a8; }
        .bg-primary-blue { background-color: #2216a8; }
        .border-primary-blue { border-color: #2216a8; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
        }
        th {
          background-color: #2216a8;
          color: white;
          text-align: left;
          padding: 14px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 0.05em;
        }
        td {
          padding: 14px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
          font-size: 14px;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .summary-box {
          background-color: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .summary-row {
          display: flex;
          justify-content: flex-end;
          gap: 40px;
          padding: 6px 0;
        }
        .summary-label {
          font-weight: 600;
          color: #64748b;
          width: 140px;
        }
        .summary-value {
          font-weight: 700;
          color: #1e293b;
          text-align: right;
          width: 140px;
        }
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
        <div className="flex justify-between items-start mb-10 pb-10 border-b-2 border-slate-100">
          <div className="flex items-center gap-8">
            <img
              src="/topnotch.png"
              alt="TopNotch Logo"
              className="w-28 h-28 object-contain rounded-2xl shadow-xl border-4 border-white"
            />
            <div>
              <h1 className="text-4xl font-black text-primary-blue tracking-tighter mb-1">
                TopNotch Gadgets & IT
              </h1>
              <p className="text-slate-500 font-bold text-lg tracking-wide">
                Technology & Accessories
              </p>
              <div className="mt-4 space-y-1 text-slate-500 font-semibold text-sm">
                <p className="flex items-center gap-2">
                  📍 No.9 Second Floor, 54th Street
                </p>
                <p className="flex items-center gap-2 ml-5">
                  Upper Block, Pazundaung 11171
                </p>
                <p className="flex items-center gap-2 ml-5">Myanmar (Burma)</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-1 bg-primary-blue text-white font-black text-sm rounded-md mb-4 uppercase tracking-widest">
              Tax Invoice
            </div>
            <div className="space-y-1.5">
              <p className="text-slate-400 text-xs font-bold uppercase">
                Invoice Number
              </p>
              <p className="text-slate-800 font-black text-xl">
                #{receiptData.invoiceNumber}
              </p>
              <div className="pt-2">
                <p className="text-slate-400 text-xs font-bold uppercase">
                  Date & Time
                </p>
                <p className="text-slate-600 font-bold">
                  {formatDate(receiptData.date)} •{" "}
                  {formatTime(receiptData.date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer/Storefront Info */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Bill To / Storefront
            </h3>
            <p className="text-lg font-black text-slate-800">
              {receiptData.storefrontName}
            </p>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Standard Store Location
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Payment Status
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  receiptData.paymentMethod === "Cash"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {receiptData.paymentMethod}
              </span>
              <span className="text-slate-800 font-bold">Processed</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <table className="overflow-hidden rounded-xl">
            <thead>
              <tr>
                <th className="w-16 text-center">#</th>
                <th>Item Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-center font-bold text-slate-400">
                    {index + 1}
                  </td>
                  <td>
                    <div className="font-extrabold text-slate-800">
                      {item.name}
                    </div>
                    {item.code && (
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        Code: {item.code}
                      </div>
                    )}
                  </td>
                  <td className="text-center font-black text-slate-700">
                    {item.qty}
                  </td>
                  <td className="text-right font-semibold text-slate-600">
                    {item.price.toLocaleString()}
                  </td>
                  <td className="text-right font-black text-slate-900">
                    {(item.price * item.qty).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary and Notes */}
        <div className="grid grid-cols-2 gap-10">
          <div>
            {receiptData.note && (
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-dashed border-amber-200">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                  Special Notes
                </h4>
                <p className="text-slate-700 font-medium text-sm leading-relaxed">
                  {receiptData.note}
                </p>
              </div>
            )}
            <div className="mt-10 p-6 border-l-4 border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Terms & Conditions
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1.5 font-bold">
                <li>• No refund for sold items.</li>
                <li>• Exchange within 3 days with receipt.</li>
                <li>• Warranty covers manufacturing defects only.</li>
              </ul>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">
                {receiptData.subtotal.toLocaleString()} MMK
              </span>
            </div>

            {receiptData.discountPercent > 0 && (
              <div className="summary-row">
                <span className="summary-label text-red-500">
                  Discount ({receiptData.discountPercent}%)
                </span>
                <span className="summary-value text-red-500">
                  -{" "}
                  {(
                    (receiptData.subtotal * receiptData.discountPercent) /
                    100
                  ).toLocaleString()}{" "}
                  MMK
                </span>
              </div>
            )}

            <div className="summary-row py-4 my-2 border-y border-slate-200">
              <span className="text-lg font-black text-slate-800">TOTAL</span>
              <span className="text-2xl font-black text-primary-blue">
                {receiptData.total.toLocaleString()} MMK
              </span>
            </div>

            {receiptData.paidAmount !== undefined && (
              <div className="summary-row">
                <span className="summary-label">Amount Paid</span>
                <span className="summary-value">
                  {receiptData.paidAmount.toLocaleString()} MMK
                </span>
              </div>
            )}

            {receiptData.change !== undefined && receiptData.change > 0 && (
              <div className="summary-row">
                <span className="summary-label">Change Due</span>
                <span className="summary-value text-green-600">
                  {receiptData.change.toLocaleString()} MMK
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Signature Section */}
        <div className="mt-20 pt-10 border-t border-slate-100">
          <div className="flex justify-between items-end">
            <div className="text-center w-56">
              <div className="h-16 mb-2"></div>
              <div className="border-t-2 border-slate-200 pt-2">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Customer Signature
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-primary-blue font-black text-lg mb-1">
                Thank You!
              </p>
              <p className="text-slate-400 text-xs font-bold">
                TopNotch Gadgets & IT
              </p>
            </div>

            <div className="text-center w-56">
              <div className="h-16 mb-2 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-blue/10 rounded-full flex items-center justify-center opacity-20">
                  <span className="text-primary-blue font-black text-xs">
                    STAMP
                  </span>
                </div>
              </div>
              <div className="border-t-2 border-slate-200 pt-2">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Authorized Signature
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
