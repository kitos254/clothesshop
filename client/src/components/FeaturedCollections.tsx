import { useState, useEffect, useRef } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productImage?: string; // Random product image from category
  stats?: {
    productCount: number;
    activeProductCount: number;
  };
  children?: Category[];
}

// Cache for featured collections to avoid refetching
let cachedCategories: Category[] | null = null;
let cachedImages: Record<string, string> = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const FeaturedCollections = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Check if cache is still valid
    const now = Date.now();
    if (cachedCategories && cachedCategories.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
      setCategories(cachedCategories);
      setCategoryImages(cachedImages);
      setLoading(false);
      return;
    }

    fetchCategories();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/categories/public/tree`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      const tree = data.data || data || [];
      
      // Extract only the deepest level categories (level 2 = subchildren)
      const subchildCategories: Category[] = [];
      
      const hasProducts = (cat: Category) => {
        const count = cat.stats?.activeProductCount || cat.stats?.productCount || 0;
        return count > 0;
      };
      
      const findDeepestCategories = (categories: Category[], currentLevel: number = 0) => {
        for (const cat of categories) {
          if (cat.children && cat.children.length > 0) {
            findDeepestCategories(cat.children, currentLevel + 1);
          } else {
            if (currentLevel >= 1) {
              subchildCategories.push(cat);
            }
          }
        }
      };
      
      findDeepestCategories(tree, 0);
      
      let categoriesToUse = subchildCategories.filter(hasProducts);
      
      if (categoriesToUse.length === 0) {
        const leafNodes: Category[] = [];
        const findAllLeafNodes = (categories: Category[]) => {
          for (const cat of categories) {
            if (!cat.children || cat.children.length === 0) {
              if (hasProducts(cat)) {
                leafNodes.push(cat);
              }
            } else {
              findAllLeafNodes(cat.children);
            }
          }
        };
        findAllLeafNodes(tree);
        categoriesToUse = leafNodes;
      }
      
      // Shuffle and take random 6 categories
      const shuffled = categoriesToUse.sort(() => Math.random() - 0.5);
      const selectedCategories = shuffled.slice(0, 6);
      
      // Set categories immediately (without images) to show content faster
      setCategories(selectedCategories);
      cachedCategories = selectedCategories;
      cacheTimestamp = Date.now();
      setLoading(false);
      
      // Then fetch images in background
      fetchCategoryImages(selectedCategories);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const fetchCategoryImages = async (cats: Category[]) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setImagesLoading(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const imageMap: Record<string, string> = {};
    
    // Fetch images in parallel with smaller limit (only need 1 image)
    await Promise.all(
      cats.map(async (cat) => {
        // Skip if already cached
        if (cachedImages[cat._id]) {
          imageMap[cat._id] = cachedImages[cat._id];
          return;
        }
        
        try {
          const productRes = await fetch(
            `${baseUrl}/api/products/public?category=${cat._id}&limit=5&isActive=true`,
            { signal }
          );
          if (productRes.ok) {
            const productData = await productRes.json();
            const products = Array.isArray(productData) ? productData : (productData.data || []);
            if (products.length > 0) {
              const randomIndex = Math.floor(Math.random() * products.length);
              const randomProduct = products[randomIndex];
              const productImage = randomProduct?.images?.[0]?.url;
              if (productImage) {
                imageMap[cat._id] = productImage;
              }
            }
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error(`Error fetching product for category ${cat.name}:`, err);
          }
        }
      })
    );
    
    // Update cache and state
    cachedImages = { ...cachedImages, ...imageMap };
    setCategoryImages(imageMap);
    setImagesLoading(false);
  };

  // Get badge text based on product count
  const getBadge = (category: Category, index: number): string => {
    const count = category.stats?.activeProductCount || category.stats?.productCount || 0;
    if (count > 50) return '🔥 Popular';
    if (count > 20) return '✨ Trending';
    if (index === 0) return '🚨 New';
    return '💫 Featured';
  };

  if (loading) {
    return (
      <section className="py-10 px-0">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null; // Don't render if no categories
  }

  return (
    <section className="py-10 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Featured Categories
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Discover premium home gear and electronics for modern living
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link to={`/category/${category.slug}`} key={category._id}>
              <div
                className="group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image Container */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-md group-hover:shadow-xl transition-all duration-300">
                  {categoryImages[category._id] ? (
                    <img
                      src={categoryImages[category._id]}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : category.productImage ? (
                    <img
                      src={category.productImage}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {imagesLoading ? (
                        <div className="animate-pulse bg-gray-300 w-full h-full" />
                      ) : (
                        <Package className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 bg-white/90 text-gray-800 text-xs px-2 py-0.5"
                  >
                    {getBadge(category, index)}
                  </Badge>

                  {/* Category Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-xs mt-1">
                      {category.stats?.activeProductCount || category.stats?.productCount || 0} items
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/categories">
            <Button className="btn-secondary">
              Shop All Categories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;