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

  console.log(receiptData);

  const handleBack = () => {
    navigate(-1);
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
            size: 58mm auto;
            margin: 0;
            padding: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            filter: contrast(200%) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            overflow: visible !important;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            width: 58mm;
            max-width: 58mm;
            margin: 0 auto !important;
            padding: 1mm 0.5mm !important;
            line-height: 1.3;
            text-align: center;
            color: #000000 !important;
            font-weight: bold;
            background: white !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          .thermal-receipt-container {
            display: block !important;
            background: white !important;
            width: 58mm !important;
            max-width: 58mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .thermal-receipt-page {
            width: 58mm !important;
            max-width: 58mm !important;
            background: white !important;
            color: #000000 !important;
            font-weight: bold !important;
            filter: contrast(200%) !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }
          .no-print {
            display: none !important;
          }
          .print-receipt {
            margin: 0 !important;
            padding: 1mm 0.5mm !important;
            background: white !important;
            min-height: auto !important;
            height: auto !important;
            width: 58mm !important;
            max-width: 58mm !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }
          .print-receipt * {
            font-family: 'Courier New', monospace;
            font-weight: bold !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
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
            width: 58mm;
            max-width: 58mm;
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
            style={{ textAlign: "center", marginBottom: "1mm" }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "900",
                marginBottom: "1mm",
                marginTop: "0",
                textTransform: "uppercase",
                letterSpacing: "0",
              }}
            >
              OTAS SHop
            </h2>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "800",
                marginBottom: "1mm",
                textTransform: "uppercase",
                letterSpacing: "0",
              }}
            >
              လိပ်စာ - A(30)၊ပထမထပ်၊
              <br />
              &nbsp;&nbsp;&nbsp;&nbspယုဇနပလာဇာ
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "800",
                marginBottom: "1mm",
                textTransform: "uppercase",
                letterSpacing: "0",
              }}
            >
              ဖုန်း-09670577147(Viber)
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "800",
                marginBottom: "1mm",
                textTransform: "uppercase",
                letterSpacing: "0",
              }}
            >
              ဖုန်း-09440064007(Viber)
            </div>
          </div>

          {/* Order Info */}
          <div
            className="order-info"
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "0.5mm 0",
              margin: "1mm 0",
            }}
          >
            <p
              style={{
                margin: "1px 0",
                fontSize: "14px",
                fontWeight: "900",
              }}
            >
              Order: {receiptData.invoiceNumber}
            </p>
            <p
              style={{
                margin: "1px 0",
                fontSize: "12px",
                fontWeight: "900",
              }}
            >
              {formatDate(receiptData.date)} {formatTime(receiptData.date)}
            </p>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "2mm" }}>
            <div
              className="items-header"
              style={{
                borderBottom: "1px dashed #000",
                paddingBottom: "1mm",
                marginBottom: "2mm",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                fontWeight: "900",
              }}
            >
              <span style={{ flex: "1", textAlign: "left" }}>Item</span>
              <span style={{ width: "55px", textAlign: "right" }}>Amt</span>
            </div>

            {receiptData.items.length > 0 ? (
              receiptData.items.map((item, index) => (
                <div
                  key={`${item.code || item.name}-${index}`}
                  style={{
                    marginBottom: "1mm",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        flex: "1",
                        fontSize: "14px",
                        wordBreak: "break-word",
                        paddingRight: "1mm",
                        textAlign: "left",
                        fontWeight: "900",
                      }}
                    >
                      {item.name.substring(0, 25)}
                      {item.name.length > 25 ? "..." : ""} x{item.qty}
                    </span>
                    <span
                      style={{
                        width: "55px",
                        textAlign: "right",
                        fontSize: "14px",
                        fontWeight: "900",
                      }}
                    >
                      {(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "900",
                }}
              >
                No items
              </p>
            )}
          </div>

          {/* Summary */}
          <div
            className="summary-section"
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "2mm 0",
              marginBottom: "2mm",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1mm",
                fontSize: "13px",
                fontWeight: "900",
              }}
            >
              <span>Subtotal</span>
              <span>{receiptData.subtotal.toLocaleString()}</span>
            </div>

            {receiptData.discountPercent > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1mm",
                  fontSize: "13px",
                  fontWeight: "900",
                }}
              >
                <span>Discount</span>
                <span style={{ fontWeight: "900" }}>
                  {receiptData.discountPercent}%
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "2mm",
                paddingTop: "2mm",
                borderTop: "1px solid #000",
                fontSize: "16px",
                fontWeight: "900",
              }}
            >
              <span>TOTAL</span>
              <span>{receiptData.total.toLocaleString()}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1mm",
                fontSize: "13px",
                fontWeight: "900",
              }}
            >
              <span>Payment</span>
              <span>{receiptData.paymentMethod}</span>
            </div>

            {receiptData.paidAmount && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1mm",
                  fontSize: "13px",
                  fontWeight: "900",
                }}
              >
                <span>Paid</span>
                <span>{receiptData.paidAmount.toLocaleString()}</span>
              </div>
            )}

            {receiptData.change && receiptData.change > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1mm",
                  fontSize: "13px",
                  fontWeight: "900",
                }}
              >
                <span>Change</span>
                <span>{receiptData.change.toLocaleString()}</span>
              </div>
            )}
          </div>

          {receiptData.note && (
            <div
              style={{
                marginBottom: "2mm",
                fontSize: "11px",
                fontStyle: "italic",
                fontWeight: "900",
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
              marginTop: "2mm",
              paddingTop: "2mm",
              borderTop: "1px dashed #000",
              fontSize: "12px",
            }}
          >
            <p
              style={{
                margin: "1mm 0",
                fontSize: "14px",
                fontWeight: "900",
              }}
            >
              Thank you!
            </p>
            <p style={{ margin: "1mm 0", opacity: 0.7, fontWeight: "900" }}>
              IMAS POS System Receipt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
