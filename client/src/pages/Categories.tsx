import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, Menu, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  _id: string;
  name: string;
  slug: string;
  level: number;
  isActive: boolean;
  children: Category[];
  productImage?: string;
  stats: {
    productCount: number;
    totalProductCount: number;
  };
}

// Cache for category images to avoid re-fetching
const imageCache: Record<string, string> = {};

const ShopPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Track which parent categories have been loaded
  const loadedParents = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Initial category tree fetch (lightweight - no images)
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories when they change
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = filterCategoriesWithProducts(categories);
      setFilteredCategories(filtered);
      
      // Auto-select first parent
      if (filtered.length > 0 && !selectedParent) {
        setSelectedParent(filtered[0]);
      }
    }
  }, [categories]);

  // Fetch images only when selected parent changes
  useEffect(() => {
    if (selectedParent) {
      fetchImagesForSelectedParent(selectedParent);
    }
  }, [selectedParent?._id]);

  // Fetch product images only for the selected parent's grandchildren
  const fetchImagesForSelectedParent = useCallback(async (parent: Category) => {
    // Skip if already loaded
    if (loadedParents.current.has(parent._id)) {
      // Load from cache
      const cachedImages: Record<string, string> = {};
      for (const child of parent.children || []) {
        for (const grandchild of child.children || []) {
          if (imageCache[grandchild._id]) {
            cachedImages[grandchild._id] = imageCache[grandchild._id];
          }
        }
      }
      setCategoryImages(prev => ({ ...prev, ...cachedImages }));
      return;
    }

    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Collect grandchildren for this parent only
    const grandchildren: Category[] = [];
    for (const child of parent.children || []) {
      for (const grandchild of child.children || []) {
        // Skip if already cached
        if (!imageCache[grandchild._id]) {
          grandchildren.push(grandchild);
        }
      }
    }

    if (grandchildren.length === 0) {
      loadedParents.current.add(parent._id);
      return;
    }

    setLoadingImages(true);
    const imageMap: Record<string, string> = {};

    try {
      // Fetch all images in parallel for speed
      const results = await Promise.allSettled(
        grandchildren.map(async (gc) => {
          try {
            const res = await fetch(
              `${baseUrl}/api/products/public?category=${gc._id}&limit=5&isActive=true`,
              { signal: abortControllerRef.current?.signal }
            );
            if (res.ok) {
              const data = await res.json();
              const products = Array.isArray(data) ? data : (data.data || []);
              if (products.length > 0) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                const productImage = randomProduct?.images?.[0]?.url;
                if (productImage) {
                  imageMap[gc._id] = productImage;
                  imageCache[gc._id] = productImage; // Cache it
                }
              }
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error(`Error fetching product for ${gc.name}:`, err);
            }
          }
        })
      );

      // Mark parent as loaded
      loadedParents.current.add(parent._id);
      
      // Update state with new images
      setCategoryImages(prev => ({ ...prev, ...imageMap }));
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoadingImages(false);
    }
  }, [baseUrl]);

  // Filter function: only show categories with complete product tree
  const filterCategoriesWithProducts = (parents: Category[]): Category[] => {
    return parents
      .map(parent => {
        const filteredChildren = (parent.children || [])
          .map(child => {
            const filteredGrandchildren = (child.children || [])
              .filter(grandchild => 
                (grandchild.stats?.productCount > 0) || 
                (grandchild.stats?.totalProductCount > 0)
              );
            
            return { ...child, children: filteredGrandchildren };
          })
          .filter(child => child.children.length > 0);
        
        return { ...parent, children: filteredChildren };
      })
      .filter(parent => parent.children.length > 0);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/categories/public/tree?maxDepth=3`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load categories');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParentClick = (parent: Category) => {
    setSelectedParent(parent);
    setShowMobileSidebar(false);
  };

  const handleGrandchildClick = (grandchild: Category) => {
    navigate(`/category/${grandchild.slug}`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 overflow-hidden">
        <div className="h-full max-w-[2000px] mx-auto">
          <div className="flex h-full">
            {/* Sidebar Skeleton */}
            <div className="w-72 bg-white flex-shrink-0 border-r border-gray-200 p-3">
              <div className="px-5 py-6 border-b border-gray-100 mb-3">
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="flex-1 bg-gray-50 pt-10 p-6">
              <div className="space-y-8">
                {/* Category heading skeleton */}
                <div>
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                  </div>
                </div>
                {/* Second category heading skeleton */}
                <div>
                  <Skeleton className="h-8 w-40 mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchCategories}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <div className="h-full max-w-[2000px] mx-auto">
        {filteredCategories.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-lg">No categories with products available</p>
          </div>
        ) : (
          <div className="flex h-full relative">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="md:hidden fixed bottom-20 left-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {showMobileSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile Overlay */}
            {showMobileSidebar && (
              <div 
                className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}

            {/* Left Sidebar - Parent Categories */}
            <div className={`
              w-72 bg-white flex-shrink-0 overflow-y-auto border-r border-gray-200
              md:relative md:translate-x-0 md:opacity-100
              fixed top-12 left-0 h-[calc(100vh-3rem)] z-40 shadow-lg
              transition-all duration-300 ease-in-out
              ${showMobileSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:opacity-100'}
            `}>
              {/* Mobile Header */}
              <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Menu className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-800 text-lg">Categories</span>
                </div>
                <button 
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              {/* Desktop Header */}
              <div className="hidden md:block px-5 py-6 border-b border-gray-100">
                <h2 className="text-gray-800 font-bold text-xl">Browse</h2>
                <p className="text-gray-500 text-sm mt-1">Select a category</p>
              </div>
              
              <nav className="py-3 px-3">
                {filteredCategories.map((parent, index) => (
                  <button
                    key={parent._id}
                    onClick={() => handleParentClick(parent)}
                    className={`w-full text-left px-4 py-3.5 mb-1 flex items-center justify-between rounded-xl transition-all duration-200 group ${
                      selectedParent?._id === parent._id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedParent?._id === parent._id 
                          ? 'bg-white' 
                          : 'bg-gray-300 group-hover:bg-blue-500'
                      } transition-colors`} />
                      <span className="font-medium">{parent.name}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-all duration-200 ${
                      selectedParent?._id === parent._id 
                        ? 'text-white translate-x-1' 
                        : 'text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1'
                    }`} />
                  </button>
                ))}
              </nav>
              
              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                <p className="text-gray-400 text-xs text-center">
                  {filteredCategories.length} categories available
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pt-10">
              {selectedParent && (
                <div className="p-6">
                  {/* Loading indicator for images */}
                  {loadingImages && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading images...</span>
                    </div>
                  )}
                  
                  {selectedParent.children && selectedParent.children.length > 0 ? (
                    <div className="space-y-8">
                      {selectedParent.children.map((child) => (
                        <div key={child._id}>
                          {/* Child Category Heading */}
                          <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            {child.name}
                          </h3>
                          
                          {/* Grandchildren Grid */}
                          {child.children && child.children.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                              {child.children.map((grandchild) => (
                                <div
                                  key={grandchild._id}
                                  onClick={() => handleGrandchildClick(grandchild)}
                                  className="group cursor-pointer"
                                >
                                  {/* Category Image Container */}
                                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm group-hover:shadow-xl transition-all duration-300">
                                    {categoryImages[grandchild._id] ? (
                                      <img
                                        src={categoryImages[grandchild._id]}
                                        alt={grandchild.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        {loadingImages ? (
                                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                        ) : (
                                          <span className="text-4xl opacity-50">📦</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    
                                    {/* Category Info Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                      <h5 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                                        {grandchild.name}
                                      </h5>
                                      {(grandchild.stats?.productCount > 0 || grandchild.stats?.totalProductCount > 0) && (
                                        <p className="text-white/80 text-xs mt-1">
                                          {grandchild.stats?.productCount || grandchild.stats?.totalProductCount} items
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm py-4">No subcategories available</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No subcategories available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
