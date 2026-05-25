import { StorefrontStockItem } from "../services/Storefront/fetchStorefrontStock";
import {
  buildOrderProductLine,
  cartLineKey,
  createEmptyMixedQuantities,
  getAvailableQuantityInUnit,
  getDefaultSellingUnit,
  getUnitPrice,
  hasActiveMixedQuantities,
  mixedQuantitiesToBaseQuantity,
  mixedQuantitiesToOrderProduct,
} from "./uom";

export interface UomCartItem {
  stockItem: StorefrontStockItem;
  /** Single-unit mode quantity (ignored when mixedQuantities is active). */
  qty: number;
  selectedUnit: string;
  /** Per-unit quantities, e.g. { "ကျင်း": 5, "မူး": 6 }. */
  mixedQuantities?: Record<string, number>;
}

export function isMixedCartLine(item: UomCartItem): boolean {
  return hasActiveMixedQuantities(item.mixedQuantities);
}

export function usesMixedUnitInput(
  stockItem: StorefrontStockItem,
): boolean {
  const conv = stockItem.inventoryId.uomConversions;
  return (conv?.length ?? 0) > 0;
}

export function getInventoryUomFromStock(stockItem: StorefrontStockItem) {
  const inv = stockItem.inventoryId;
  return {
    baseUnit: inv.unitOfMeasure?.trim() || "piece",
    conversions: inv.uomConversions,
  };
}

export function createCartLine(
  stockItem: StorefrontStockItem,
  qty = 1,
): UomCartItem {
  const { baseUnit, conversions } = getInventoryUomFromStock(stockItem);
  const defaultUnit = getDefaultSellingUnit(baseUnit, conversions);

  if (usesMixedUnitInput(stockItem)) {
    const mixedQuantities = createEmptyMixedQuantities(baseUnit, conversions);
    mixedQuantities[defaultUnit] = qty;
    return {
      stockItem,
      qty,
      selectedUnit: defaultUnit,
      mixedQuantities,
    };
  }

  return {
    stockItem,
    qty,
    selectedUnit: defaultUnit,
  };
}

export function getCartLineId(item: UomCartItem): string {
  if (isMixedCartLine(item) || usesMixedUnitInput(item.stockItem)) {
    return item.stockItem._id;
  }
  return cartLineKey(item.stockItem._id, item.selectedUnit);
}

export function getCartLineBaseQuantity(item: UomCartItem): number {
  const { baseUnit, conversions } = getInventoryUomFromStock(item.stockItem);
  const mixed =
    item.mixedQuantities ??
    ({ [item.selectedUnit]: item.qty } as Record<string, number>);
  return mixedQuantitiesToBaseQuantity(baseUnit, conversions, mixed);
}

export function getCartLineUnitPrice(item: UomCartItem): number {
  const { baseUnit, conversions } = getInventoryUomFromStock(item.stockItem);
  const sellingPrice = item.stockItem.inventoryId.sellingPrice || 0;

  if (isMixedCartLine(item)) {
    return sellingPrice;
  }

  return getUnitPrice(
    sellingPrice,
    baseUnit,
    item.selectedUnit,
    conversions,
  );
}

export function getCartLineMaxQty(item: UomCartItem): number {
  const { baseUnit, conversions } = getInventoryUomFromStock(item.stockItem);
  return item.stockItem.availableQuantity;
}

export function getCartLineMaxBaseQuantity(item: UomCartItem): number {
  return item.stockItem.availableQuantity;
}

export function cartLineToOrderProduct(item: UomCartItem) {
  const { baseUnit, conversions } = getInventoryUomFromStock(item.stockItem);
  const inventoryId = item.stockItem.inventoryId._id;
  const sellingPrice = item.stockItem.inventoryId.sellingPrice || 0;

  if (isMixedCartLine(item) && item.mixedQuantities) {
    return mixedQuantitiesToOrderProduct(
      inventoryId,
      baseUnit,
      conversions,
      item.mixedQuantities,
      sellingPrice,
    ).line;
  }

  return buildOrderProductLine(
    inventoryId,
    item.qty,
    baseUnit,
    item.selectedUnit,
  );
}

export function cartLineSubtotal(item: UomCartItem): number {
  const sellingPrice = item.stockItem.inventoryId.sellingPrice || 0;

  if (isMixedCartLine(item) && item.mixedQuantities) {
    const baseQty = getCartLineBaseQuantity(item);
    return sellingPrice * baseQty;
  }

  return getCartLineUnitPrice(item) * item.qty;
}
