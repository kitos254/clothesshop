import { useState } from 'react';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import collectionImage from '@/assets/collection-showcase.jpg';

const ProductShowcase = () => {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const products = [
    {
      id: 1,
      name: 'Minimalist Blazer',
      brand: 'UrbanThreadz',
      price: 189,
      originalPrice: 229,
      rating: 4.8,
      reviews: 124,
      image: collectionImage,
      badge: '20% Off',
      colors: ['Black', 'Navy', 'Grey'],
      sizes: ['S', 'M', 'L', 'XL'],
      isNew: false,
      inStock: true,
    },
    {
      id: 2,
      name: 'Oversized Tee',
      brand: 'UrbanThreadz',
      price: 45,
      originalPrice: null,
      rating: 4.6,
      reviews: 89,
      image: collectionImage,
      badge: 'New',
      colors: ['White', 'Black', 'Sage'],
      sizes: ['XS', 'S', 'M', 'L'],
      isNew: true,
      inStock: true,
    },
    {
      id: 3,
      name: 'Tailored Trousers',
      brand: 'UrbanThreadz',
      price: 129,
      originalPrice: null,
      rating: 4.9,
      reviews: 203,
      image: collectionImage,
      badge: 'Bestseller',
      colors: ['Charcoal', 'Navy', 'Olive'],
      sizes: ['28', '30', '32', '34'],
      isNew: false,
      inStock: false,
    },
    {
      id: 4,
      name: 'Cropped Jacket',
      brand: 'UrbanThreadz',
      price: 159,
      originalPrice: 199,
      rating: 4.7,
      reviews: 156,
      image: collectionImage,
      badge: 'Limited',
      colors: ['Camel', 'Black', 'Cream'],
      sizes: ['S', 'M', 'L'],
      isNew: false,
      inStock: true,
    },
  ];

  return (
    <section className="py-10 px-0 bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-4 fade-in-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
            You Might Also Like
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto fade-in-up stagger-1">
            Handpicked pieces that complement your style and elevate your wardrobe
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="product-card group cursor-pointer fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Image Container */}
              <div className="product-image-container aspect-[3/4] mb-4 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.badge && (
                    <Badge
                      variant={product.badge === 'New' ? 'default' : 'secondary'}
                      className={
                        product.badge === 'New' 
                          ? 'bg-accent text-accent-foreground' 
                          : 'bg-background/90 text-foreground'
                      }
                    >
                      {product.badge}
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="destructive">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                {/* Wishlist Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-4 w-4" />
                </Button>

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-background hover:bg-accent hover:text-accent-foreground"
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                {/* Brand & Name */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {product.brand}
                  </p>
                  <h3 className="font-medium text-base sm:text-lg md:text-xl tracking-wide">
                    {product.name}
                  </h3>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(product.rating)
                            ? 'fill-accent text-accent'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviews})
                  </span>
                </div>

                {/* Colors */}
                <div className="flex items-center space-x-1">
                  {product.colors.slice(0, 3).map((color) => (
                    <div
                      key={color}
                      className={`w-3 h-3 rounded-full border border-border ${
                        color === 'Black' ? 'bg-black' :
                        color === 'White' ? 'bg-white' :
                        color === 'Navy' ? 'bg-blue-900' :
                        color === 'Grey' ? 'bg-gray-400' :
                        color === 'Sage' ? 'bg-green-400' :
                        color === 'Charcoal' ? 'bg-gray-700' :
                        color === 'Olive' ? 'bg-green-700' :
                        color === 'Camel' ? 'bg-yellow-600' :
                        'bg-yellow-50'
                      }`}
                      title={color}
                    />
                  ))}
                  {product.colors.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{product.colors.length - 3}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-base sm:text-lg md:text-xl">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;