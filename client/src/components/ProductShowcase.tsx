import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ProductCard';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Transform products to match ProductCard expected format
  const transformProduct = (product: Product) => {
    const getBrandName = (brand?: { name: string } | string): string | undefined => {
      if (!brand) return undefined;
      return typeof brand === 'string' ? brand : brand.name;
    };

    return {
      ...product,
      brand: getBrandName(product.brand),
      price: product.currentPrice || product.price || 0,
      originalPrice: product.originalPrice,
    };
  };

  if (loading) {
    return (
      <section className="py-10 px-0 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

        {/* Products Grid - Using shared ProductCard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={transformProduct(product) as any}
              viewMode="grid"
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/categories">
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