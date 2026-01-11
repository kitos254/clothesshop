import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  FolderTree, 
  Tag, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Star,
  Package,
  BarChart3,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

interface CategoryStats {
  overview: {
    totalCategories: number;
    activeCategories: number;
    featuredCategories: number;
    inactiveCategories: number;
  };
  byLevel: Array<{
    level: number;
    count: number;
    name: string;
  }>;
}

interface RecentCategory {
  _id: string;
  name: string;
  slug: string;
  level: number;
  isActive: boolean;
  isFeatured: boolean;
  stats: {
    productCount: number;
    totalProductCount: number;
  };
  createdAt: string;
  parent?: {
    name: string;
    slug: string;
  };
}

const CategoryOverview: React.FC = () => {
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { admin } = useAuth();
  const { toast } = useToast();

  const canManageCategories = admin && ["super_admin", "admin", "manager"].includes(admin.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, categoriesResponse] = await Promise.all([
        axios.get('/categories/stats'),
        axios.get('/categories', {
          params: {
            limit: 6,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (categoriesResponse.data.success) {
        setRecentCategories(categoriesResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast({
        title: "Error",
        description: "Failed to load overview data. Please try again.",
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
      case 0: return 'Parent';
      case 1: return 'Child';
      case 2: return 'Grandchild';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
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

        {/* Charts and Lists Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Failed to load overview data</p>
          <Button onClick={fetchData} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              All categories in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.activeCategories}</div>
            <p className="text-xs text-muted-foreground">
              Currently visible to customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Categories</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.featuredCategories}</div>
            <p className="text-xs text-muted-foreground">
              Highlighted on homepage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Categories</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.inactiveCategories}</div>
            <p className="text-xs text-muted-foreground">
              Hidden from customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Level Distribution and Recent Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Hierarchy
            </CardTitle>
            <CardDescription>
              Parent → Child → Grandchild (products are placed in grandchild categories)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byLevel.map((level) => (
                <div key={level.level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getLevelColor(level.level)}>
                      {getLevelName(level.level)}
                    </Badge>
                    <span className="text-sm font-medium">{level.name}</span>
                    {level.level === 2 && (
                      <span className="text-xs text-muted-foreground">(Products go here)</span>
                    )}
                  </div>
                  <div className="text-sm font-bold">{level.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Recent Categories
              </CardTitle>
              <CardDescription>
                Latest created categories
              </CardDescription>
            </div>
            {canManageCategories && (
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCategories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No categories found
                </div>
              ) : (
                recentCategories.map((category) => (
                  <div key={category._id} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getLevelColor(category.level)}`}>
                          <FolderTree className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">
                            {category.name}
                          </p>
                          <Badge 
                            variant={category.isActive ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {category.isFeatured && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{getLevelName(category.level)} Category</span>
                          {category.parent && (
                            <>
                              <span>•</span>
                              <span>under {category.parent.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{category.stats.productCount} products</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {canManageCategories && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common category management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Main Category
              </Button>
              <Button variant="outline" className="justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Product Counts
              </Button>
              <Button variant="outline" className="justify-start">
                <Package className="h-4 w-4 mr-2" />
                View All Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CategoryOverview;
