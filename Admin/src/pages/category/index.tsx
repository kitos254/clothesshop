import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, BarChart3, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Import components
import CategoryOverview from './components/CategoryOverview';
import CategoryList from './components/CategoryList';
import CategoryAnalytics from './components/CategoryAnalytics';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Check if user can manage categories
  const canManageCategories = admin && ["super_admin", "admin", "manager"].includes(admin.role);

  // Load active tab from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem("categories-active-tab");
    if (savedTab && ['overview', 'categories', 'analytics'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("categories-active-tab", value);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Handle create new category
  const handleCreateCategory = async () => {
    if (!canManageCategories) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create categories.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // This will trigger the creation flow and redirect to edit
      navigate('/categories/create');
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create new category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-1">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access this page.
          </p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Package,
      component: CategoryOverview,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: FolderTree,
      component: CategoryList,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: CategoryAnalytics,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Categories Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Tab Navigation */}
        <TabsList className="bg-transparent border-0 p-0 h-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-foreground rounded-none px-4 py-2 flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="overview" className="mt-6">
          <CategoryOverview />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryList />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <CategoryAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoriesPage;