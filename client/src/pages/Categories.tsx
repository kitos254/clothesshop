import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, Menu, X } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  level: number;
  isActive: boolean;
  children: Category[];
  productImage?: string; // Random product image from category
  stats: {
    productCount: number;
    totalProductCount: number;
  };
}

const ShopPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories to only show those with products
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = filterCategoriesWithProducts(categories);
      setFilteredCategories(filtered);
      
      // Auto-select first parent when filtered categories are ready
      if (filtered.length > 0 && !selectedParent) {
        setSelectedParent(filtered[0]);
      }
      
      // Fetch product images for all grandchildren
      fetchProductImagesForCategories(filtered);
    }
  }, [categories]);

  // Fetch random product images for each grandchild category
  const fetchProductImagesForCategories = async (parents: Category[]) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const imageMap: Record<string, string> = {};
    const timestamp = Date.now(); // Cache-busting timestamp
    
    // Collect all grandchild category IDs
    const grandchildren: Category[] = [];
    for (const parent of parents) {
      for (const child of parent.children || []) {
        for (const grandchild of child.children || []) {
          grandchildren.push(grandchild);
        }
      }
    }
    
    // Fetch product images in parallel (batch of 10 at a time to avoid overwhelming the server)
    const batchSize = 10;
    for (let i = 0; i < grandchildren.length; i += batchSize) {
      const batch = grandchildren.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (gc) => {
          try {
            const res = await fetch(
              `${baseUrl}/api/products/public?category=${gc._id}&limit=20&isActive=true&_t=${timestamp}`
            );
            if (res.ok) {
              const data = await res.json();
              const products = Array.isArray(data) ? data : (data.data || []);
              if (products.length > 0) {
                // Pick a random product
                const randomIndex = Math.floor(Math.random() * products.length);
                const randomProduct = products[randomIndex];
                const productImage = randomProduct?.images?.[0]?.url;
                if (productImage) {
                  imageMap[gc._id] = productImage;
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching product for ${gc.name}:`, err);
          }
        })
      );
    }
    
    setCategoryImages(prev => ({ ...prev, ...imageMap }));
  };

  // Filter function: only show categories with complete product tree
  const filterCategoriesWithProducts = (parents: Category[]): Category[] => {
    return parents
      .map(parent => {
        // Filter children that have grandchildren with products
        const filteredChildren = (parent.children || [])
          .map(child => {
            // Filter grandchildren that have at least 1 product
            const filteredGrandchildren = (child.children || [])
              .filter(grandchild => 
                (grandchild.stats?.productCount > 0) || 
                (grandchild.stats?.totalProductCount > 0)
              );
            
            return {
              ...child,
              children: filteredGrandchildren
            };
          })
          // Only keep children that have at least 1 grandchild with products
          .filter(child => child.children.length > 0);
        
        return {
          ...parent,
          children: filteredChildren
        };
      })
      // Only keep parents that have at least 1 child with grandchildren
      .filter(parent => parent.children.length > 0);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
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
    setShowMobileSidebar(false); // Close sidebar on mobile after selection
  };

  const handleGrandchildClick = (grandchild: Category) => {
    navigate(`/category/${grandchild.slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-2 text-gray-600">Loading categories...</p>
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
    <div className="h-screen bg-gray-100 pt-12 overflow-hidden">
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
              className="md:hidden fixed bottom-20 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              {showMobileSidebar ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Mobile Overlay */}
            {showMobileSidebar && (
              <div 
                className="md:hidden fixed inset-0 bg-black/50 z-30"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}

            {/* Left Sidebar - Parent Categories */}
            <div className={`
              w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto
              md:relative md:translate-x-0 md:opacity-100
              fixed top-12 left-0 h-[calc(100vh-3rem)] z-40
              transition-all duration-300 ease-in-out
              ${showMobileSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:opacity-100'}
            `}>
              <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="font-semibold text-gray-800">Categories</span>
                <button onClick={() => setShowMobileSidebar(false)}>
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <nav className="py-2">
                {filteredCategories.map((parent) => (
                  <button
                    key={parent._id}
                    onClick={() => handleParentClick(parent)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                      selectedParent?._id === parent._id
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{parent.name}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      selectedParent?._id === parent._id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {selectedParent && (
                <div className="p-6">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                              {child.children.map((grandchild) => (
                                <div
                                  key={grandchild._id}
                                  onClick={() => handleGrandchildClick(grandchild)}
                                  className="bg-white rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200"
                                >
                                  {/* Category Image - Random Product */}
                                  <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                    {categoryImages[grandchild._id] ? (
                                      <img
                                        src={categoryImages[grandchild._id]}
                                        alt={grandchild.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl">📦</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Category Name */}
                                  <h5 className="text-sm font-medium text-gray-800 text-center leading-tight">
                                    {grandchild.name}
                                  </h5>
                                  
                                  {/* Product Count */}
                                  {(grandchild.stats?.productCount > 0 || grandchild.stats?.totalProductCount > 0) && (
                                    <p className="text-xs text-gray-500 text-center mt-1">
                                      {grandchild.stats?.productCount || grandchild.stats?.totalProductCount} products
                                    </p>
                                  )}
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
