import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Edit, AlertCircle } from "lucide-react";
import { Product, ProductCategory } from "../types";
import { createProduct } from "../services/Inventory/createProduct";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { useLanguage } from "../context/LanguageContext";

// API Form Data Interface
interface ProductFormData {
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
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
}

const UNIT_OF_MEASURE_OPTIONS = [
  "piece",
  "kg",
  "gram",
  "liter",
  "ml",
  "meter",
  "cm",
  "box",
  "pack",
  "carton",
  "dozen",
  "pair",
];
const STATUS_OPTIONS = ["active", "inactive", "discontinued"];

// API Product Response Interface
interface ApiProduct {
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
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  stockWarehouse?: number;
  stockShop?: number;
}

export const Inventory: React.FC = () => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]); // Store full API data for subcategories
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Combobox states for category and subCategory
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [subCategoryShowDropdown, setSubCategoryShowDropdown] = useState(false);

  // Form State - API structure
  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    productCode: "",
    saleCode: "",
    SKU: "",
    barcode: "",
    category: "", // Empty by default, user must select or type
    subCategory: "",
    brand: "",
    description: "",
    buyingPrice: 0,
    sellingPrice: 0,
    unitOfMeasure: "piece",
    reorderPoint: 0,
    reorderQuantity: 0,
    taxRate: 0,
    status: "active",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  // Map API product to local Product type
  const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id || apiProduct._id || "",
      name: apiProduct.productName,
      category:
        (apiProduct.category as ProductCategory) || ProductCategory.OTHER,
      stockWarehouse: apiProduct.stockWarehouse || 0,
      stockShop: apiProduct.stockShop || 0,
      costPrice: apiProduct.buyingPrice,
      sellingPrice: apiProduct.sellingPrice,
      lowStockThreshold: apiProduct.reorderPoint || 0,
    };
  };

  // Fetch products from API
  const loadProducts = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetchProducts();
      if (response.success && response.data) {
        // Store full API products for subcategory extraction
        // Cast to ApiProduct[] since API returns full product data, not mapped Product type
        const apiData = response.data as unknown as ApiProduct[];
        setApiProducts(apiData);
        const mappedProducts = apiData.map(mapApiProductToProduct);
        setProducts(mappedProducts);
        // Only show success toast if products were loaded (not on initial load)
        if (products.length > 0) {
          toast.success(
            t("inventory.loadedProducts").replace(
              "{count}",
              mappedProducts.length.toString()
            )
          );
        }
      } else {
        const errorMsg = t("inventory.failedToLoadInvalid");
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err.message || t("inventory.failedToFetch");
      toast.error(errorMessage);
      setError(errorMessage);
      console.error("Error loading products:", err);

      // If it's an API configuration error, provide helpful guidance
      if (
        errorMessage.includes("API endpoint not found") ||
        errorMessage.includes("Network error")
      ) {
        console.warn(
          "💡 Tip: Make sure to set VITE_API_BASE_URL in your .env.local file.\n" +
            "Example: VITE_API_BASE_URL=http://localhost:8000/api"
        );
      }
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      productName: "",
      productCode: "",
      saleCode: "",
      SKU: "",
      barcode: "",
      category: "", // Empty by default, user must select or type
      subCategory: "",
      brand: "",
      description: "",
      buyingPrice: 0,
      sellingPrice: 0,
      unitOfMeasure: "piece",
      reorderPoint: 0,
      reorderQuantity: 0,
      taxRate: 0,
      status: "active",
      tags: [],
    });
    setTagInput("");
    setCategoryInput("");
    setSubCategoryInput("");
    setCategoryShowDropdown(false);
    setSubCategoryShowDropdown(false);
    setError(null);
  };

  const handleSave = async () => {
    // Validation
    if (
      !formData.productName ||
      !formData.productCode ||
      !formData.SKU ||
      !formData.buyingPrice ||
      !formData.sellingPrice
    ) {
      const errorMsg = t("inventory.requiredFieldsError");
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (formData.sellingPrice < formData.buyingPrice) {
      const errorMsg = t("inventory.sellingPriceError");
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (editingId) {
      // For editing, update local state and refresh from API
      // Note: For full implementation, you should implement PUT/PATCH API endpoint
      // and update the product via API instead of local state
      const updatedProducts = products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: formData.productName,
              category: formData.category as ProductCategory,
              costPrice: formData.buyingPrice,
              sellingPrice: formData.sellingPrice,
              lowStockThreshold: formData.reorderPoint || 0,
            }
          : p
      );
      setProducts(updatedProducts);
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      // TODO: Implement PUT/PATCH API call to update product on server
      toast.warning(t("inventory.productUpdatedLocal"));
      return;
    }

    // Create new product via API
    setIsLoading(true);
    setError(null);

    try {
      // Prepare API payload - only include fields that have values (except required ones)
      const apiPayload: any = {
        productName: formData.productName,
        productCode: formData.productCode,
        SKU: formData.SKU,
        category: formData.category || "Unknown",
        buyingPrice: formData.buyingPrice,
        sellingPrice: formData.sellingPrice,
        unitOfMeasure: formData.unitOfMeasure || "piece",
      };

      // Add optional fields only if they have values
      if (formData.saleCode) apiPayload.saleCode = formData.saleCode;
      if (formData.barcode) apiPayload.barcode = formData.barcode;
      if (formData.subCategory) apiPayload.subCategory = formData.subCategory;
      if (formData.brand) apiPayload.brand = formData.brand;
      if (formData.description) apiPayload.description = formData.description;
      if (formData.reorderPoint !== undefined && formData.reorderPoint > 0)
        apiPayload.reorderPoint = formData.reorderPoint;
      if (
        formData.reorderQuantity !== undefined &&
        formData.reorderQuantity > 0
      )
        apiPayload.reorderQuantity = formData.reorderQuantity;
      if (formData.taxRate !== undefined && formData.taxRate > 0)
        apiPayload.taxRate = formData.taxRate;
      if (formData.status) apiPayload.status = formData.status;
      if (formData.tags && formData.tags.length > 0)
        apiPayload.tags = formData.tags;

      await createProduct(apiPayload);

      setIsModalOpen(false);
      resetForm();
      // Refresh products list after creating
      await loadProducts();
      toast.success(t("inventory.productCreated"));
    } catch (err: any) {
      const errorMessage = err.message || t("inventory.failedToCreate");
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tagToRemove) || [],
    });
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    // Find the full API product to get all details including subCategory
    const apiProduct = apiProducts.find((ap) => (ap.id || ap._id) === p.id);

    // Map existing product to form data
    setFormData({
      productName: p.name,
      productCode: apiProduct?.productCode || "", // Using id as productCode for existing products
      saleCode: apiProduct?.saleCode || "",
      SKU: apiProduct?.SKU || "",
      barcode: apiProduct?.barcode || "",
      category: p.category,
      subCategory: apiProduct?.subCategory || "",
      brand: apiProduct?.brand || "",
      description: apiProduct?.description || "",
      buyingPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      unitOfMeasure: apiProduct?.unitOfMeasure || "piece",
      reorderPoint: p.lowStockThreshold,
      reorderQuantity: apiProduct?.reorderQuantity || 0,
      taxRate: apiProduct?.taxRate || 0,
      status: apiProduct?.status || "active",
      tags: apiProduct?.tags || [],
    });

    // Set input values for comboboxes
    setCategoryInput("");
    setSubCategoryInput(apiProduct?.subCategory || "");
    setIsModalOpen(true);
  };

  // Get unique categories from API products only
  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    // Only get categories from API products
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Get unique subcategories from API products
  const getUniqueSubCategories = (): string[] => {
    const subCategories = new Set<string>();
    apiProducts.forEach((p) => {
      if (p.subCategory && p.subCategory.trim()) {
        subCategories.add(p.subCategory);
      }
    });
    return Array.from(subCategories).sort();
  };

  // Filter categories/subcategories based on input
  const getFilteredCategories = (input: string): string[] => {
    const allCategories = getUniqueCategories();
    if (!input.trim()) return allCategories;
    return allCategories.filter((cat) =>
      cat.toLowerCase().includes(input.toLowerCase())
    );
  };

  const getFilteredSubCategories = (input: string): string[] => {
    const allSubCategories = getUniqueSubCategories();
    if (!input.trim()) return allSubCategories;
    return allSubCategories.filter((subCat) =>
      subCat.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Filter products based on selected category
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {t("inventory.title")}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={loadProducts}
            disabled={isFetching}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-50"
          >
            {isFetching ? t("common.loading") : t("inventory.refresh")}
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-btn-primary text-dark px-4 py-2 rounded hover:bg-btn-primary-hover"
          >
            + {t("inventory.addProduct")}
          </button>
        </div>
      </div>

      {error && !isFetching && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Category Filter */}
      {products.length > 0 && (
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">
            {t("inventory.filterByCategory")}:
          </label>
          <select
            className="border rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">{t("inventory.allCategories")}</option>
            {getUniqueCategories().map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">
            {t("inventory.showing")
              .replace("{count}", filteredProducts.length.toString())
              .replace("{total}", products.length.toString())}
          </span>
        </div>
      )}

      {isFetching && products.length === 0 ? (
        <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
          <p className="text-slate-500">{t("inventory.loadingProducts")}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
          <p className="text-slate-500">
            {products.length === 0
              ? t("inventory.noProductsFound")
              : t("inventory.noProductsInCategory").replace(
                  "{category}",
                  selectedCategory
                )}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-4 py-3">{t("inventory.productName")}</th>
                <th className="px-4 py-3">{t("inventory.category")}</th>
                <th className="px-4 py-3 text-right">{t("inventory.cost")}</th>
                <th className="px-4 py-3 text-right">{t("inventory.price")}</th>
                <th className="px-4 py-3 text-right">{t("inventory.whse")}</th>
                <th className="px-4 py-3 text-right">{t("inventory.shop")}</th>
                <th className="px-4 py-3 text-center">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.category}</td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {p.costPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {p.sellingPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">{p.stockWarehouse}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`${
                        p.stockShop < p.lowStockThreshold
                          ? "text-red-600 font-bold flex items-center justify-end gap-1"
                          : ""
                      }`}
                    >
                      {p.stockShop < p.lowStockThreshold && (
                        <AlertCircle className="w-3 h-3" />
                      )}{" "}
                      {p.stockShop}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-primary hover:text-primary-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, productCode: e.target.value })
                  }
                  disabled={!!editingId}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.sku")} <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={formData.SKU}
                  onChange={(e) =>
                    setFormData({ ...formData, SKU: e.target.value })
                  }
                  disabled={!!editingId}
                />
              </div>

              {/* <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.saleCode")}
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={formData.saleCode}
                  onChange={(e) =>
                    setFormData({ ...formData, saleCode: e.target.value })
                  }
                />
              </div> */}

              {/* <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.barcode")}
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                />
              </div> */}

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.category")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border rounded p-2 pr-8"
                    value={categoryInput || formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategoryInput(value);
                      setFormData({ ...formData, category: value });
                      setCategoryShowDropdown(true);
                    }}
                    onFocus={() => setCategoryShowDropdown(true)}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => setCategoryShowDropdown(false), 200);
                    }}
                    placeholder={t("inventory.categoryPlaceholder")}
                  />
                  {categoryShowDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredCategories(
                        categoryInput || formData.category
                      ).map((category) => (
                        <div
                          key={category}
                          className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, category });
                            setCategoryInput("");
                            setCategoryShowDropdown(false);
                          }}
                        >
                          {category}
                        </div>
                      ))}
                      {/* {getFilteredCategories(categoryInput || formData.category)
                        .length === 0 && (
                        <div className="px-4 py-2 text-slate-500 text-sm">
                          No matching categories. Type to create new.
                        </div>
                      )} */}
                    </div>
                  )}
                </div>
              </div>

              <div>
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
                      setFormData({ ...formData, subCategory: value });
                      setSubCategoryShowDropdown(true);
                    }}
                    onFocus={() => setSubCategoryShowDropdown(true)}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => setSubCategoryShowDropdown(false), 200);
                    }}
                    placeholder={t("inventory.subCategoryPlaceholder")}
                  />
                  {subCategoryShowDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredSubCategories(
                        subCategoryInput || formData.subCategory
                      ).map((subCategory) => (
                        <div
                          key={subCategory}
                          className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, subCategory });
                            setSubCategoryInput("");
                            setSubCategoryShowDropdown(false);
                          }}
                        >
                          {subCategory}
                        </div>
                      ))}
                      {/* {getFilteredSubCategories(
                        subCategoryInput || formData.subCategory
                      ).length === 0 && (
                        <div className="px-4 py-2 text-slate-500 text-sm">
                          No matching subcategories. Type to create new.
                        </div>
                      )} */}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.brand")}
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.unitOfMeasure")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded p-2"
                  value={formData.unitOfMeasure}
                  onChange={(e) =>
                    setFormData({ ...formData, unitOfMeasure: e.target.value })
                  }
                >
                  {UNIT_OF_MEASURE_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500">
                  {t("common.description")}
                </label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

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
                    setFormData({
                      ...formData,
                      buyingPrice: Number(e.target.value),
                    })
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
                    setFormData({
                      ...formData,
                      sellingPrice: Number(e.target.value),
                    })
                  }
                />
              </div>
              {/* 
              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.reorderPoint")}
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded p-2"
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderPoint: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.reorderQuantity")}
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded p-2"
                  value={formData.reorderQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderQuantity: Number(e.target.value),
                    })
                  }
                />
              </div> */}
              {/* 
              <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.taxRate")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full border rounded p-2"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxRate: Number(e.target.value),
                    })
                  }
                />
              </div> */}

              {/* <div>
                <label className="block text-xs font-bold text-slate-500">
                  {t("inventory.status")}
                </label>
                <select
                  className="w-full border rounded p-2"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div> */}

              {/* <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  {t("inventory.tags")}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="flex-1 border rounded p-2"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    placeholder={t("inventory.addTagPlaceholder")}
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-slate-200 rounded hover:bg-slate-300"
                  >
                    {t("common.add")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/20 text-primary-700 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-primary hover:text-primary-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div> */}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-btn-primary text-dark rounded hover:bg-btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t("inventory.saving") : t("inventory.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
