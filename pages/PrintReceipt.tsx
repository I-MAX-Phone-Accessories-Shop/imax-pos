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

  // Auto show print dialog when page loads
  useEffect(() => {
    if (receiptData) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [receiptData]);

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
    <div>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Inter', sans-serif;
            font-size: 12pt;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa !important;
            font-weight: bold;
          }
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #001144;
            padding-bottom: 20px;
          }
          .company-info h1 {
            color: #001144 !important;
            font-size: 28pt;
            margin-bottom: 5px;
          }
          .company-info p {
            color: #666;
            font-size: 10pt;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-details h2 {
            font-size: 24pt;
            color: #c5a021 !important;
            margin-bottom: 10px;
          }
          .summary-section {
            margin-top: 30px;
            float: right;
            width: 300px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .summary-row.total {
            border-bottom: none;
            border-top: 2px solid #001144;
            margin-top: 10px;
            font-weight: bold;
            font-size: 14pt;
          }
          .footer-section {
            margin-top: 50px;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
            clear: both;
          }
        }
        @media screen {
          body {
            background: #f0f2f5;
            padding: 40px 20px;
          }
          .receipt-container {
            background: white;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
        }
      `}</style>

      {/* Header - Hidden during print */}
      <div className="no-print bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Receipt #{receiptData.invoiceNumber}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              🖨️ Print Receipt
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Voucher Content */}
      <div className="receipt-container">
        <div className="header-section">
          <div className="company-info">
            <h1>shwepyi-pos</h1>
            <p>ရွှေပြည် ဖုန်းအပိုပစ္စည်း လက်ကားဒိုင်</p>
            <p>လိပ်စာ - အမှတ်(၃၀)၊ ပထမထပ်၊ ယုဇနပလာဇာ၊ ရန်ကုန်။</p>
            <p>ဖုန်း - 09 780511511, 09 440064007</p>
          </div>
          <div className="invoice-details">
            <h2>VOUCHER</h2>
            <p><strong>Invoice #:</strong> {receiptData.invoiceNumber}</p>
            <p><strong>Date:</strong> {formatDate(receiptData.date)}</p>
            <p><strong>Time:</strong> {formatTime(receiptData.date)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th>Description</th>
              <th style={{ width: "100px", textAlign: "right" }}>Qty</th>
              <th style={{ width: "150px", textAlign: "right" }}>Price</th>
              <th style={{ width: "150px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div className="font-medium">{item.name}</div>
                  {item.code && <div className="text-xs text-gray-500">{item.code}</div>}
                </td>
                <td style={{ textAlign: "right" }}>{item.qty}</td>
                <td style={{ textAlign: "right" }}>{item.price.toLocaleString()}</td>
                <td style={{ textAlign: "right" }}>{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary-section">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{receiptData.subtotal.toLocaleString()} MMK</span>
          </div>
          {receiptData.discountPercent > 0 && (
            <div className="summary-row">
              <span>Discount ({receiptData.discountPercent}%):</span>
              <span>-{(receiptData.subtotal * receiptData.discountPercent / 100).toLocaleString()} MMK</span>
            </div>
          )}
          <div className="summary-row total">
            <span>TOTAL:</span>
            <span>{receiptData.total.toLocaleString()} MMK</span>
          </div>
          <div className="summary-row mt-4">
            <span>Payment Method:</span>
            <span>{receiptData.paymentMethod}</span>
          </div>
          {receiptData.paidAmount && (
            <div className="summary-row">
              <span>Paid Amount:</span>
              <span>{receiptData.paidAmount.toLocaleString()} MMK</span>
            </div>
          )}
          {receiptData.change && receiptData.change > 0 && (
            <div className="summary-row">
              <span>Change:</span>
              <span>{receiptData.change.toLocaleString()} MMK</span>
            </div>
          )}
        </div>

        {receiptData.note && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 clear-both">
            <p className="text-sm"><strong>Note:</strong> {receiptData.note}</p>
          </div>
        )}

        <div className="footer-section">
          <p>ဝယ်ယူအားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။</p>
          <p>ဝယ်ပြီးပစ္စည်း ပြန်မလဲပေးပါ။</p>
          <p className="mt-2 text-gray-400">© {new Date().getFullYear()} shwepyi-pos System</p>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
