import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Edit, AlertCircle } from "lucide-react";
import { Product, ProductCategory } from "../types";
import { createProduct } from "../services/Inventory/createProduct";
import { fetchProducts } from "../services/Inventory/fetchProducts";

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
        setApiProducts(response.data);
        const mappedProducts = response.data.map(mapApiProductToProduct);
        setProducts(mappedProducts);
        // Only show success toast if products were loaded (not on initial load)
        if (products.length > 0) {
          toast.success(`Loaded ${mappedProducts.length} products`);
        }
      } else {
        const errorMsg = "Failed to load products: Invalid response format";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to fetch products. Please try again.";
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
      toast.error(
        "Product Name, Product Code, SKU, Buying Price, and Selling Price are required"
      );
      setError(
        "Product Name, Product Code, SKU, Buying Price, and Selling Price are required"
      );
      return;
    }

    if (formData.sellingPrice < formData.buyingPrice) {
      toast.error(
        "Selling Price must be greater than or equal to Buying Price"
      );
      setError("Selling Price must be greater than or equal to Buying Price");
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
      toast.warning(
        "Product updated (local only - API update not implemented)"
      );
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
      toast.success("Product created successfully!");
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to create product. Please try again.";
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
      productCode: p.id, // Using id as productCode for existing products
      saleCode: apiProduct?.saleCode || "",
      SKU: p.id,
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
        <h1 className="text-2xl font-bold text-slate-800">Product Inventory</h1>
        <div className="flex gap-2">
          <button
            onClick={loadProducts}
            disabled={isFetching}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-50"
          >
            {isFetching ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Product
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
            Filter by Category:
          </label>
          <select
            className="border rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {getUniqueCategories().map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>
      )}

      {isFetching && products.length === 0 ? (
        <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
          <p className="text-slate-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
          <p className="text-slate-500">
            {products.length === 0
              ? "No products found. Click 'Add Product' to create one."
              : `No products found in category "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Whse</th>
                <th className="px-4 py-3 text-right">Shop</th>
                <th className="px-4 py-3 text-center">Action</th>
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
                      className="text-blue-600 hover:text-blue-800"
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
              {editingId ? "Edit Product" : "Add New Product"}
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
                  Product Name <span className="text-red-500">*</span>
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
                  Product Code <span className="text-red-500">*</span>
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
                  SKU <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Sale Code
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={formData.saleCode}
                  onChange={(e) =>
                    setFormData({ ...formData, saleCode: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Barcode
                </label>
                <input
                  className="w-full border rounded p-2"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Category <span className="text-red-500">*</span>
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
                    placeholder="Select or type new category"
                  />
                  {categoryShowDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredCategories(
                        categoryInput || formData.category
                      ).map((category) => (
                        <div
                          key={category}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
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
                  Sub Category
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
                    placeholder="Select or type new subcategory"
                  />
                  {subCategoryShowDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getFilteredSubCategories(
                        subCategoryInput || formData.subCategory
                      ).map((subCategory) => (
                        <div
                          key={subCategory}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
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
                  Brand
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
                  Unit of Measure <span className="text-red-500">*</span>
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
                  Description
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
                  Buying Price <span className="text-red-500">*</span>
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
                  Selling Price <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Reorder Point
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
                  Reorder Quantity
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Tax Rate (%)
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Status
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
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="flex-1 border rounded p-2"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    placeholder="Add tag and press Enter"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-slate-200 rounded hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
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
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
