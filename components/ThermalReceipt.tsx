import React from "react";

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

interface ThermalReceiptProps {
  order: ReceiptData;
  paperSize?: "57mm" | "58mm" | "80mm";
}

// const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
//   order,
//   paperSize = "58mm",
// }) => {
//   // Standard thermal paper sizes: 57mm, 58mm, 80mm
//   const PAPER_WIDTH_MM = parseInt(paperSize) || 58;

//   // Adjust font sizes based on paper width - larger for better print visibility
//   const isWide = PAPER_WIDTH_MM >= 80;
//   const fontSize = {
//     title: isWide ? "26px" : "20px",
//     header: isWide ? "20px" : "14px",
//     item: isWide ? "20px" : "14px",
//     summary: isWide ? "19px" : "13px",
//     total: isWide ? "22px" : "16px",
//     footer: isWide ? "18px" : "12px",
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "2-digit",
//     });
//   };

//   const formatTime = (dateString: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   // Safety check - ensure we have order data
//   if (!order) {
//     return (
//       <div
//         className="thermal-receipt"
//         style={{ padding: "5px", textAlign: "center" }}
//       >
//         <p>No order data available</p>
//       </div>
//     );
//   }

//   // For thermal paper - no pagination needed (continuous roll)
//   const renderThermalReceipt = () => {
//     return (
//       <div
//         className="thermal-receipt-page"
//         style={{
//           width: `${PAPER_WIDTH_MM}mm`,
//           maxWidth: `${PAPER_WIDTH_MM}mm`,
//           fontFamily: "'Courier New', monospace",
//           fontSize: fontSize.header,
//           lineHeight: "1.3",
//           fontWeight: "bold",
//           backgroundColor: "white",
//           color: "#000000",
//           filter: "contrast(200%)",
//         }}
//       >
//         {/* Header */}
//         <div style={{ textAlign: "center", marginBottom: "1mm" }}>
//           <h2
//             style={{
//               fontSize: fontSize.title,
//               fontWeight: "900",
//               marginBottom: "1mm",
//               marginTop: "0",
//               textTransform: "uppercase",
//               letterSpacing: "0",
//             }}
//           >
//             i-mas ဖုန်းအပိုပစ္စည်း လက်ကားဒိုင်
//           </h2>
//         </div>

//         {/* Order Info */}
//         <div
//           style={{
//             borderTop: "1px dashed #000",
//             borderBottom: "1px dashed #000",
//             padding: "0.5mm 0",
//             margin: "1mm 0",
//           }}
//         >
//           <p
//             style={{
//               margin: "1px 0",
//               fontSize: fontSize.header,
//               fontWeight: "900",
//             }}
//           >
//             Order: {order.invoiceNumber}
//           </p>
//           <p
//             style={{
//               margin: "1px 0",
//               fontSize: fontSize.item,
//               fontWeight: "900",
//             }}
//           >
//             {formatDate(order.date)} {formatTime(order.date)}
//           </p>
//         </div>

//         {/* Items */}
//         <div style={{ marginBottom: "2mm" }}>
//           <div
//             style={{
//               borderBottom: "1px dashed #000",
//               paddingBottom: "1mm",
//               marginBottom: "2mm",
//               display: "flex",
//               justifyContent: "space-between",
//               fontSize: fontSize.header,
//               fontWeight: "900",
//             }}
//           >
//             <span style={{ flex: "1", textAlign: "left" }}>Item</span>
//             <span style={{ width: "55px", textAlign: "right" }}>Amt</span>
//           </div>

//           {order.items.length > 0 ? (
//             order.items.map((item, index) => (
//               <div
//                 key={`${item.code || item.name}-${index}`}
//                 style={{
//                   marginBottom: "1mm",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                   }}
//                 >
//                   <span
//                     style={{
//                       flex: "1",
//                       fontSize: fontSize.item,
//                       wordBreak: "break-word",
//                       paddingRight: "1mm",
//                       textAlign: "left",
//                       fontWeight: "900",
//                     }}
//                   >
//                     {item.name.substring(0, 25)}
//                     {item.name.length > 25 ? "..." : ""} x{item.qty}
//                   </span>
//                   <span
//                     style={{
//                       width: "55px",
//                       textAlign: "right",
//                       fontSize: fontSize.item,
//                       fontWeight: "900",
//                     }}
//                   >
//                     {(item.price * item.qty).toLocaleString()}
//                   </span>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p
//               style={{
//                 textAlign: "center",
//                 fontSize: fontSize.item,
//                 fontWeight: "900",
//               }}
//             >
//               No items
//             </p>
//           )}
//         </div>

//         {/* Summary */}
//         <div
//           style={{
//             borderTop: "1px dashed #000",
//             borderBottom: "1px dashed #000",
//             padding: "2mm 0",
//             marginBottom: "2mm",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "1mm",
//               fontSize: fontSize.summary,
//               fontWeight: "900",
//             }}
//           >
//             <span>Subtotal</span>
//             <span>{order.subtotal.toLocaleString()}</span>
//           </div>

//           {order.discountPercent > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "1mm",
//                 fontSize: fontSize.summary,
//                 fontWeight: "900",
//               }}
//             >
//               <span>Discount</span>
//               <span style={{ fontWeight: "900" }}>
//                 {order.discountPercent}%
//               </span>
//             </div>
//           )}

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginTop: "2mm",
//               paddingTop: "2mm",
//               borderTop: "1px solid #000",
//               fontSize: fontSize.total,
//               fontWeight: "900",
//             }}
//           >
//             <span>TOTAL</span>
//             <span>{order.total.toLocaleString()}</span>
//           </div>

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "1mm",
//               fontSize: fontSize.summary,
//               fontWeight: "900",
//             }}
//           >
//             <span>Payment</span>
//             <span>{order.paymentMethod}</span>
//           </div>

//           {order.paidAmount && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "1mm",
//                 fontSize: fontSize.summary,
//                 fontWeight: "900",
//               }}
//             >
//               <span>Paid</span>
//               <span>{order.paidAmount.toLocaleString()}</span>
//             </div>
//           )}

//           {order.change && order.change > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "1mm",
//                 fontSize: fontSize.summary,
//                 fontWeight: "900",
//               }}
//             >
//               <span>Change</span>
//               <span>{order.change.toLocaleString()}</span>
//             </div>
//           )}
//         </div>

//         {order.note && (
//           <div
//             style={{
//               marginBottom: "2mm",
//               fontSize: "11px",
//               fontStyle: "italic",
//               fontWeight: "900",
//             }}
//           >
//             Note: {order.note}
//           </div>
//         )}

//         {/* Footer */}
//         <div
//           style={{
//             textAlign: "center",
//             marginTop: "2mm",
//             paddingTop: "2mm",
//             borderTop: "1px dashed #000",
//             fontSize: fontSize.footer,
//           }}
//         >
//           <p
//             style={{
//               margin: "1mm 0",
//               fontSize: fontSize.item,
//               fontWeight: "900",
//             }}
//           >
//             Thank you!
//           </p>
//           <p style={{ margin: "1mm 0", opacity: 0.7, fontWeight: "900" }}>
//             IMAS POS System Receipt
//           </p>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="thermal-receipt-container thermal-receipt">
//       {renderThermalReceipt()}

//       {/* Print Styles for Thermal Paper - Continuous Roll (No Page Breaks) */}
//       <style>{`
//         @media print {
//           @page {
//             size: ${PAPER_WIDTH_MM}mm auto;
//             margin: 0;
//             padding: 0;
//           }
//           * {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//             filter: contrast(200%) !important;
//             page-break-inside: avoid !important;
//             page-break-before: avoid !important;
//             page-break-after: avoid !important;
//             break-inside: avoid !important;
//             break-before: avoid !important;
//             break-after: avoid !important;
//           }
//           html, body {
//             margin: 0 !important;
//             padding: 0 !important;
//             width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             overflow: visible !important;
//           }
//           body > *:not(#thermal-receipt-print-container) {
//             display: none !important;
//             visibility: hidden !important;
//           }
//           #thermal-receipt-print-container {
//             position: absolute !important;
//             left: 0 !important;
//             top: 0 !important;
//             width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             margin: 0 !important;
//             padding: 0 !important;
//             background: white !important;
//             z-index: 99999 !important;
//             overflow: visible !important;
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//           .thermal-receipt-container {
//             width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//           .thermal-receipt-page {
//             width: ${PAPER_WIDTH_MM}mm !important;
//             max-width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             margin: 0 !important;
//             padding: 1mm 0.5mm !important;
//             background: white !important;
//             box-shadow: none !important;
//             border: none !important;
//             color: #000000 !important;
//             font-weight: bold !important;
//             filter: contrast(200%) !important;
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//         }
//         @media screen {
//           .thermal-receipt-container {
//             display: flex;
//             justify-content: center;
//             padding: 20px;
//             background: #f5f5f5;
//           }
//           .thermal-receipt-page {
//             border: 1px solid #ccc;
//             box-shadow: 0 2px 8px rgba(0,0,0,0.15);
//             background: white;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// Helper function to print receipt
export const printThermalReceipt = (
  receiptData: ReceiptData,
  paperSize: string = "80mm",
) => {
  // Create a hidden iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc) {
    console.error("Failed to create print preview");
    document.body.removeChild(iframe);
    return;
  }

  // Adjust font sizes based on paper width
  const isWide = paperSize.includes("80");
  const fonts = {
    title: isWide ? "30px" : "22px",
    header: isWide ? "18px" : "14px",
    subHeader: isWide ? "16px" : "12px",
    address: isWide ? "14px" : "11px",
    item: isWide ? "16px" : "12px",
    summary: isWide ? "16px" : "12px",
    total: isWide ? "18px" : "14px",
    footer: isWide ? "16px" : "12px",
    orderInfo: isWide ? "14px" : "10px",
    thankYou: isWide ? "22px" : "16px",
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB") + " " + date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Generate receipt HTML
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${receiptData.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        @page {
          size: ${paperSize} auto;
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
        body {
          font-family: 'Inter', 'Pyidaungsu', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: ${fonts.item};
          width: ${paperSize};
          max-width: ${paperSize};
          margin: 0 auto;
          padding: 4mm 2mm;
          line-height: 1.4;
          color: #000000 !important;
          background: white !important;
          font-weight: 600;
        }
        .header {
          text-align: center;
          margin-bottom: 4mm;
        }
        .store-name {
          font-size: ${fonts.title};
          font-weight: 900;
          margin-bottom: 1mm;
          text-transform: uppercase;
        }
        .store-tagline {
          font-size: ${fonts.header};
          margin-bottom: 1mm;
        }
        .store-sub-tagline {
          font-size: ${fonts.subHeader};
          margin-bottom: 1mm;
        }
        .store-address {
          font-size: ${fonts.address};
          margin-bottom: 0.5mm;
        }
        .store-phone {
          font-size: ${fonts.address};
          margin-bottom: 2mm;
        }
        .date-row {
          text-align: left;
          font-size: ${fonts.orderInfo};
          margin-bottom: 2mm;
        }
        .divider {
          border-top: 2px dashed #000;
          margin: 2mm 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2mm;
        }
        .items-header {
          display: flex;
          justify-content: space-between;
          font-size: ${fonts.item};
          font-weight: 900;
          padding-bottom: 1mm;
        }
        .header-col-name { flex: 2; text-align: left; }
        .header-col-qty { flex: 1; text-align: center; }
        .header-col-price { flex: 1.5; text-align: right; }
        .header-col-total { flex: 1.5; text-align: right; }

        .item-row {
          margin-bottom: 2mm;
        }
        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: ${fonts.item};
        }
        .col-name { flex: 2; text-align: left; word-break: break-word; }
        .col-qty { flex: 1; text-align: center; }
        .col-price { flex: 1.5; text-align: right; }
        .col-total { flex: 1.5; text-align: right; }

        .summary-section {
          width: 100%;
          margin-top: 2mm;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5mm;
          font-size: ${fonts.summary};
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-top: 2mm;
          padding-top: 2mm;
          font-size: ${fonts.total};
          font-weight: 900;
        }
        .footer {
          text-align: center;
          margin-top: 4mm;
        }
        .thank-you {
          font-size: ${fonts.thankYou};
          font-weight: 900;
          margin-bottom: 2mm;
          margin-top: 2mm;
        }
        .payment-info {
          font-size: ${fonts.address};
          margin-bottom: 1mm;
        }
        .print-time {
          font-size: ${fonts.orderInfo};
          opacity: 0.8;
          margin-top: 2mm;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">IMAS</div>
        <div class="store-tagline">ဖုန်းအပိုပစ္စည်း လက်ကားဒိုင်ကြီး(၁)</div>
        <div class="store-address">လိပ်စာ - A(30)၊ပထမထပ်၊ ယုဇနပလာဇာ</div>
        <div class="store-phone">ဖုန်း-09780511511(Viber)</div>
        <div class="store-phone">ဖုန်း-09440064007(Viber)</div>
      </div>
      
      <div class="date-row">
        ရက်စွဲ: ${formatDateShort(receiptData.date)}
      </div>
      
      <div class="divider"></div>
      
      <div class="items-header">
        <span class="header-col-name">အမည်</span>
        <span class="header-col-qty">ဦးရေ</span>
        <span class="header-col-price">ဈေးနှုန်း</span>
        <span class="header-col-total">သင့်ငွေ</span>
      </div>
      
      <div class="divider"></div>
      
      ${receiptData.items
      .map(
        (item: any) => `
        <div class="item-row">
          <div class="item-main">
            <span class="col-name">${item.name}</span>
            <span class="col-qty">${item.qty} ခု</span>
            <span class="col-price">${item.price.toLocaleString()}</span>
            <span class="col-total">${(item.price * item.qty).toLocaleString()}</span>
          </div>
        </div>
      `,
      )
      .join("")}
      
      <div class="divider"></div>
      
      <div class="summary-section">
        <div class="summary-row">
          <span>ကျသင့်ငွေ</span>
          <span>${receiptData.subtotal.toLocaleString()} Ks</span>
        </div>
        ${receiptData.discountPercent > 0
      ? `
          <div class="summary-row">
            <span>Discount</span>
            <span>${receiptData.discountPercent}%</span>
          </div>
        `
      : ""
    }
        <div class="divider"></div>
        <div class="summary-row" style="font-weight: 900;">
          <span>စုစုပေါင်း</span>
          <span>${receiptData.total.toLocaleString()} Ks</span>
        </div>
        <div class="summary-row">
          <span>ပေးငွေ</span>
          <span>${(receiptData.paidAmount || receiptData.total).toLocaleString()} Ks</span>
        </div>
        <div class="divider"></div>
        <div class="summary-row">
          <span>အမ်းငွေ</span>
          <span>${(receiptData.change || 0).toLocaleString()} Ks</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <div style="text-align: left; font-size: ${fonts.orderInfo}; margin-bottom: 2mm;">
          ပြေစာအမှတ်: ${receiptData.invoiceNumber}
        </div>
        <div class="thank-you">အားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။</div>
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(receiptHTML);
  iframeDoc.close();

  // Wait for content to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
};


// export default ThermalReceipt;
