import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

// Product type based on backend model
interface Review {
  rating: number;
  title?: string;
  comment?: string;
}

interface Product {
  _id: string;
  name: string;
  brand?: string | { name: string };
  price: number;
  originalPrice?: number;
  currentPrice?: number;
  comparePrice?: number;
  images?: { url: string; publicId?: string }[];
  inStock?: boolean;
  stock?: { quantity: number };
  features?: string[];
  tags?: string[];
  variationOptions?: { type: string; values: string[] }[];
  hasVariations?: boolean;
  variationDefinitions?: any[];
  variationCombinations?: any[];
  category?: string[];
  detailsAndCare?: any[];
  deliveryInfo?: any[];
  reviews?: Review[];
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const ProductCard = ({ product, viewMode = 'grid' }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Helper to get brand name from string or object
  const getBrandName = (brand?: string | { name: string }): string | undefined => {
    if (!brand) return undefined;
    return typeof brand === 'string' ? brand : brand.name;
  };

  const brandName = getBrandName(product.brand);

  // Calculate average rating and review count from reviews array
  const reviewArr = Array.isArray(product.reviews) ? product.reviews : [];
  const reviewCount = reviewArr.length;
  const avgRating = reviewCount > 0 ? (reviewArr.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount) : 0;

  // Get display price - currentPrice is the selling price, comparePrice is the crossed-out price
  const displayPrice = product.currentPrice || product.price;
  // comparePrice is the "was" price (like MSRP), originalPrice is fallback
  const compareAtPrice = product.comparePrice || product.originalPrice;
  // Only show compare price if it's higher than display price
  const showComparePrice = compareAtPrice && compareAtPrice > displayPrice;

  // Calculate total stock considering variations
  const calculateTotalStock = (): number => {
    // If product has variations with combinations, sum up all combination stock
    if (product.hasVariations && product.variationCombinations && product.variationCombinations.length > 0) {
      return product.variationCombinations.reduce((total, combo) => {
        const comboStock = combo.stock?.quantity ?? 0;
        return total + comboStock;
      }, 0);
    }
    // Otherwise use general stock
    return product.stock?.quantity ?? 0;
  };

  const totalStock = calculateTotalStock();
  const isInStock = product.inStock !== false && totalStock > 0;
  const isLowStock = isInStock && totalStock > 0 && totalStock <= 5;

  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      productId: product._id,
      name: product.name,
      brand: brandName,
      price: displayPrice,
      image: product.images?.[0]?.url || '',
      selectedOptions: product.variationOptions?.length ? {
        size: product.variationOptions?.find(v => v.type === 'size')?.values[0],
        color: product.variationOptions?.find(v => v.type === 'color')?.values[0],
      } : undefined,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        productId: product._id,
        name: product.name,
        brand: brandName,
        price: displayPrice,
        image: product.images?.[0]?.url || '',
        originalPrice: compareAtPrice,
      });
    }
  };

  const getColorClass = (color: string) => {
    // Only map allowed backend color values
    const colorMap: { [key: string]: string } = {
      white: 'bg-white border border-gray-200',
      blue: 'bg-blue-500',
      black: 'bg-black',
      red: 'bg-red-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-400',
      gray: 'bg-gray-400',
    };
    return colorMap[color?.toLowerCase()] || 'bg-gray-300';
  };

  if (viewMode === 'list') {
    // Get color/size options from variationOptions if present
    const colors = product.variationOptions?.find(v => v.type === 'color')?.values || [];
    return (
      <Link to={`/product/${product._id}`}>
        <div className="flex gap-6 p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="w-48 h-64 relative overflow-hidden rounded-md">
            <img
              src={product.images?.[0]?.url || ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Optionally show badges for new or out of stock */}
            {!isInStock && (
              <Badge variant="destructive" className="absolute top-2 text-xs right-2">
                Out of Stock
              </Badge>
            )}
            {isLowStock && (
              <Badge className="absolute top-2 left-2 text-xs bg-orange-500 text-white">
                Only {totalStock} left
              </Badge>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {brandName}
              </p>
              <h3 className="font-medium text-lg tracking-wide line-clamp-2">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(avgRating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {colors.slice(0, 5).map((color) => (
                <div
                  key={color}
                  className={`w-4 h-4 rounded-full ${getColorClass(color)}`}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-medium text-base whitespace-nowrap">
                  KSh {displayPrice.toLocaleString()}
                </span>
                {showComparePrice && (
                  <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
                    KSh {compareAtPrice!.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleWishlist}
                  className={inWishlist ? 'text-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Get color/size options from variationOptions if present
  const colors = product.variationOptions?.find(v => v.type === 'color')?.values || [];
  return (
    <Link to={`/product/${product._id}`}>
      <div
        className="product-card group cursor-pointer bg-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="product-image-container aspect-[3/4] mb-0 relative">
          <img
            src={product.images?.[0]?.url || ''}
            alt={product.name}
            className="product-image"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {!isInStock && (
              <Badge variant="destructive">
                Out of Stock
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                Only {totalStock} left
              </Badge>
            )}
          </div>
        </div>
        {/* Product Info */}
        <div className="space-y-1 p-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {brandName}
            </p>
            <h3 className="font-medium text-xs tracking-wide line-clamp-2">
              {product.name}
            </h3>
          </div>
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${
                    i < Math.round(avgRating)
                      ? 'fill-accent text-accent'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
          {/* Colors */}
          <div className="flex items-center space-x-1">
            {colors.slice(0, 3).map((color) => (
              <div
                key={color}
                className={`w-2.5 h-2.5 rounded-full border border-border ${getColorClass(color)}`}
                title={color}
              />
            ))}
            {colors.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{colors.length - 3}
              </span>
            )}
          </div>
          {/* Price */}
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="font-medium text-xs whitespace-nowrap">
              KSh {displayPrice.toLocaleString()}
            </span>
            {showComparePrice && (
              <span className="text-[10px] text-muted-foreground line-through whitespace-nowrap">
                {compareAtPrice!.toLocaleString()}
              </span>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[10px]"
              onClick={handleAddToCart}
              disabled={!isInStock}
            >
              <ShoppingCart className="h-2.5 w-2.5 mr-1" />
              {isInStock ? 'Add' : 'Out'}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className={`h-7 w-7 ${inWishlist ? 'text-red-500 border-red-500' : ''}`}
              onClick={handleToggleWishlist}
            >
              <Heart className={`h-2.5 w-2.5 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;