import React from "react";
import { PrintShopBranding } from "../../utils/printShopBranding";
import { PrintPaperSize } from "../../utils/printPaperSize";

export interface VoucherReceiptItem {
  name: string;
  code?: string;
  qty: number;
  price: number;
}

export type VoucherDocumentType = "invoice" | "quotation";

export interface VoucherReceiptData {
  invoiceNumber: string;
  storefrontName: string;
  date: string;
  items: VoucherReceiptItem[];
  subtotal: number;
  discountPercent: number;
  /** Fixed discount in MMK (quotations); shown when > 0 */
  discountAmount?: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  change?: number;
  note?: string;
  documentType?: VoucherDocumentType;
}

interface VoucherContentProps {
  receiptData: VoucherReceiptData;
  shopBranding: PrintShopBranding;
  paperSize: PrintPaperSize;
  formatDate: (dateString: string) => string;
}

export const VoucherContent: React.FC<VoucherContentProps> = ({
  receiptData,
  shopBranding,
  paperSize,
  formatDate,
}) => {
  const isThermal = paperSize === "thermal-80mm";
  const isQuotation = receiptData.documentType === "quotation";
  const contactParts = [
    shopBranding.phone && `Tel: ${shopBranding.phone}`,
    shopBranding.website,
  ].filter(Boolean);

  return (
    <div className="voucher-container" data-paper={paperSize}>
      <div className="text-center mb-4 sm:mb-8">
        {shopBranding.logo ? (
          <img
            src={shopBranding.logo}
            alt={shopBranding.shopName}
            className="voucher-logo mx-auto object-contain"
          />
        ) : (
          <div
            className="voucher-logo mx-auto flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold"
          >
            {shopBranding.shopName.charAt(0)}
          </div>
        )}
        <h2 className="voucher-shop-name font-bold text-slate-800 mt-3">
          {shopBranding.shopName}
        </h2>
        {shopBranding.address && (
          <p className="voucher-address text-slate-600 mt-1">
            {shopBranding.address}
          </p>
        )}
      </div>

      <div
        className={`flex justify-between items-start mb-4 sm:mb-6 voucher-invoice-row ${
          isThermal ? "flex-col gap-1" : ""
        }`}
      >
        <div>
          <p className="font-bold mb-0.5">
            {isQuotation ? "QUOTATION TO :" : "INVOICE TO :"}
          </p>
          <p>{receiptData.storefrontName}</p>
        </div>
        <div className={isThermal ? "" : "text-right"}>
          <p className="font-bold mb-0.5">
            {isQuotation ? "QUOTATION NO" : "INVOICE NO"} :{" "}
            {receiptData.invoiceNumber}
          </p>
          <p className="font-bold">DATE: {formatDate(receiptData.date)}</p>
        </div>
      </div>

      {isThermal ? (
        <div className="mb-4">
          <div className="voucher-thermal-header">
            <div>NO</div>
            <div>ITEM</div>
            <div>PRICE</div>
            <div>QTY</div>
            <div className="text-right">TOTAL</div>
          </div>
          {receiptData.items.map((item, index) => (
            <div key={index} className="voucher-thermal-item">
              <div>{index + 1}</div>
              <div className="break-words">
                {item.name.length > 28
                  ? `${item.name.substring(0, 28)}...`
                  : item.name}
              </div>
              <div>{item.price.toLocaleString()}</div>
              <div>{item.qty}</div>
              <div className="text-right font-semibold">
                {(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 sm:mb-8">
          <table className="voucher-table">
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
      )}

      <div
        className={`voucher-summary-grid ${
          isThermal ? "" : "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8"
        }`}
      >
        <div>
          <div className="mb-3 sm:mb-6">
            {isQuotation ? (
              <>
                <p className="font-bold mb-1">Document:</p>
                <p>{receiptData.paymentMethod}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Prices are estimates. Not a final invoice.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold mb-1">Payment Info:</p>
                <p>Method: {receiptData.paymentMethod}</p>
                {receiptData.paidAmount != null && (
                  <p>
                    Paid: {receiptData.paidAmount.toLocaleString()}{" "}
                    {shopBranding.currency}
                  </p>
                )}
                {receiptData.change != null && receiptData.change > 0 && (
                  <p>
                    Change: {receiptData.change.toLocaleString()}{" "}
                    {shopBranding.currency}
                  </p>
                )}
              </>
            )}
          </div>
          {receiptData.note && <p className="italic">Note: {receiptData.note}</p>}
        </div>

        <div>
          <div className="flex justify-between mb-1 sm:mb-2">
            <span>SUB TOTAL:</span>
            <span>{receiptData.subtotal.toLocaleString()}</span>
          </div>
          {(receiptData.tax ?? 0) > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>TAX:</span>
              <span>+{(receiptData.tax ?? 0).toLocaleString()}</span>
            </div>
          )}
          {(receiptData.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>DISCOUNT:</span>
              <span>-{(receiptData.discountAmount ?? 0).toLocaleString()}</span>
            </div>
          )}
          {receiptData.discountPercent > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>DISCOUNT ({receiptData.discountPercent}%):</span>
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
            className="voucher-total-bar flex justify-between font-bold text-white"
            style={{ backgroundColor: "#1E90FF" }}
          >
            <span>TOTAL:</span>
            <span>
              {receiptData.total.toLocaleString()} {shopBranding.currency}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-16 text-center">
        <p className="voucher-footer-title font-bold italic mb-1">
          {isQuotation
            ? "Thank you — please confirm before ordering."
            : "Thank you for your business!"}
        </p>
        <div className="voucher-sign border-t border-gray-300 mt-6 sm:mt-8 pt-4">
          <p className="text-xs text-right">
            Authorised Sign: _________________
          </p>
        </div>
      </div>

      <div
        className="voucher-contact-bar mt-4 sm:mt-6 py-2 sm:py-3 px-3 sm:px-4 flex justify-between text-white text-xs"
        style={{ backgroundColor: "#000" }}
      >
        <span>
          {contactParts.length > 0
            ? `Contact: ${contactParts.join(" | ")}`
            : shopBranding.address || ""}
        </span>
        <span>{shopBranding.shopName}</span>
      </div>
    </div>
  );
};
