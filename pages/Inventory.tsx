import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Product, ProductCategory } from "../types";
import { createProduct } from "../services/Inventory/createProduct";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { useLanguage } from "../context/LanguageContext";
import { InventoryTable } from "../components/Inventory/InventoryTable";
import { CategoryFilter } from "../components/Inventory/CategoryFilter";
import {
  ProductModal,
  ProductFormData,
  ApiProduct,
} from "../components/Inventory/ProductModal";
import { ProductDetailModal } from "../components/Inventory/ProductDetailModal";
import {
  fetchProductById,
  ProductDetail,
} from "../services/Inventory/fetchProductById";

export const Inventory: React.FC = () => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form State - API structure
  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    productCode: "",
    saleCode: "",
    SKU: "",
    barcode: "",
    category: "",
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

  // Map API product to local Product type
  const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
    return {
      productCode: apiProduct.productCode,
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
        console.warn("Error loading products: " + errorMessage);
      }
    } finally {
      setIsFetching(false);
    }
  };

  console.log("products", products);

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
      category: "",
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

  const openEdit = (p: Product) => {
    console.log("", p);
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

    setIsModalOpen(true);
  };

  const handleViewDetails = async (productId: string) => {
    setLoadingDetail(true);
    setSelectedProductDetail(null);
    setIsDetailModalOpen(true);
    try {
      const response = await fetchProductById(productId);
      if (response.success && response.data) {
        setSelectedProductDetail(response.data);
      } else {
        toast.error(response.message || t("inventory.failedToLoadDetails"));
      }
    } catch (error) {
      console.error("Error loading product details:", error);
      toast.error(t("inventory.failedToLoadDetails"));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter products based on selected category
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // console.log("filteredProducts", filteredProducts);

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
      <CategoryFilter
        products={products}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        filteredCount={filteredProducts.length}
        totalCount={products.length}
      />

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
        <InventoryTable
          products={filteredProducts}
          onEdit={openEdit}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        error={error}
        isLoading={isLoading}
        products={products}
        apiProducts={apiProducts}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          resetForm();
        }}
        onSave={handleSave}
        onFormDataChange={setFormData}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        loading={loadingDetail}
        product={selectedProductDetail}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProductDetail(null);
          setLoadingDetail(false);
        }}
      />
    </div>
  );
};
