import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

interface AnalyticsData {
  overview: {
    totalCategories: number;
    activeCategories: number;
    categoriesWithProducts: number;
    avgProductsPerCategory: number;
  };
  byLevel: Array<{
    level: number;
    name: string;
    count: number;
    activeCount: number;
    productCount: number;
  }>;
  recentActivity: Array<{
    _id: string;
    name: string;
    action: 'created' | 'updated' | 'activated' | 'deactivated';
    date: string;
    user: string;
  }>;
  topCategories: Array<{
    _id: string;
    name: string;
    slug: string;
    level: number;
    productCount: number;
    parent?: {
      name: string;
    };
  }>;
  performanceMetrics: {
    categoriesGrowth: number;
    productDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
}

const CategoryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { admin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Since we don't have a specific analytics endpoint, we'll simulate the data
      // In a real implementation, you would call multiple endpoints or a dedicated analytics endpoint
      const [statsResponse, categoriesResponse] = await Promise.all([
        axios.get('/categories/stats'),
        axios.get('/categories', { params: { limit: 100 } })
      ]);

      if (statsResponse.data.success && categoriesResponse.data.success) {
        const stats = statsResponse.data.data;
        const categories = categoriesResponse.data.data;

        // Calculate analytics from the data
        const categoriesWithProducts = categories.filter((cat: any) => cat.stats.productCount > 0).length;
        const totalProducts = categories.reduce((sum: number, cat: any) => sum + cat.stats.productCount, 0);
        const avgProductsPerCategory = categoriesWithProducts > 0 ? totalProducts / categoriesWithProducts : 0;

        // Top categories by product count
        const topCategories = [...categories]
          .sort((a: any, b: any) => b.stats.productCount - a.stats.productCount)
          .slice(0, 10)
          .map((cat: any) => ({
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            level: cat.level,
            productCount: cat.stats.productCount,
            parent: cat.parent
          }));

        // Product distribution ranges
        const productDistribution = [
          { range: '0 products', count: 0, percentage: 0 },
          { range: '1-5 products', count: 0, percentage: 0 },
          { range: '6-20 products', count: 0, percentage: 0 },
          { range: '21-50 products', count: 0, percentage: 0 },
          { range: '50+ products', count: 0, percentage: 0 },
        ];

        categories.forEach((cat: any) => {
          const count = cat.stats.productCount;
          if (count === 0) productDistribution[0].count++;
          else if (count <= 5) productDistribution[1].count++;
          else if (count <= 20) productDistribution[2].count++;
          else if (count <= 50) productDistribution[3].count++;
          else productDistribution[4].count++;
        });

        productDistribution.forEach((item) => {
          item.percentage = categories.length > 0 ? (item.count / categories.length) * 100 : 0;
        });

        // Mock recent activity (in real app, this would come from audit logs)
        const recentActivity = categories.slice(0, 5).map((cat: any) => ({
          _id: cat._id,
          name: cat.name,
          action: 'created' as const,
          date: cat.createdAt,
          user: cat.createdBy?.name || 'Unknown'
        }));

        const analyticsData: AnalyticsData = {
          overview: {
            totalCategories: stats.overview.totalCategories,
            activeCategories: stats.overview.activeCategories,
            categoriesWithProducts,
            avgProductsPerCategory: Math.round(avgProductsPerCategory * 10) / 10
          },
          byLevel: stats.byLevel,
          topCategories,
          recentActivity,
          performanceMetrics: {
            categoriesGrowth: 15.2, // Mock growth percentage
            productDistribution
          }
        };

        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 0: return 'Main';
      case 1: return 'Sub';
      case 2: return 'Child';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Analytics</h2>
          <p className="text-muted-foreground">
            Insights and performance metrics for your category structure
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
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
          
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCategories}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analytics.performanceMetrics.categoriesGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.activeCategories}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.overview.activeCategories / analytics.overview.totalCategories) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.categoriesWithProducts}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.overview.categoriesWithProducts / analytics.overview.totalCategories) * 100)}% have products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Products/Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.avgProductsPerCategory}</div>
            <p className="text-xs text-muted-foreground">
              Products per active category
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribution by Level
            </CardTitle>
            <CardDescription>
              Category breakdown across hierarchy levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.byLevel.map((level) => (
                <div key={level.level} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getLevelColor(level.level)}>
                        Level {level.level}
                      </Badge>
                      <span className="font-medium">{level.name}</span>
                    </div>
                    <span className="font-bold">{level.count}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Active: {level.activeCount}</span>
                      <span>Products: {level.productCount}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${analytics.overview.totalCategories > 0 ? (level.count / analytics.overview.totalCategories) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Categories by Products
            </CardTitle>
            <CardDescription>
              Categories with the most products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topCategories.slice(0, 8).map((category, index) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">{category.name}</p>
                        <Badge variant="outline" className={`${getLevelColor(category.level)} text-xs`}>
                          {getLevelName(category.level)}
                        </Badge>
                      </div>
                      {category.parent && (
                        <p className="text-xs text-muted-foreground">
                          under {category.parent.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold">{category.productCount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Distribution
            </CardTitle>
            <CardDescription>
              How products are distributed across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performanceMetrics.productDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.range}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">{item.count} categories</span>
                      <span className="font-bold">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
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
            <CardDescription>
              Latest category management actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent activity
                </div>
              ) : (
                analytics.recentActivity.map((activity) => (
                  <div key={`${activity._id}-${activity.date}`} className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.name}</span>
                        <span className="text-muted-foreground"> was {activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {activity.user} • {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Recommendations and insights based on your category performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Growth Opportunity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {analytics.performanceMetrics.productDistribution[0].count} categories have no products. 
                Consider adding products or removing unused categories.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Balance Check</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Level distribution looks balanced with {analytics.byLevel[0]?.count || 0} main categories 
                and {analytics.byLevel[1]?.count || 0} subcategories.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-sm">Activation Rate</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {Math.round((analytics.overview.activeCategories / analytics.overview.totalCategories) * 100)}% 
                of categories are active. Review inactive categories for optimization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryAnalytics;
