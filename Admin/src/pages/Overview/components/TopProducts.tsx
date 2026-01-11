import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MoreHorizontal, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  image?: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface TopProductsProps {
  data?: Product[];
  isLoading?: boolean;
}

const TopProducts: React.FC<TopProductsProps> = ({ data, isLoading }) => {
  // Mock data if no data provided
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Cotton T-Shirt',
      category: 'Clothing',
      sales: 245,
      revenue: 4900,
      trend: 'up',
      trendPercentage: 12.5,
    },
    {
      id: '2',
      name: 'Denim Jacket',
      category: 'Outerwear',
      sales: 189,
      revenue: 7560,
      trend: 'up',
      trendPercentage: 8.3,
    },
    {
      id: '3',
      name: 'Running Shoes',
      category: 'Footwear',
      sales: 156,
      revenue: 12480,
      trend: 'down',
      trendPercentage: -3.2,
    },
    {
      id: '4',
      name: 'Casual Sneakers',
      category: 'Footwear',
      sales: 134,
      revenue: 8040,
      trend: 'stable',
      trendPercentage: 0.5,
    },
    {
      id: '5',
      name: 'Summer Dress',
      category: 'Clothing',
      sales: 98,
      revenue: 4410,
      trend: 'up',
      trendPercentage: 15.7,
    },
  ];

  const products = data || mockProducts;

  const getTrendColor = (trend: Product['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: Product['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 rotate-180" />;
      case 'stable':
        return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No products data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <span className="text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <span>•</span>
                      <span>{product.sales} sold</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      ${product.revenue.toLocaleString()}
                    </div>
                    <div className={`flex items-center text-xs ${getTrendColor(product.trend)}`}>
                      {getTrendIcon(product.trend)}
                      <span className="ml-1">
                        {product.trend === 'stable' ? '±' : ''}{Math.abs(product.trendPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {products.length > 5 && (
              <div className="text-center pt-2">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                  View all products
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProducts;
