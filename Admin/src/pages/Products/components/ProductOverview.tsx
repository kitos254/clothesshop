import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Eye,
  Edit,
  BarChart3,
  ShoppingCart,
  Star,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ProductApiService, type ProductStats, type Product } from '../services/productApi';

// Helper function to calculate total stock considering variations
const calculateProductStock = (product: Product): number => {
  const hasStockAffectingVariations = product.hasVariations && 
    product.variationDefinitions?.some(def => def.affectsStock) &&
    product.variationCombinations && 
    product.variationCombinations.length > 0;

  if (hasStockAffectingVariations) {
    return product.variationCombinations!
      .filter(combo => combo.isActive)
      .reduce((total, combo) => total + (combo.stock?.quantity || 0), 0);
  }

  return product.stock?.quantity || 0;
};

interface RecentProduct {
  _id: string;
  name: string;
  sku: string;
  price: number;
  status: 'active' | 'inactive' | 'draft' | 'discontinued';
  stock: {
    quantity: number;
    trackQuantity: boolean;
  };
  createdAt: string;
  images: Array<{ url: string; isPrimary: boolean }>;
}

const ProductOverview: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats['totals']>({
    total: 0,
    active: 0,
    featured: 0,
    outOfStock: 0,
    lowStock: 0
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and recent products from API
      const [statsResponse, recentResponse] = await Promise.all([
        ProductApiService.getStats(),
        ProductApiService.getRecentProducts({ limit: 5 })
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.totals);
      }

      if (recentResponse.success && recentResponse.data) {
        setRecentProducts(recentResponse.data.products);
      }

      // Show error if any request failed
      if (!statsResponse.success) {
        throw new Error(statsResponse.error || 'Failed to fetch stats');
      }
      if (!recentResponse.success) {
        throw new Error(recentResponse.error || 'Failed to fetch recent products');
      }

    } catch (error: any) {
      console.error('Error fetching overview data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load overview data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    navigate('/products/create');
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/view/${productId}`);
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/products/edit/${productId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'discontinued':
        return <Badge variant="secondary">Discontinued</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStockStatus = (product: Product) => {
    if (!product.stock?.trackQuantity) return null;
    
    const stockQuantity = calculateProductStock(product);
    
    if (stockQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (stockQuantity <= 10) {
      return <Badge variant="outline" className="text-orange-600">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="text-green-600">In Stock</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Products Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={handleCreateProduct} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Product
        </Button>
        <Button variant="outline" onClick={() => navigate('/products?tab=products')}>
          <Package className="h-4 w-4 mr-2" />
          View All Products
        </Button>
        <Button variant="outline" onClick={() => navigate('/products?tab=analytics')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.featured}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.lowStock}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Products
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/products?tab=products')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!recentProducts || recentProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products found</p>
                <Button onClick={handleCreateProduct} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Product
                </Button>
              </div>
            ) : (
              recentProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0].url} 
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku} • ${product.price}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStockStatus(product)}
                    {getStatusBadge(product.status)}
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProduct(product._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product._id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductOverview;
