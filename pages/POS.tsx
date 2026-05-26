import React from "react";
import { Store, Loader2 } from "lucide-react";
import { usePOS } from "../hooks/usePOS";
import { useLanguage } from "../context/LanguageContext";
import { ProductGrid } from "../components/POS/ProductGrid";
import { CartSidebar } from "../components/POS/CartSidebar";
import { CheckoutModal } from "../components/POS/CheckoutModal";
import { SuccessModal } from "../components/POS/SuccessModal";

export const POS: React.FC = () => {
  const { t } = useLanguage();
  const pos = usePOS();

  if (pos.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-dark-600">{t("pos.loading")}</p>
        </div>
      </div>
    );
  }

  if (pos.storefronts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Store className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-dark-600">You are not assigned to any storefront. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-[#F8F9FA]">
      <ProductGrid
        search={pos.search}
        onSearchChange={pos.setSearch}
        onBarcodeScan={pos.handleBarcodeScan}
        selectedCategory={pos.selectedCategory}
        onCategoryChange={pos.setSelectedCategory}
        categories={pos.categories}
        currentPage={pos.currentPage}
        totalPages={pos.totalPages}
        totalItems={pos.totalItems}
        onPageChange={pos.setCurrentPage}
        storefronts={pos.storefronts}
        selectedStorefrontId={pos.selectedStorefrontId}
        showStorefrontMenu={pos.showStorefrontMenu}
        onToggleStorefrontMenu={() => pos.setShowStorefrontMenu(!pos.showStorefrontMenu)}
        loading={pos.loading}
        filteredProducts={pos.filteredProducts}
        onAddToCart={pos.addToCart}
        onRefresh={pos.handleRefresh}
        onStorefrontChange={pos.handleStorefrontChange}
      />

      <CartSidebar
        cart={pos.cart}
        subtotal={pos.subtotal}
        total={pos.total}
        paymentMethod={pos.paymentMethod}
        paymentType={pos.paymentType}
        onUpdateQty={pos.updateQty}
        onSetQty={pos.setQty}
        onSetCartLineUnit={pos.setCartLineUnit}
        onRemoveFromCart={pos.removeFromCart}
        onOpenCheckout={() => pos.setShowCheckoutModal(true)}
      />

      {pos.isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 mb-1">{t("pos.processing")}</p>
              <p className="text-sm text-gray-500">Please wait while we process your order...</p>
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        show={pos.showCheckoutModal}
        onClose={() => pos.setShowCheckoutModal(false)}
        paymentType={pos.paymentType}
        onPaymentTypeChange={pos.setPaymentType}
        createdAt={pos.createdAt}
        onCreatedAtChange={pos.setCreatedAt}
        creditPersonas={pos.creditPersonas}
        selectedCreditPersonId={pos.selectedCreditPersonId}
        onCreditPersonChange={pos.setSelectedCreditPersonId}
        paymentMethod={pos.paymentMethod}
        onPaymentMethodChange={pos.setPaymentMethod}
        useMarkup={pos.useMarkup}
        onUseMarkupChange={pos.setUseMarkup}
        discount={pos.discount}
        onDiscountChange={pos.setDiscount}
        markupAmount={pos.markupAmount}
        onMarkupAmountChange={pos.setMarkupAmount}
        paidAmount={pos.paidAmount}
        onPaidAmountChange={pos.setPaidAmount}
        note={pos.note}
        onNoteChange={pos.setNote}
        subtotal={pos.subtotal}
        total={pos.total}
        combinedDiscountAmount={pos.combinedDiscountAmount}
        cartItemCount={pos.cart.reduce((sum, i) => sum + i.qty, 0)}
        isProcessing={pos.isProcessing}
        devices={pos.devices}
        onCheckout={() => { pos.handleCheckout(); pos.setShowCheckoutModal(false); }}
        showDiscountCalculator={pos.showDiscountCalculator}
        showMarkupCalculator={pos.showMarkupCalculator}
        onOpenDiscountCalc={() => pos.setShowDiscountCalculator(true)}
        onOpenMarkupCalc={() => pos.setShowMarkupCalculator(true)}
        onCloseDiscountCalc={() => pos.setShowDiscountCalculator(false)}
        onCloseMarkupCalc={() => pos.setShowMarkupCalculator(false)}
        discountAmount={pos.discountAmount}
        onDiscountAmountChange={pos.setDiscountAmount}
      />

      <SuccessModal
        show={pos.showSuccessModal}
        orderNumber={pos.successOrderNumber}
        onClose={() => { pos.setShowSuccessModal(false); pos.setSuccessOrderNumber(""); }}
      />
    </div>
  );
};
