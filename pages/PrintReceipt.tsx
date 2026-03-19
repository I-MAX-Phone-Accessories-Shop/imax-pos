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

  const fonts = {
    title: "26px",
    header: "18px",
    address: "16px",
    item: "18px",
    summary: "16px",
    total: "20px",
    footer: "16px",
    orderInfo: "16px",
  };

  const maxNameLength = 40;

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            width: 80mm !important;
          }
          body {
            font-family: 'Inter', 'Pyidaungsu', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .thermal-receipt-container {
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm 2mm !important;
          }
        }
        @media screen {
          body {
            background: #f5f5f5;
          }
          .thermal-receipt-container {
            display: flex;
            justify-content: center;
            padding: 40px 20px;
          }
          .thermal-receipt-page {
            border: 1px solid #ccc;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            background: white;
            width: 80mm;
            padding: 8mm 4mm;
          }
        }

        .thermal-receipt-page {
          font-family: 'Inter', 'Pyidaungsu', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #000;
          line-height: 1.4;
          font-weight: 600;
        }
        .header {
          text-align: center;
          margin-bottom: 4mm;
        }
        .store-name {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 1mm;
          text-transform: uppercase;
        }
        .store-tagline {
          font-size: 16px;
          margin-bottom: 1mm;
        }
        .store-sub-tagline {
          font-size: 14px;
          margin-bottom: 1mm;
        }
        .store-address {
          font-size: 12px;
          margin-bottom: 0.5mm;
        }
        .store-phone {
          font-size: 12px;
          margin-bottom: 2mm;
        }
        .date-row {
          text-align: left;
          font-size: 12px;
          margin-bottom: 2mm;
        }
        .divider {
          border-top: 2px dashed #000;
          margin: 2mm 0;
        }
        .items-header {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 900;
          padding-bottom: 1mm;
        }
        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 14px;
          margin-bottom: 2mm;
        }
        .col-name { flex: 2; text-align: left; word-break: break-word; }
        .col-qty { flex: 1; text-align: center; }
        .col-price { flex: 1.5; text-align: right; }
        .col-total { flex: 1.5; text-align: right; }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5mm;
          font-size: 14px;
        }
        .thank-you {
          font-size: 18px;
          font-weight: 900;
          margin: 4mm 0 2mm;
          text-align: center;
        }
        .payment-info {
          font-size: 12px;
          text-align: center;
          margin-bottom: 1mm;
        }
        .print-time {
          font-size: 12px;
          text-align: center;
          opacity: 0.8;
          margin-top: 2mm;
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

      {/* Thermal Receipt Content */}
      <div className="thermal-receipt-container">
        <div className="thermal-receipt-page">
          {/* Header */}
          <div className="header">
            <div className="store-name">SUPER KING</div>
            <div className="store-tagline">ဖုန်း နှင့် ဖုန်းအပိုပစ္စည်း</div>
            <div className="store-sub-tagline">လက်လီ/ လက်ကား ရောင်းဝယ်ရေး</div>
            <div className="store-address">ဆိုင်အမှတ်(C15) ယုဇနပလာဇာ၊ ပထမထပ်/</div>
            <div className="store-address">ဝင်ပေါက်(၈) ဓာတ်လှေကားအနီး</div>
            <div className="store-phone">09400016001-09970994888</div>
          </div>

          <div className="date-row">
            ရက်စွဲ: {formatDate(receiptData.date)} {formatTime(receiptData.date)}
          </div>

          <div className="divider"></div>

          <div className="items-header">
            <span className="col-name">အမည်</span>
            <span className="col-qty">ဦးရေ</span>
            <span className="col-price">ဈေးနှုန်း</span>
            <span className="col-total">သင့်ငွေ</span>
          </div>

          <div className="divider"></div>

          {/* Items */}
          {receiptData.items.map((item, index) => (
            <div key={`${item.code || item.name}-${index}`} className="item-row">
              <div className="item-main">
                <span className="col-name">{item.name}</span>
                <span className="col-qty">{item.qty} ခု</span>
                <span className="col-price">{item.price.toLocaleString()}</span>
                <span className="col-total">{(item.price * item.qty).toLocaleString()}</span>
              </div>
            </div>
          ))}

          <div className="divider"></div>

          {/* Summary */}
          <div className="summary-section">
            <div className="summary-row">
              <span>ကျသင့်ငွေ</span>
              <span>{receiptData.subtotal.toLocaleString()} Ks</span>
            </div>
            {receiptData.discountPercent > 0 && (
              <div className="summary-row">
                <span>Discount</span>
                <span>{receiptData.discountPercent}%</span>
              </div>
            )}
            <div className="divider"></div>
            <div className="summary-row" style={{ fontWeight: 900, fontSize: '18px' }}>
              <span>စုစုပေါင်း</span>
              <span>{receiptData.total.toLocaleString()} Ks</span>
            </div>
            <div className="summary-row">
              <span>ပေးငွေ</span>
              <span>{(receiptData.paidAmount || receiptData.total).toLocaleString()} Ks</span>
            </div>
            <div className="divider"></div>
            <div className="summary-row">
              <span>အမ်းငွေ</span>
              <span>{(receiptData.change || 0).toLocaleString()} Ks</span>
            </div>
          </div>

          <div className="divider"></div>

          {receiptData.note && (
            <div style={{ margin: '2mm 0', fontSize: '14px', fontStyle: 'italic' }}>
              Note: {receiptData.note}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div style={{ textAlign: "left", fontSize: "14px", marginBottom: "2mm" }}>
              ပြေစာအမှတ်: {receiptData.invoiceNumber}
            </div>
            <div className="thank-you">အားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။</div>
            <div className="payment-info">kpay 09400016001/ U myolwin</div>
            <div className="print-time">Print Time: {new Date().toLocaleString('en-GB')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
