import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Eye, 
  ShoppingCart,
  Star,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueChange: number;
    ordersChange: number;
  };
  products: {
    totalViews: number;
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
  };
  topPerformers: Array<{
    _id: string;
    name: string;
    revenue: number;
    orders: number;
    views: number;
    conversionRate: number;
  }>;
  recentActivity: Array<{
    _id: string;
    type: 'sale' | 'view' | 'stock_alert';
    product: string;
    timestamp: string;
    value?: number;
  }>;
}

const ProductAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    sales: {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      revenueChange: 0,
      ordersChange: 0,
    },
    products: {
      totalViews: 0,
      totalProducts: 0,
      outOfStock: 0,
      lowStock: 0,
    },
    topPerformers: [],
    recentActivity: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setAnalyticsData({
        sales: {
          totalRevenue: 45678.90,
          totalOrders: 234,
          averageOrderValue: 195.25,
          revenueChange: 12.5,
          ordersChange: -3.2,
        },
        products: {
          totalViews: 15890,
          totalProducts: 156,
          outOfStock: 8,
          lowStock: 12,
        },
        topPerformers: [
          {
            _id: '1',
            name: 'Premium Cotton T-Shirt',
            revenue: 5678.90,
            orders: 45,
            views: 1250,
            conversionRate: 3.6,
          },
          {
            _id: '2',
            name: 'Denim Jacket',
            revenue: 4321.50,
            orders: 32,
            views: 980,
            conversionRate: 3.3,
          },
          {
            _id: '3',
            name: 'Sports Sneakers',
            revenue: 3456.75,
            orders: 28,
            views: 1100,
            conversionRate: 2.5,
          }
        ],
        recentActivity: [
          {
            _id: '1',
            type: 'sale',
            product: 'Premium Cotton T-Shirt',
            timestamp: new Date().toISOString(),
            value: 29.99,
          },
          {
            _id: '2',
            type: 'view',
            product: 'Denim Jacket',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
          {
            _id: '3',
            type: 'stock_alert',
            product: 'Sports Sneakers',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          }
        ]
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'view':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'stock_alert':
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: AnalyticsData['recentActivity'][0]) => {
    switch (activity.type) {
      case 'sale':
        return `Sale: ${formatCurrency(activity.value || 0)}`;
      case 'view':
        return 'Product viewed';
      case 'stock_alert':
        return 'Low stock alert';
      default:
        return 'Activity';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Time Range Selector Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.sales.totalRevenue)}</p>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(analyticsData.sales.revenueChange)}`}>
                  {getChangeIcon(analyticsData.sales.revenueChange)}
                  {formatPercentage(analyticsData.sales.revenueChange)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analyticsData.sales.totalOrders.toLocaleString()}</p>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(analyticsData.sales.ordersChange)}`}>
                  {getChangeIcon(analyticsData.sales.ordersChange)}
                  {formatPercentage(analyticsData.sales.ordersChange)}
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.sales.averageOrderValue)}</p>
                <p className="text-sm text-muted-foreground">Per order</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product Views</p>
                <p className="text-2xl font-bold">{analyticsData.products.totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total views</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topPerformers.map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.orders} orders • {product.views} views
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.conversionRate.toFixed(1)}% conversion
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="font-medium">{activity.product}</p>
                    <p className="text-sm text-muted-foreground">
                      {getActivityText(activity)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{analyticsData.products.totalProducts}</p>
              </div>
              <Badge variant="outline">{analyticsData.products.totalProducts} items</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{analyticsData.products.outOfStock}</p>
              </div>
              <Badge variant="destructive">{analyticsData.products.outOfStock} items</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{analyticsData.products.lowStock}</p>
              </div>
              <Badge variant="outline" className="text-orange-600">{analyticsData.products.lowStock} items</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAnalytics;
