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
            margin: 20mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12pt;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5;
            text-align: left;
            color: #000000 !important;
            background: white !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          .thermal-receipt-container {
            display: block !important;
            background: white !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .thermal-receipt-page {
            width: 100% !important;
            background: white !important;
            color: #000000 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          .print-receipt {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            min-height: auto !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .print-receipt * {
            font-family: 'Helvetica', 'Arial', sans-serif;
          }
        }
        @media screen {
          body {
            background: #f5f5f5;
            padding: 20px;
          }
          .thermal-receipt-container {
            display: flex;
            justify-content: center;
            padding: 20px;
            background: #f5f5f5;
          }
          .thermal-receipt-page {
            border: 1px solid #ccc;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            background: white;
            width: 210mm;
            padding: 20mm;
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

      {/* Thermal Receipt Content */}
      <div className="thermal-receipt-container">
        <div className="thermal-receipt-page print-receipt">
          {/* Header */}
          <div
            className="header"
            style={{ textAlign: "center", marginBottom: "5mm" }}
          >
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                marginBottom: "2mm",
                marginTop: "0",
                textTransform: "uppercase",
              }}
            >
              HONGCHI Myanmar
            </h2>
          </div>

          {/* Order Info */}
          <div
            className="order-info"
            style={{
              borderTop: "2px solid #000",
              borderBottom: "2px solid #000",
              padding: "2mm 0",
              margin: "5mm 0",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p
                style={{
                  margin: "1px 0",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Invoice: {receiptData.invoiceNumber}
              </p>
              <p style={{ margin: "1px 0", fontSize: "16px" }}>
                Date: {formatDate(receiptData.date)}{" "}
                {formatTime(receiptData.date)}
              </p>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "5mm" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <th style={{ textAlign: "left", padding: "2mm 0" }}>
                    Description
                  </th>
                  <th style={{ textAlign: "center", padding: "2mm 0" }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "2mm 0" }}>
                    Price
                  </th>
                  <th style={{ textAlign: "right", padding: "2mm 0" }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items.map((item, index) => (
                  <tr
                    key={`${item.code || item.name}-${index}`}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "2mm 0" }}>{item.name}</td>
                    <td style={{ textAlign: "center", padding: "2mm 0" }}>
                      {item.qty}
                    </td>
                    <td style={{ textAlign: "right", padding: "2mm 0" }}>
                      {item.price.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", padding: "2mm 0" }}>
                      {(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div
            className="summary-section"
            style={{
              marginTop: "5mm",
              padding: "2mm 0",
              textAlign: "right",
            }}
          >
            <div style={{ display: "inline-block", minWidth: "250px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1mm",
                }}
              >
                <span>Subtotal:</span>
                <span>{receiptData.subtotal.toLocaleString()}</span>
              </div>
              {receiptData.discountPercent > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1mm",
                  }}
                >
                  <span>Discount ({receiptData.discountPercent}%):</span>
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
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "2mm",
                  paddingTop: "2mm",
                  borderTop: "2px solid #000",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                <span>TOTAL:</span>
                <span>{receiptData.total.toLocaleString()} MMK</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "2mm",
                }}
              >
                <span>Payment Method:</span>
                <span>{receiptData.paymentMethod}</span>
              </div>
            </div>
          </div>

          {receiptData.note && (
            <div
              style={{
                marginTop: "10mm",
                padding: "2mm",
                border: "1px solid #eee",
                fontStyle: "italic",
              }}
            >
              Note: {receiptData.note}
            </div>
          )}

          {/* Footer */}
          <div
            className="footer"
            style={{
              textAlign: "center",
              marginTop: "20mm",
              paddingTop: "5mm",
              borderTop: "1px solid #eee",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "2mm",
              }}
            >
              Thank you for your business!
            </p>
            <p style={{ opacity: 0.7 }}>HONGCHI Myanmar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
