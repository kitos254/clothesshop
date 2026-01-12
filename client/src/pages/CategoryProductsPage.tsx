import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ChevronRight, Grid3X3, List, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";

interface Category {
  _id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parent?: {
    _id: string;
    name: string;
    slug: string;
  };
  stats?: {
    productCount: number;
  };
}

interface Ancestor {
  _id: string;
  name: string;
  slug: string;
  level: number;
}

interface Product {
  _id: string;
  name: string;
  brand?: string | { name: string };
  price: number;
  originalPrice?: number;
  currentPrice?: number;
  images?: { url: string; publicId?: string }[];
  stock?: { quantity: number };
  inStock?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  hasVariations?: boolean;
  variationDefinitions?: any[];
  variationCombinations?: any[];
  variationOptions?: { type: string; values: string[] }[];
  reviews?: any[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Helper function to check if product is in stock (considering variations)
const calculateProductInStock = (product: any): boolean => {
  const hasStockAffectingVariations = product.hasVariations && 
    product.variationDefinitions?.some((def: any) => def.affectsStock) &&
    product.variationCombinations && 
    product.variationCombinations.length > 0;

  if (hasStockAffectingVariations) {
    return product.variationCombinations.some((c: any) => c.isActive && c.stock?.quantity > 0);
  }

  return (product.stock?.quantity || 0) > 0;
};

// Simple in-memory cache for category data
const categoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedCategory = (slug: string) => {
  const cached = categoryCache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedCategory = (slug: string, data: any) => {
  categoryCache.set(slug, { data, timestamp: Date.now() });
};

const CategoryProductsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [category, setCategory] = useState<Category | null>(null);
  const [ancestors, setAncestors] = useState<Ancestor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filters and sorting
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  // Separate effect for sort changes to avoid refetching category
  useEffect(() => {
    if (category && initialLoadComplete) {
      fetchProducts(category._id, 1);
    }
  }, [sortBy]);

  const fetchCategoryAndProducts = async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      setError(null);
      setInitialLoadComplete(false);

      // Check cache first for category
      const cachedCategory = getCachedCategory(slug!);
      let categoryInfo;

      if (cachedCategory) {
        categoryInfo = cachedCategory;
        setCategory(categoryInfo);
        setAncestors(categoryInfo.ancestors || []);
        setLoading(false);
        
        // Fetch products immediately since we have cached category
        await fetchProducts(categoryInfo._id, 1, signal);
      } else {
        // Fetch category details
        const categoryResponse = await fetch(`${baseUrl}/api/categories/public/${slug}`, { signal });
        if (!categoryResponse.ok) {
          throw new Error("Category not found");
        }
        
        const categoryData = await categoryResponse.json();
        if (!categoryData.success) {
          throw new Error(categoryData.message || "Failed to load category");
        }

        categoryInfo = categoryData.data;
        
        // Cache the category
        setCachedCategory(slug!, categoryInfo);
        
        setCategory(categoryInfo);
        setAncestors(categoryInfo.ancestors || []);
        setLoading(false);

        // Fetch products
        await fetchProducts(categoryInfo._id, 1, signal);
      }
      
      setInitialLoadComplete(true);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      setError(err.message);
      console.error("Error fetching category:", err);
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId: string, page: number, signal?: AbortSignal) => {
    try {
      setProductsLoading(true);

      // Build sort params
      let sortParam = "createdAt";
      let orderParam = "desc";
      
      switch (sortBy) {
        case "newest":
          sortParam = "createdAt";
          orderParam = "desc";
          break;
        case "oldest":
          sortParam = "createdAt";
          orderParam = "asc";
          break;
        case "price-low":
          sortParam = "currentPrice";
          orderParam = "asc";
          break;
        case "price-high":
          sortParam = "currentPrice";
          orderParam = "desc";
          break;
        case "name-az":
          sortParam = "name";
          orderParam = "asc";
          break;
        case "name-za":
          sortParam = "name";
          orderParam = "desc";
          break;
      }

      const response = await fetch(
        `${baseUrl}/api/products/public?category=${categoryId}&page=${page}&limit=20&sortBy=${sortParam}&sortOrder=${orderParam}&isActive=true`,
        { signal }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      if (data.success) {
        const productsArray = Array.isArray(data.data) ? data.data : (data.data.products || []);
        const transformedProducts = productsArray.map((p: any) => ({
          ...p,
          brand: typeof p.brand === 'object' ? p.brand?.name : p.brand,
          price: p.currentPrice || p.price,
          originalPrice: p.originalPrice,
          inStock: calculateProductInStock(p),
        }));
        
        setProducts(transformedProducts);
        setPagination({
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.totalItems || transformedProducts.length,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      console.error("Error fetching products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (category) {
      fetchProducts(category._id, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Skeleton Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Skeleton Toolbar */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Category not found"}</p>
          <Button onClick={() => navigate("/categories")}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-900">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/categories" className="hover:text-gray-900">Categories</Link>
            
            {ancestors.map((ancestor) => (
              <span key={ancestor._id} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-2" />
                <Link 
                  to={`/category/${ancestor.slug}`} 
                  className="hover:text-gray-900"
                >
                  {ancestor.name}
                </Link>
              </span>
            ))}
            
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {category.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {pagination.totalItems} {pagination.totalItems === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b sticky top-12 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Filter button (for mobile) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  {/* Add filter options here later */}
                  <p className="text-gray-500 text-sm">Filters coming soon...</p>
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name-az">Name: A-Z</SelectItem>
                  <SelectItem value="name-za">Name: Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {productsLoading ? (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              : "flex flex-col gap-4"
          }>
            {Array.from({ length: 10 }).map((_, i) => (
              viewMode === "grid" ? (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div key={i} className="flex gap-4 p-4 bg-white rounded-lg">
                  <Skeleton className="h-32 w-32 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              )
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found in this category</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/categories")}
            >
              Browse other categories
            </Button>
          </div>
        ) : (
          <>
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "flex flex-col gap-4"
            }>
              {products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryProductsPage;
