import { UomConversion } from "../types/uom";

export function normalizeUnit(unit: string): string {
  return unit.trim();
}

export function getUnitOptions(
  baseUnit: string,
  conversions?: UomConversion[],
): { value: string; label: string; isBase: boolean }[] {
  const base = normalizeUnit(baseUnit) || "piece";
  const options: { value: string; label: string; isBase: boolean }[] = [
    { value: base, label: base, isBase: true },
  ];
  for (const c of conversions || []) {
    const u = normalizeUnit(c.unit);
    if (u && !options.some((o) => o.value === u)) {
      options.push({ value: u, label: u, isBase: false });
    }
  }
  return options;
}

export function hasUomConversions(conversions?: UomConversion[]): boolean {
  return (conversions?.length ?? 0) > 0;
}

export function getDefaultSellingUnit(
  baseUnit: string,
  conversions?: UomConversion[],
): string {
  const base = normalizeUnit(baseUnit) || "piece";
  const def = conversions?.find((c) => c.isDefaultSellingUnit);
  if (def?.unit?.trim()) return normalizeUnit(def.unit);
  return base;
}

export function getConversionFactor(
  baseUnit: string,
  selectedUnit: string,
  conversions?: UomConversion[],
): number {
  const base = normalizeUnit(baseUnit);
  const selected = normalizeUnit(selectedUnit);
  if (selected === base) return 1;
  const conv = conversions?.find((c) => normalizeUnit(c.unit) === selected);
  return conv?.factor ?? 1;
}

/** Price per one unit of `selectedUnit` (base price is per base unit). */
export function getUnitPrice(
  sellingPrice: number,
  baseUnit: string,
  selectedUnit: string,
  conversions?: UomConversion[],
): number {
  const factor = getConversionFactor(baseUnit, selectedUnit, conversions);
  if (
    normalizeUnit(selectedUnit) === normalizeUnit(baseUnit) ||
    factor <= 0
  ) {
    return sellingPrice;
  }
  return sellingPrice / factor;
}

export function getAvailableQuantityInUnit(
  baseUnit: string,
  selectedUnit: string,
  conversions: UomConversion[] | undefined,
  availableQuantity: number,
  quantityByUnit?: Record<string, number>,
): number {
  const selected = normalizeUnit(selectedUnit);
  if (quantityByUnit && selected in quantityByUnit) {
    return quantityByUnit[selected];
  }
  const factor = getConversionFactor(baseUnit, selectedUnit, conversions);
  if (normalizeUnit(selectedUnit) === normalizeUnit(baseUnit)) {
    return availableQuantity;
  }
  return availableQuantity * factor;
}

export function formatQuantityByUnit(
  quantityByUnit?: Record<string, number>,
): string {
  if (!quantityByUnit || Object.keys(quantityByUnit).length === 0) return "";
  return Object.entries(quantityByUnit)
    .map(([unit, qty]) => `${qty.toLocaleString()} ${unit}`)
    .join(" · ");
}

export function buildOrderProductLine(
  inventoryId: string,
  quantity: number,
  baseUnit: string,
  selectedUnit: string,
): { inventoryId: string; quantity: number; unit?: string } {
  const payload: { inventoryId: string; quantity: number; unit?: string } = {
    inventoryId,
    quantity,
  };
  if (
    selectedUnit &&
    normalizeUnit(selectedUnit) !== normalizeUnit(baseUnit)
  ) {
    payload.unit = normalizeUnit(selectedUnit);
  }
  return payload;
}

export function validateUomConversions(
  baseUnit: string,
  conversions: UomConversion[],
): string | null {
  const base = normalizeUnit(baseUnit);
  if (!base) return "Unit of measure is required";

  const seen = new Set<string>();
  let hasDefault = false;

  for (const row of conversions) {
    const unit = normalizeUnit(row.unit);
    if (!unit) return "Each conversion unit must not be empty";
    if (row.factor <= 0) return "Conversion factor must be greater than 0";
    if (unit === base) {
      return "Conversion unit must not be the same as base unit of measure";
    }
    if (seen.has(unit)) return "Duplicate conversion unit names are not allowed";
    seen.add(unit);
    if (row.isDefaultSellingUnit) hasDefault = true;
  }

  if (conversions.length > 0 && !hasDefault) {
    return "At least one conversion must be marked as default selling unit";
  }

  return null;
}

export function cartLineKey(stockItemId: string, unit: string): string {
  return `${stockItemId}::${normalizeUnit(unit)}`;
}

/** Base units contained in one unit of `unit` (e.g. 1 မူး = 10 ကျင်း → factor 10). */
export function getBaseUnitsPerUnit(
  baseUnit: string,
  unit: string,
  conversions?: UomConversion[],
): number {
  const base = normalizeUnit(baseUnit);
  const u = normalizeUnit(unit);
  if (!u || u === base) return 1;
  return getConversionFactor(baseUnit, unit, conversions);
}

/** Sum mixed unit quantities into total base-unit quantity. */
export function mixedQuantitiesToBaseQuantity(
  baseUnit: string,
  conversions: UomConversion[] | undefined,
  mixed: Record<string, number>,
): number {
  let total = 0;
  for (const [unit, qty] of Object.entries(mixed)) {
    const n = Number(qty);
    if (!n || n <= 0) continue;
    total += n * getBaseUnitsPerUnit(baseUnit, unit, conversions);
  }
  return total;
}

/** Convert base quantity to quantity in `targetUnit` (may be decimal). */
export function baseQuantityToUnitQuantity(
  baseQuantity: number,
  baseUnit: string,
  targetUnit: string,
  conversions?: UomConversion[],
): number {
  if (baseQuantity <= 0) return 0;
  const perUnit = getBaseUnitsPerUnit(baseUnit, targetUnit, conversions);
  if (perUnit <= 0) return baseQuantity;
  return baseQuantity / perUnit;
}

/** Human-readable mixed qty, e.g. "5 ကျင်း 6 မူး". */
export function formatMixedQuantities(
  mixed: Record<string, number>,
): string {
  return Object.entries(mixed)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([unit, qty]) => `${qty} ${unit}`)
    .join(" ");
}

export function hasActiveMixedQuantities(
  mixed?: Record<string, number>,
): boolean {
  if (!mixed) return false;
  return Object.values(mixed).some((q) => Number(q) > 0);
}

/** Empty mixed map with 0 for base + each conversion unit. */
export function createEmptyMixedQuantities(
  baseUnit: string,
  conversions?: UomConversion[],
): Record<string, number> {
  const mixed: Record<string, number> = {};
  for (const opt of getUnitOptions(baseUnit, conversions)) {
    mixed[opt.value] = 0;
  }
  return mixed;
}

/** Order line: mixed units → single decimal qty in default selling unit. */
export function mixedQuantitiesToOrderProduct(
  inventoryId: string,
  baseUnit: string,
  conversions: UomConversion[] | undefined,
  mixed: Record<string, number>,
  sellingPrice: number,
): {
  line: { inventoryId: string; quantity: number; unit?: string };
  baseQuantity: number;
  unitPrice: number;
} {
  const baseQuantity = mixedQuantitiesToBaseQuantity(
    baseUnit,
    conversions,
    mixed,
  );
  const orderUnit = getDefaultSellingUnit(baseUnit, conversions);
  const quantity = roundOrderQuantity(
    baseQuantityToUnitQuantity(
      baseQuantity,
      baseUnit,
      orderUnit,
      conversions,
    ),
  );
  const unitPrice =
    baseQuantity > 0 ? (sellingPrice * baseQuantity) / quantity : sellingPrice;

  const line = buildOrderProductLine(
    inventoryId,
    quantity,
    baseUnit,
    orderUnit,
  );
  return { line, baseQuantity, unitPrice };
}

/** Round to 4 decimal places for API (e.g. 6.5 packs). */
export function roundOrderQuantity(qty: number): number {
  return Math.round(qty * 10000) / 10000;
}
