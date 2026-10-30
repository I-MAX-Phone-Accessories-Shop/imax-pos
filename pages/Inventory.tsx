import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Product, ProductCategory } from "../types";
import { createProduct } from "../services/Inventory/createProduct";
import { updateProduct } from "../services/Inventory/updateProduct";
import {
  fetchProducts,
  ProductsPagination,
} from "../services/Inventory/fetchProducts";
import { fetchInventoryCategories } from "../services/Inventory/fetchInventoryCategories";
import { transferInventoryToWarehouse } from "../services/Inventory/transferInventoryToWarehouse";
import { transferInventoryToStorefront } from "../services/Inventory/transferInventoryToStorefront";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
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
import { WarehouseProfile } from "../types";
import { Building2, X, Loader2, Store } from "lucide-react";
import { SearchInput } from "../components/Inventory/SearchInput";
import { Pagination } from "../components/Inventory/Pagination";

export const Inventory: React.FC = () => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page, search and category live in the URL so refresh/back keep them
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const appliedSearch = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "All";
  const [pagination, setPagination] = useState<ProductsPagination | null>(
    null,
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<
    Record<string, string[]>
  >({});
  // Ignore responses from requests that are no longer the latest
  const requestIdRef = useRef(0);
  const tableTopRef = useRef<HTMLDivElement>(null);
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Transfer to Warehouse State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseProfile[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [showSelectBoxes, setShowSelectBoxes] = useState(false);
  const [transferMode, setTransferMode] = useState<
    "warehouse" | "storefront" | null
  >(null);

  // Transfer to Storefront State
  const [isTransferStorefrontModalOpen, setIsTransferStorefrontModalOpen] =
    useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [isTransferringToStorefront, setIsTransferringToStorefront] =
    useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState(appliedSearch);

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

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    // An empty value removes the param
    Object.entries(updates).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setSearchParams(next, { replace: true });
  };

  // Fetch the current page of products from API
  const loadProducts = async (notify = false) => {
    const requestId = ++requestIdRef.current;
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetchProducts({
        page,
        search: appliedSearch,
        category: selectedCategory,
      });
      if (requestId !== requestIdRef.current) return;
      if (response.success && response.data) {
        // Page no longer exists (e.g. fewer results now): go to the last page
        if (response.pagination && page > response.pagination.totalPages) {
          updateParams({
            page:
              response.pagination.totalPages > 1
                ? response.pagination.totalPages.toString()
                : "",
          });
          return;
        }
        setPagination(response.pagination || null);
        // Store full API products for subcategory extraction
        // Cast to ApiProduct[] since API returns full product data, not mapped Product type
        const apiData = response.data as unknown as ApiProduct[];
        setApiProducts(apiData);
        const mappedProducts = apiData.map(mapApiProductToProduct);
        setProducts(mappedProducts);
        // Only show success toast on a manual refresh
        if (notify) {
          toast.success(
            t("inventory.loadedProducts").replace(
              "{count}",
              mappedProducts.length.toString(),
            ),
          );
        }
      } else {
        const errorMsg = t("inventory.failedToLoadInvalid");
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
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
      if (requestId === requestIdRef.current) setIsFetching(false);
    }
  };

  const loadCategories = async () => {
    const response = await fetchInventoryCategories();
    if (response.success) {
      setCategories(response.data.categories);
      setSubCategories(response.data.subCategories);
    }
  };

  // Load supporting data once
  useEffect(() => {
    loadCategories();
    loadWarehouses();
    loadStorefronts();
  }, []);

  // Fetch products whenever page, search or category changes, and drop any
  // selection so transfers only ever act on visible items
  useEffect(() => {
    setSelectedProductIds([]);
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedSearch, selectedCategory]);

  // Debounce typing into the search box, then reset to page 1
  useEffect(() => {
    if (searchQuery.trim() === appliedSearch) return;
    const timer = setTimeout(() => {
      updateParams({ search: searchQuery.trim(), page: "" });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Keep the box in sync when the URL changes from outside (e.g. back button)
  useEffect(() => {
    if (searchQuery.trim() !== appliedSearch) setSearchQuery(appliedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch]);

  const handleCategoryChange = (category: string) => {
    updateParams({ category: category === "All" ? "" : category, page: "" });
  };

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: nextPage > 1 ? nextPage.toString() : "" });
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadWarehouses = async () => {
    try {
      const response = await fetchWarehouseProfiles();
      if (response.success && response.data) {
        setWarehouses(
          response.data.filter((w: WarehouseProfile) => w.status === "active"),
        );
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadStorefronts = async () => {
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(
          response.data.filter(
            (s: StorefrontProfile) => s.status === "active" && !s.isDeleted,
          ),
        );
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }
  };

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
      // Update existing product via API
      setIsLoading(true);
      setError(null);

      try {
        // Prepare API payload matching the update endpoint structure
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
        if (formData.reorderPoint !== undefined && formData.reorderPoint >= 0)
          apiPayload.reorderPoint = formData.reorderPoint;
        if (
          formData.reorderQuantity !== undefined &&
          formData.reorderQuantity >= 0
        )
          apiPayload.reorderQuantity = formData.reorderQuantity;
        if (formData.taxRate !== undefined && formData.taxRate >= 0)
          apiPayload.taxRate = formData.taxRate;
        if (formData.status) apiPayload.status = formData.status;
        if (formData.tags && formData.tags.length > 0)
          apiPayload.tags = formData.tags;

        await updateProduct(editingId, apiPayload);

        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
        // Refresh the current page (and categories, which may have changed)
        await Promise.all([loadProducts(), loadCategories()]);
        toast.success(
          t("inventory.productUpdated") || "Product updated successfully",
        );
      } catch (err: any) {
        const errorMessage =
          err.message ||
          t("inventory.failedToUpdate") ||
          "Failed to update product";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
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
        category: formData.category || "Unknown",
        buyingPrice: formData.buyingPrice,
        sellingPrice: formData.sellingPrice,
        unitOfMeasure: formData.unitOfMeasure || "piece",
      };

      // Add SKU only if it has a value, otherwise provide a default
      if (formData.SKU) {
        apiPayload.SKU = formData.SKU;
      } else {
        // Generate a default SKU if not provided
        apiPayload.SKU = `SKU-${Date.now()}`;
      }

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
      // Refresh the current page (and categories, a new one may exist)
      await Promise.all([loadProducts(), loadCategories()]);
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

  // Search and category are applied server-side; this is the current page
  const filteredProducts = products;

  // Selection handlers
  const handleSelectionChange = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProductIds([...selectedProductIds, productId]);
    } else {
      setSelectedProductIds(
        selectedProductIds.filter((id) => id !== productId),
      );
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleOpenTransferModal = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setSelectedWarehouseId("");
  };

  const handleOpenTransferStorefrontModal = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }
    setIsTransferStorefrontModalOpen(true);
  };

  const handleCloseTransferStorefrontModal = () => {
    setIsTransferStorefrontModalOpen(false);
    setSelectedStorefrontId("");
  };

  const handleTransfer = async () => {
    if (!selectedWarehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }

    setIsTransferring(true);
    try {
      // Get the actual inventory IDs from apiProducts
      const inventoryIds = selectedProductIds
        .map((productId) => {
          const apiProduct = apiProducts.find(
            (ap) => (ap.id || ap._id) === productId,
          );
          return apiProduct?._id || apiProduct?.id;
        })
        .filter((id): id is string => !!id);

      if (inventoryIds.length === 0) {
        toast.error("No valid inventory items selected");
        return;
      }

      const response = await transferInventoryToWarehouse({
        inventoryIds,
        warehouseId: selectedWarehouseId,
      });

      if (response.success) {
        toast.success(
          response.message || "Inventory transferred to warehouse successfully",
        );
        setSelectedProductIds([]);
        handleCloseTransferModal();
        await loadProducts();
      } else {
        toast.error(response.message || "Failed to transfer inventory");
      }
    } catch (error: any) {
      console.error("Error transferring inventory:", error);
      toast.error(error.message || "Failed to transfer inventory");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferToStorefront = async () => {
    if (!selectedStorefrontId) {
      toast.error("Please select a storefront");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }

    setIsTransferringToStorefront(true);
    try {
      // Get the actual inventory IDs from apiProducts
      const inventoryIds = selectedProductIds
        .map((productId) => {
          const apiProduct = apiProducts.find(
            (ap) => (ap.id || ap._id) === productId,
          );
          return apiProduct?._id || apiProduct?.id;
        })
        .filter((id): id is string => !!id);

      if (inventoryIds.length === 0) {
        toast.error("No valid inventory items selected");
        return;
      }

      const response = await transferInventoryToStorefront({
        inventoryIds,
        storefrontId: selectedStorefrontId,
      });

      if (response.success) {
        toast.success(
          response.message ||
            "Inventory transferred to storefront successfully",
        );
        setSelectedProductIds([]);
        handleCloseTransferStorefrontModal();
        await loadProducts();
      } else {
        toast.error(response.message || "Failed to transfer inventory");
      }
    } catch (error: any) {
      console.error("Error transferring inventory:", error);
      toast.error(error.message || "Failed to transfer inventory");
    } finally {
      setIsTransferringToStorefront(false);
    }
  };

  // console.log("filteredProducts", filteredProducts);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            {t("inventory.title")}
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadProducts(true)}
              disabled={isFetching}
              className="bg-slate-600 text-white px-3 py-2 sm:px-4 rounded hover:bg-slate-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {isFetching ? t("common.loading") : t("inventory.refresh")}
            </button>
            {selectedProductIds.length === 0 && !showSelectBoxes && (
              <>
                <button
                  onClick={() => {
                    setShowSelectBoxes(true);
                    setTransferMode("warehouse");
                  }}
                  className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Transfer to Warehouse
                  </span>
                  <span className="sm:hidden">To Warehouse</span>
                </button>
                <button
                  onClick={() => {
                    setShowSelectBoxes(true);
                    setTransferMode("storefront");
                  }}
                  className="bg-purple-600 text-white px-3 py-2 sm:px-4 rounded hover:bg-purple-700 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Transfer to Storefront
                  </span>
                  <span className="sm:hidden">To Storefront</span>
                </button>
              </>
            )}

            {showSelectBoxes && (
              <>
                {transferMode === "warehouse" && (
                  <button
                    onClick={handleOpenTransferModal}
                    className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded hover:bg-green-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      Confirm Warehouse Transfer ({selectedProductIds.length})
                    </span>
                    <span className="sm:hidden">
                      Confirm ({selectedProductIds.length})
                    </span>
                  </button>
                )}
                {transferMode === "storefront" && (
                  <button
                    onClick={handleOpenTransferStorefrontModal}
                    className="bg-orange-600 text-white px-3 py-2 sm:px-4 rounded hover:bg-orange-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Store className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      Confirm Storefront Transfer ({selectedProductIds.length})
                    </span>
                    <span className="sm:hidden">
                      Confirm ({selectedProductIds.length})
                    </span>
                  </button>
                )}
              </>
            )}
            {showSelectBoxes && (
              <button
                onClick={() => {
                  setShowSelectBoxes(false);
                  setSelectedProductIds([]);
                  setTransferMode(null);
                }}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded hover:bg-red-700 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Cancel Selection</span>
                <span className="sm:hidden">Cancel</span>
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-btn-primary text-dark px-3 py-2 sm:px-4 rounded hover:bg-btn-primary-hover text-sm sm:text-base"
            >
              +{" "}
              <span className="hidden sm:inline">
                {" "}
                {t("inventory.addProduct")}
              </span>
              <span className="sm:hidden"> Add</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by product name, barcode, or product code..."
          />
        </div>
      </div>

      {error && !isFetching && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        pagination={pagination}
      />

      <div ref={tableTopRef} className="scroll-mt-4" />
      {isFetching && products.length === 0 ? (
        <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
          <p className="text-slate-500">{t("inventory.loadingProducts")}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
          <p className="text-slate-500">
            {appliedSearch
              ? t("inventory.noSearchResults")
              : selectedCategory !== "All"
                ? t("inventory.noProductsInCategory").replace(
                    "{category}",
                    selectedCategory,
                  )
                : t("inventory.noProductsFound")}
          </p>
        </div>
      ) : (
        // Keep the current rows visible (dimmed) while the next page loads
        <div
          className={`transition-opacity ${isFetching ? "opacity-60 pointer-events-none" : ""}`}
          aria-busy={isFetching}
        >
          <InventoryTable
            products={filteredProducts}
            onEdit={openEdit}
            onViewDetails={handleViewDetails}
            selectedProductIds={selectedProductIds}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            showSelectBoxes={showSelectBoxes}
            startIndex={
              pagination
                ? (pagination.currentPage - 1) * pagination.itemsPerPage
                : 0
            }
          />
          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              disabled={isFetching}
            />
          )}
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        error={error}
        isLoading={isLoading}
        categories={categories}
        subCategories={subCategories}
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

      {/* Transfer to Warehouse Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Transfer to Warehouse
              </h2>
              <button
                onClick={handleCloseTransferModal}
                disabled={isTransferring}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Selected Products</p>
                <p className="font-bold text-slate-800">
                  {selectedProductIds.length} product(s) selected
                </p>
                <div className="mt-2 text-xs text-slate-600">
                  {filteredProducts
                    .filter((p) => selectedProductIds.includes(p.id))
                    .map((p) => p.name)
                    .join(", ")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  disabled={isTransferring}
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.locationName} ({warehouse.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              {warehouses.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    No active warehouses available. Please create a warehouse
                    first.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseTransferModal}
                  disabled={isTransferring}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isTransferring || !selectedWarehouseId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" /> Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer to Storefront Modal */}
      {isTransferStorefrontModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Transfer to Storefront
              </h2>
              <button
                onClick={handleCloseTransferStorefrontModal}
                disabled={isTransferringToStorefront}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Selected Products</p>
                <p className="font-bold text-slate-800">
                  {selectedProductIds.length} product(s) selected
                </p>
                <div className="mt-2 text-xs text-slate-600">
                  {filteredProducts
                    .filter((p) => selectedProductIds.includes(p.id))
                    .map((p) => p.name)
                    .join(", ")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Storefront <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={selectedStorefrontId}
                  onChange={(e) => setSelectedStorefrontId(e.target.value)}
                  disabled={isTransferringToStorefront}
                >
                  <option value="">Select a storefront</option>
                  {storefronts.map((storefront) => (
                    <option key={storefront._id} value={storefront._id}>
                      {storefront.locationName} ({storefront.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              {storefronts.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    No active storefronts available. Please create a storefront
                    first.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseTransferStorefrontModal}
                  disabled={isTransferringToStorefront}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferToStorefront}
                  disabled={isTransferringToStorefront || !selectedStorefrontId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isTransferringToStorefront ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" /> Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
