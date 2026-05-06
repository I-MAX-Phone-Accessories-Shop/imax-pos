import React from "react";
import {
  ChevronRight,
  Loader2,
  Package,
  TrendingUp,
  ShoppingCart,
  User,
  Phone,
  Hash,
  X,
  ExternalLink,
  Globe,
} from "lucide-react";
import {
  ProductSalesStatisticsResponse,
  ProductSalesData,
} from "../../services/Reports/fetchProductSalesStatistics";
import {
  fetchOrders,
  Order,
  CreditPerson,
} from "../../services/Order/fetchOrders";
import {
  fetchOnlineOrders,
  OnlineOrder,
} from "../../services/OnlineStorefront/fetchOnlineOrders";
import { Modal } from "../Modal";
import { OrderDetailModal } from "../Orders/OrderDetailModal";
import { OnlineOrderDetailModal } from "../OnlineOrders/OnlineOrderDetailModal";

interface SaleStatisticsTabProps {
  productSalesStatistics: ProductSalesStatisticsResponse | null;
  loading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  selectedStorefront: string;
}

export const SaleStatisticsTab: React.FC<SaleStatisticsTabProps> = ({
  productSalesStatistics,
  loading,
  startDate,
  endDate,
  selectedStorefront,
}) => {
  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductSalesData | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [productOrders, setProductOrders] = React.useState<
    Record<string, (Order | OnlineOrder)[]>
  >({});
  const [loadingOrders, setLoadingOrders] = React.useState<
    Record<string, boolean>
  >({});
  const [selectedViewOrder, setSelectedViewOrder] =
    React.useState<Order | null>(null);
  const [selectedOnlineOrder, setSelectedOnlineOrder] =
    React.useState<OnlineOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);
  const [isOnlineOrderModalOpen, setIsOnlineOrderModalOpen] =
    React.useState(false);

  const isCreditPersonObject = (cp: any): cp is CreditPerson => {
    return cp && typeof cp === "object" && "name" in cp;
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleOpenOrdersModal = async (product: ProductSalesData) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    const inventoryId = product.inventoryId;

    if (!productOrders[inventoryId]) {
      setLoadingOrders((prev) => ({ ...prev, [inventoryId]: true }));
      try {
        const startDateStr = formatDateForAPI(startDate);
        const endDateStr = formatDateForAPI(endDate);

        const [posResponse, onlineResponse] = await Promise.all([
          fetchOrders(startDateStr, endDateStr),
          fetchOnlineOrders("all"), // We'll filter by date manually if needed, but fetchOnlineOrders currently doesn't support dates in this frontend implementation
        ]);

        let combinedOrders: (Order | OnlineOrder)[] = [];

        if (posResponse.success && posResponse.data.length > 0) {
          const filteredPos = posResponse.data.filter((order) =>
            order.ordersProducts.some(
              (p) => p.inventoryId.productName === product.productName,
            ),
          );
          combinedOrders = [...combinedOrders, ...filteredPos];
        }

        if (onlineResponse.success && onlineResponse.data.length > 0) {
          const filteredOnline = onlineResponse.data.filter((order) => {
            // Check if product is in order
            const hasProduct = order.ordersProducts.some(
              (p) => p.inventoryId.productName === product.productName,
            );
            if (!hasProduct) return false;

            // Check if within date range (manual check since fetchOnlineOrders doesn't support dates yet)
            if (startDateStr || endDateStr) {
              const orderDate = new Date(order.createdAt)
                .toISOString()
                .split("T")[0];
              if (startDateStr && orderDate < startDateStr) return false;
              if (endDateStr && orderDate > endDateStr) return false;
            }
            return true;
          });
          combinedOrders = [...combinedOrders, ...filteredOnline];
        }

        // Sort by date descending
        combinedOrders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setProductOrders((prev) => ({
          ...prev,
          [inventoryId]: combinedOrders,
        }));
      } catch (error) {
        console.error("Error fetching product orders:", error);
      } finally {
        setLoadingOrders((prev) => ({ ...prev, [inventoryId]: false }));
      }
    }
  };

  const isOnlineOrder = (order: Order | OnlineOrder): order is OnlineOrder => {
    return (order as OnlineOrder).customerName !== undefined;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">Loading product sales statistics...</p>
      </div>
    );
  }

  if (!productSalesStatistics?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No product sales data available</p>
      </div>
    );
  }

  const { data } = productSalesStatistics;
  const { totals, products } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">
                Total Quantity Sold
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {totals.totalQuantity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalRevenue.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">
                Unique Products
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {totals.totalUniqueProducts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Product Sales Breakdown ({products.length})
          </h3>
        </div>
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No products found in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Product
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Category
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Quantity Sold
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Total Revenue
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Avg. Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Min Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Max Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Orders
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr
                    key={product.inventoryId}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {product.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.productCode} • {product.SKU}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-slate-400 mt-1">
                            Brand: {product.brand}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                      {product.totalQuantity.toLocaleString()}{" "}
                      {product.unitOfMeasure}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {product.totalRevenue.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {product.averageUnitPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {product.minUnitPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {product.maxUnitPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {product.orderCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenOrdersModal(product)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all font-semibold text-xs border border-primary/20 shadow-sm"
                      >
                        Analytics
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credit Analytics Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Recent Orders: ${selectedProduct?.productName || ""}`}
      >
        <div className="space-y-6">
          {selectedProduct && (
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight">
                      {selectedProduct.productName}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-slate-500 border border-slate-100 shadow-sm uppercase tracking-widest">
                        {selectedProduct.productCode}
                      </span>
                      <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20 shadow-sm uppercase tracking-widest">
                        {selectedProduct.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                      Current Period Sales
                    </p>
                    <p className="text-3xl font-black text-primary">
                      {selectedProduct.totalQuantity.toLocaleString()}{" "}
                      <span className="text-sm text-primary/60 font-bold">
                        {selectedProduct.unitOfMeasure}s
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              {loadingOrders[selectedProduct.inventoryId] ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-600 font-bold text-lg animate-pulse">
                    Searching Recent Orders...
                  </p>
                </div>
              ) : !productOrders[selectedProduct.inventoryId] ||
                productOrders[selectedProduct.inventoryId].length === 0 ? (
                <div className="py-24 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <X className="w-12 h-12 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-700 mb-2">
                    No Recent Orders
                  </h4>
                  <p className="text-slate-400 max-w-xs mx-auto">
                    No orders found containing this product during the selected
                    period.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Order #
                          </th>
                          <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Customer
                          </th>
                          <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                            Qty
                          </th>
                          <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                            Price
                          </th>
                          <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                            Total
                          </th>
                          <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {productOrders[selectedProduct.inventoryId].map(
                          (order) => {
                            const orderProduct = order.ordersProducts.find(
                              (p) =>
                                p.inventoryId.productName ===
                                selectedProduct.productName,
                            );
                            const isOnline = isOnlineOrder(order);

                            return (
                              <tr
                                key={order._id}
                                className="hover:bg-primary/5 transition-all group text-sm"
                              >
                                <td className="px-8 py-6">
                                  <p className="font-black text-slate-800 leading-tight">
                                    {order.orderNumber}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold">
                                      {order.paymentMethod}
                                    </span>
                                    {isOnline && (
                                      <span className="text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 uppercase font-bold flex items-center gap-1">
                                        <Globe className="w-2 h-2" /> Online
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  {isOnline ? (
                                    <div className="flex flex-col">
                                      <p className="font-bold text-slate-700">
                                        {(order as OnlineOrder).customerName}
                                      </p>
                                      <p className="text-xs text-slate-400 font-medium">
                                        {(order as OnlineOrder).customerPhone}
                                      </p>
                                    </div>
                                  ) : (order as Order).creditPersonId &&
                                    typeof (order as Order).creditPersonId ===
                                      "object" ? (
                                    <div className="flex flex-col">
                                      <p className="font-bold text-slate-700">
                                        {
                                          (
                                            (order as Order)
                                              .creditPersonId as CreditPerson
                                          ).name
                                        }
                                      </p>
                                      <p className="text-xs text-slate-400 font-medium">
                                        {
                                          (
                                            (order as Order)
                                              .creditPersonId as CreditPerson
                                          ).phone
                                        }
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      Cash Customer
                                    </span>
                                  )}
                                </td>
                                <td className="px-8 py-6 text-right font-black text-blue-600">
                                  {orderProduct?.quantity || 0}
                                </td>
                                <td className="px-8 py-6 text-right text-slate-600">
                                  {orderProduct?.unitPrice.toLocaleString()}
                                </td>
                                <td className="px-8 py-6 text-right font-bold text-green-600">
                                  {(
                                    (orderProduct?.quantity || 0) *
                                    (orderProduct?.unitPrice || 0)
                                  ).toLocaleString()}
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <button
                                    onClick={() => {
                                      if (isOnline) {
                                        setSelectedOnlineOrder(
                                          order as OnlineOrder,
                                        );
                                        setIsOnlineOrderModalOpen(true);
                                      } else {
                                        setSelectedViewOrder(order as Order);
                                        setIsOrderModalOpen(true);
                                      }
                                    }}
                                    className="w-20 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">
                      Found {productOrders[selectedProduct.inventoryId].length}{" "}
                      transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <span className="text-[10px] font-black text-slate-500 uppercase">
                        Order History (POS & Online)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <OrderDetailModal
        isOpen={isOrderModalOpen}
        order={selectedViewOrder}
        loading={false}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedViewOrder(null);
        }}
      />

      <OnlineOrderDetailModal
        isOpen={isOnlineOrderModalOpen}
        order={selectedOnlineOrder}
        onClose={() => {
          setIsOnlineOrderModalOpen(false);
          setSelectedOnlineOrder(null);
        }}
      />
    </div>
  );
};
