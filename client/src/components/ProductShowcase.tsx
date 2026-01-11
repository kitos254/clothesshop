import { useState, useEffect } from 'react';
import { Star, ShoppingCart, Heart, Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface Product {
  _id: string;
  name: string;
  slug?: string;
  brand?: { name: string } | string;
  price?: number;
  currentPrice?: number;
  originalPrice?: number;
  images?: { url: string }[];
  stock?: { quantity: number };
  hasVariations?: boolean;
  variationCombinations?: any[];
  views?: { total: number; unique: number };
  reviews?: { averageRating: number; count: number } | any[];
  category?: { name: string; slug: string } | string;
}

const ProductShowcase = () => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}/api/products/public/popular?limit=12`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.data || data || []);
      } catch (error) {
        console.error('Error fetching popular products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  // Helper functions
  const getBrandName = (brand?: { name: string } | string): string => {
    if (!brand) return 'Unknown';
    return typeof brand === 'string' ? brand : brand.name;
  };

  const getCategoryName = (category?: { name: string; slug: string } | string): string => {
    if (!category) return '';
    return typeof category === 'string' ? category : category.name;
  };

  const getReviewData = (reviews?: { averageRating: number; count: number } | any[]) => {
    if (!reviews) return { rating: 0, count: 0 };
    if (Array.isArray(reviews)) {
      const count = reviews.length;
      const rating = count > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
      return { rating, count };
    }
    return { rating: reviews.averageRating || 0, count: reviews.count || 0 };
  };

  const calculateTotalStock = (product: Product): number => {
    if (product.hasVariations && product.variationCombinations?.length) {
      return product.variationCombinations.reduce((total, combo) => total + (combo.stock?.quantity ?? 0), 0);
    }
    return product.stock?.quantity ?? 0;
  };

  const getBadge = (product: Product): string | null => {
    const originalPrice = product.originalPrice;
    const currentPrice = product.currentPrice || product.price || 0;
    
    if (originalPrice && originalPrice > currentPrice) {
      const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      return `${discount}% Off`;
    }
    
    const views = product.views?.total || 0;
    if (views > 100) return 'Bestseller';
    if (views > 50) return 'Popular';
    
    return null;
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    const price = product.currentPrice || product.price || 0;
    addToCart({
      productId: product._id,
      name: product.name,
      brand: getBrandName(product.brand),
      price,
      image: product.images?.[0]?.url || '',
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    const price = product.currentPrice || product.price || 0;
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        productId: product._id,
        name: product.name,
        brand: getBrandName(product.brand),
        price,
        image: product.images?.[0]?.url || '',
        originalPrice: product.originalPrice,
      });
    }
  };

  if (loading) {
    return (
      <section className="py-10 px-0 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 px-0 bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-4 fade-in-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
            Popular Products
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto fade-in-up stagger-1">
            Top-rated home gear and electronics loved by our customers
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {products.map((product, index) => {
            const price = product.currentPrice || product.price || 0;
            const originalPrice = product.originalPrice;
            const totalStock = calculateTotalStock(product);
            const isInStock = totalStock > 0;
            const badge = getBadge(product);
            const { rating, count } = getReviewData(product.reviews);
            const inWishlist = isInWishlist(product._id);

            return (
              <Link to={`/product/${product._id}`} key={product._id}>
                <div
                  className="product-card group cursor-pointer fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={() => setHoveredProduct(product._id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  {/* Image Container */}
                  <div className="product-image-container aspect-[3/4] mb-4 relative bg-muted/50 rounded-lg overflow-hidden">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="product-image w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Badge */}
                    {badge && (
                      <Badge
                        variant="secondary"
                        className="absolute top-3 left-3 bg-background/90 text-foreground"
                      >
                        {badge}
                      </Badge>
                    )}

                    {/* Stock Status */}
                    {!isInStock && (
                      <Badge
                        variant="destructive"
                        className="absolute top-3 right-3"
                      >
                        Out of Stock
                      </Badge>
                    )}

                    {/* Hover Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center space-x-3 transition-opacity duration-300 ${
                        hoveredProduct === product._id ? 'opacity-100' : 'opacity-0'
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
                        className={`bg-background hover:bg-accent hover:text-accent-foreground ${inWishlist ? 'text-red-500' : ''}`}
                        onClick={(e) => handleToggleWishlist(e, product)}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                      </Button>
                      {isInStock && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-background hover:bg-accent hover:text-accent-foreground"
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {getCategoryName(product.category)}
                      </span>
                      {count > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {rating.toFixed(1)} ({count})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-base sm:text-lg md:text-xl tracking-wide line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground">
                      by {getBrandName(product.brand)}
                    </p>

                    {/* Price */}
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-base sm:text-lg md:text-xl">
                        KSh {price.toLocaleString()}
                      </span>
                      {originalPrice && originalPrice > price && (
                        <span className="text-sm text-muted-foreground line-through">
                          KSh {originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/shop">
            <Button className="btn-secondary">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;