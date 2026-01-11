import { useState, useEffect } from 'react';
import { Eye, Heart, Package } from 'lucide-react';
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

const FeaturedCollections = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        // Fetch full category tree to find the deepest level categories (subchildren)
        const response = await fetch(`${baseUrl}/api/categories/public/tree`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        const tree = data.data || data || [];
        
        // Extract only the deepest level categories (level 2 = subchildren)
        // Structure: Parent (level 0) -> Child (level 1) -> Subchild (level 2)
        const subchildCategories: Category[] = [];
        
        // Helper to check if category has products
        const hasProducts = (cat: Category) => {
          const count = cat.stats?.activeProductCount || cat.stats?.productCount || 0;
          return count > 0;
        };
        
        const findDeepestCategories = (categories: Category[], currentLevel: number = 0) => {
          for (const cat of categories) {
            // Check if this category has children
            if (cat.children && cat.children.length > 0) {
              // Has children, recurse deeper
              findDeepestCategories(cat.children, currentLevel + 1);
            } else {
              // No children - this is a leaf node
              // Only include if it's at level 2 or deeper (subchild level)
              // If the tree is shallow, include level 1+ as well
              if (currentLevel >= 1) {
                subchildCategories.push(cat);
              }
            }
          }
        };
        
        findDeepestCategories(tree, 0);
        
        // Filter to only categories with products
        let categoriesToUse = subchildCategories.filter(hasProducts);
        
        // If no level 2+ categories with products found, try to get leaf nodes at any level that have products
        if (categoriesToUse.length === 0) {
          const leafNodes: Category[] = [];
          const findAllLeafNodes = (categories: Category[]) => {
            for (const cat of categories) {
              if (!cat.children || cat.children.length === 0) {
                // Only include leaf nodes that have at least one product
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
        
        // Fetch a random product image for each category
        const categoriesWithImages = await Promise.all(
          selectedCategories.map(async (cat) => {
            try {
              // Add timestamp to prevent caching
              const timestamp = Date.now();
              const productRes = await fetch(
                `${baseUrl}/api/products/public?category=${cat._id}&limit=20&isActive=true&_t=${timestamp}`
              );
              if (productRes.ok) {
                const productData = await productRes.json();
                const products = Array.isArray(productData) ? productData : (productData.data || []);
                if (products.length > 0) {
                  // Pick a random product from the category
                  const randomIndex = Math.floor(Math.random() * products.length);
                  const randomProduct = products[randomIndex];
                  const productImage = randomProduct?.images?.[0]?.url || null;
                  return { ...cat, productImage };
                }
              }
            } catch (err) {
              console.error(`Error fetching product for category ${cat.name}:`, err);
            }
            return cat;
          })
        );
        
        setCategories(categoriesWithImages);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
    <section className="py-10 px-0">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-4 fade-in-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
            Featured Categories
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto fade-in-up stagger-1">
            Discover our curated selection of premium home gear and electronics for modern living
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {categories.map((category, index) => (
            <Link to={`/category/${category.slug}`} key={category._id}>
              <div
                className="product-card group cursor-pointer fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredItem(category._id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Image Container */}
                <div className="product-image-container aspect-[3/4] mb-4 relative bg-muted/50 rounded-lg overflow-hidden">
                  {category.productImage ? (
                    <img
                      src={category.productImage}
                      alt={category.name}
                      className="product-image w-full h-full object-cover"
                    />
                  ) : category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="product-image w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-3 left-3 bg-background/90 text-foreground"
                  >
                    {getBadge(category, index)}
                  </Badge>

                  {/* Hover Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center space-x-3 transition-opacity duration-300 ${
                      hoveredItem === category._id ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Collection Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-base sm:text-lg md:text-xl tracking-wide">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {category.stats?.activeProductCount || category.stats?.productCount || 0} Products
                  </p>
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