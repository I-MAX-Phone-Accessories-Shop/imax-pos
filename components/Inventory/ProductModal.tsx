import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Layers, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Product } from "../../types";
import { UomConversion } from "../../types/uom";
import { useLanguage } from "../../context/LanguageContext";
import { UomConversionsEditor } from "./UomConversionsEditor";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;

// const UNIT_OF_MEASURE_OPTIONS = [
//   "piece",
//   "kg",
//   "gram",
//   "liter",
//   "ml",
//   "meter",
//   "cm",
//   "box",
//   "pack",
//   "carton",
//   "dozen",
//   "pair",
// ];

export interface WholesalePriceTier {
  quantity: number;
  price: number;
  unit?: string;
}

export const sanitizeWholesalePricesForApi = (
  tiers?: WholesalePriceTier[],
): Array<{ quantity: number; price: number; unit?: string }> | undefined => {
  if (!tiers?.length) return undefined;

  const result = tiers
    .filter((t) => t.quantity > 0 && t.price >= 0)
    .map(({ quantity, price, unit }) => ({
      quantity,
      price,
      ...(unit?.trim() ? { unit: unit.trim() } : {}),
    }));

  return result.length > 0 ? result : undefined;
};

export interface ProductFormData {
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions: UomConversion[];
  wholesalePrices?: WholesalePriceTier[];
  images?: File[];
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
}

export interface ApiProduct {
  _id?: string;
  id?: string;
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions: UomConversion[];
  wholesalePrices?: WholesalePriceTier[];
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
  stockWarehouse?: number;
  stockShop?: number;
}

interface ProductModalProps {
  isOpen: boolean;
  editingId: string | null;
  formData: ProductFormData;
  error: string | null;
  isLoading: boolean;
  products: Product[];
  apiProducts: ApiProduct[];
  onClose: () => void;
  onSave: () => void;
  onFormDataChange: (data: ProductFormData) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  editingId,
  formData,
  error,
  isLoading,
  products,
  apiProducts,
  onClose,
  onSave,
  onFormDataChange,
}) => {
  const { t } = useLanguage();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isImageDragOver, setIsImageDragOver] = useState(false);

  // Combobox states for category and subCategory
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);
  // const [subCategoryInput, setSubCategoryInput] = useState("");
  // const [subCategoryShowDropdown, setSubCategoryShowDropdown] = useState(false);

  // Get unique categories from products
  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Get unique subcategories from API products
  // const getUniqueSubCategories = (): string[] => {
  //   const subCategories = new Set<string>();
  //   apiProducts.forEach((p) => {
  //     if (p.subCategory && p.subCategory.trim()) {
  //       subCategories.add(p.subCategory);
  //     }
  //   });
  //   return Array.from(subCategories).sort();
  // };

  // Filter categories/subcategories based on input
  const getFilteredCategories = (input: string): string[] => {
    const allCategories = getUniqueCategories();
    if (!input.trim()) return allCategories;
    return allCategories.filter((cat) =>
      cat.toLowerCase().includes(input.toLowerCase()),
    );
  };

  // const getFilteredSubCategories = (input: string): string[] => {
  //   const allSubCategories = getUniqueSubCategories();
  //   if (!input.trim()) return allSubCategories;
  //   return allSubCategories.filter((subCat) =>
  //     subCat.toLowerCase().includes(input.toLowerCase())
  //   );
  // };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  useEffect(() => {
    const files = formData.images || [];
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  const wholesalePrices = formData.wholesalePrices || [];
  const productImages = formData.images || [];

  const addWholesaleRow = () => {
    updateFormData({
      wholesalePrices: [...wholesalePrices, { quantity: 0, price: 0, unit: "" }],
    });
  };

  const updateWholesaleRow = (
    index: number,
    field: "unit" | "quantity" | "price",
    value: string | number,
  ) => {
    const next = wholesalePrices.map((row, i) =>
      i === index ? { ...row, [field]: value } : row,
    );
    updateFormData({ wholesalePrices: next });
  };

  const removeWholesaleRow = (index: number) => {
    updateFormData({
      wholesalePrices: wholesalePrices.filter((_, i) => i !== index),
    });
  };

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed";
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`;
    }
    return null;
  };

  const addImageFiles = (incoming: File[]) => {
    const valid: File[] = [];
    for (const file of incoming) {
      const err = validateImageFile(file);
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    updateFormData({ images: [...productImages, ...valid] });
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addImageFiles(files);
    e.target.value = "";
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsImageDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    addImageFiles(files);
  };

  const removeImageAt = (index: number) => {
    updateFormData({
      images: productImages.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingId
            ? t("inventory.editProduct")
            : t("inventory.addNewProduct")}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Required Fields */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.productName")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.productName}
              onChange={(e) => {
                const productName = e.target.value;
                updateFormData({ productName, productCode: productName });
              }}
            />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.barcode")}
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.barcode || ""}
              onChange={(e) => updateFormData({ barcode: e.target.value })}
              placeholder={t("inventory.barcode") || "Enter barcode"}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.productCode")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.productCode}
              onChange={(e) => updateFormData({ productCode: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.sku")}
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.SKU}
              onChange={(e) => updateFormData({ SKU: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.category")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full border rounded p-2 pr-8"
                value={categoryInput || formData.category}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategoryInput(value);
                  updateFormData({ category: value });
                  setCategoryShowDropdown(true);
                }}
                onFocus={() => setCategoryShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setCategoryShowDropdown(false), 200);
                }}
                placeholder={t("inventory.categoryPlaceholder")}
              />
              {categoryShowDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredCategories(
                    categoryInput || formData.category,
                  ).map((category) => (
                    <div
                      key={category}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateFormData({ category });
                        setCategoryInput("");
                        setCategoryShowDropdown(false);
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.subCategory")}
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full border rounded p-2 pr-8"
                value={subCategoryInput || formData.subCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setSubCategoryInput(value);
                  updateFormData({ subCategory: value });
                  setSubCategoryShowDropdown(true);
                }}
                onFocus={() => setSubCategoryShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setSubCategoryShowDropdown(false), 200);
                }}
                placeholder={t("inventory.subCategoryPlaceholder")}
              />
              {subCategoryShowDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredSubCategories(
                    subCategoryInput || formData.subCategory,
                  ).map((subCategory) => (
                    <div
                      key={subCategory}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateFormData({ subCategory });
                        setSubCategoryInput("");
                        setSubCategoryShowDropdown(false);
                      }}
                    >
                      {subCategory}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.brand")}
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.brand}
              onChange={(e) => updateFormData({ brand: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.unitOfMeasure")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.unitOfMeasure}
              onChange={(e) =>
                updateFormData({ unitOfMeasure: e.target.value })
              }
              placeholder={t("inventory.unitOfMeasurePlaceholder")}
            />
          </div>

          {/* <UomConversionsEditor
            baseUnit={formData.unitOfMeasure}
            conversions={formData.uomConversions}
            onChange={(uomConversions) => updateFormData({ uomConversions })}
          /> */}

          {/* <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500">
              {t("common.description")}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
            />
          </div> */}

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.buyingPrice")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border rounded p-2"
              value={formData.buyingPrice}
              onChange={(e) =>
                updateFormData({ buyingPrice: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.sellingPrice")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border rounded p-2"
              value={formData.sellingPrice}
              onChange={(e) =>
                updateFormData({ sellingPrice: Number(e.target.value) })
              }
            />
          </div>

          {/* Wholesale prices */}
          <div className="col-span-2">
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Wholesale prices
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bulk quantity tiers and unit prices (MMK)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addWholesaleRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add tier
                </button>
              </div>

              {wholesalePrices.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-amber-200/80 bg-white/60 py-8 text-center">
                  <p className="text-sm text-slate-500 mb-3">
                    No wholesale tiers yet
                  </p>
                  <button
                    type="button"
                    onClick={addWholesaleRow}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add first tier
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Unit (optional)</span>
                    <span>Min quantity</span>
                    <span>Price (MMK)</span>
                    <span className="w-9" />
                  </div>
                  {wholesalePrices.map((wp, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-white rounded-lg border border-slate-100 p-2 shadow-sm"
                    >
                      <div>
                        <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase">
                          Unit (optional)
                        </label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                          value={wp.unit ?? ""}
                          onChange={(e) =>
                            updateWholesaleRow(idx, "unit", e.target.value)
                          }
                          placeholder="e.g. ပုံး"
                        />
                      </div>
                      <div>
                        <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase">
                          Min quantity
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                          value={wp.quantity || ""}
                          onChange={(e) =>
                            updateWholesaleRow(
                              idx,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          placeholder="e.g. 100"
                        />
                      </div>
                      <div>
                        <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase">
                          Price (MMK)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                          value={wp.price || ""}
                          onChange={(e) =>
                            updateWholesaleRow(
                              idx,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          placeholder="e.g. 65000"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWholesaleRow(idx)}
                        className="flex items-center justify-center w-full sm:w-9 h-9 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                        aria-label="Remove wholesale tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product images */}
          <div className="col-span-2">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <ImagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Product images
                  </h3>
                  <p className="text-xs text-slate-500">
                    JPEG, PNG, WebP — max {MAX_IMAGE_SIZE_MB}MB each
                  </p>
                </div>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleImageInputChange}
                className="hidden"
              />

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    imageInputRef.current?.click();
                  }
                }}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsImageDragOver(true);
                }}
                onDragLeave={() => setIsImageDragOver(false)}
                onDrop={handleImageDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-6 text-center ${
                  isImageDragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-slate-200 bg-white/70 hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="p-3 rounded-full bg-slate-100 text-slate-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Drop images here or click to browse
                  </p>
                  <p className="text-xs text-slate-400">
                    You can select multiple files
                  </p>
                </div>
              </div>

              {productImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Preview ({productImages.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {productImages.map((file, idx) => (
                      <div
                        key={`${file.name}-${file.size}-${idx}`}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
                      >
                        <img
                          src={imagePreviewUrls[idx]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                          <p className="text-[10px] text-white truncate font-medium">
                            {file.name}
                          </p>
                          <p className="text-[9px] text-white/80">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImageAt(idx);
                          }}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFormData({ images: [] })}
                    className="mt-3 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                  >
                    Clear all images
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500">
              {t("pos.note") || "Note"}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={2}
              value={formData.note || ""}
              onChange={(e) => updateFormData({ note: e.target.value })}
              placeholder={t("pos.notePlaceholder") || "Enter product note..."}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t("inventory.saving") : t("inventory.save")}
          </button>
        </div>
      </div>
    </div>
  );
};
