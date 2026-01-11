import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Plus,
  RefreshCw,
  Check,
  X,
  Folder,
  Home,
  ChevronLeft,
  Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  parent?: {
    _id: string;
    name: string;
    slug: string;
  };
  children: Array<{
    _id: string;
    name: string;
    slug: string;
    isActive: boolean;
    stats: {
      productCount: number;
    };
  }>;
  isActive: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  showInMenu: boolean;
  displayOrder: number;
  stats: {
    productCount: number;
    totalProductCount: number;
    activeProductCount: number;
  };
  image?: {
    url: string;
    alt?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
  };
}

interface CategoryListResponse {
  success: boolean;
  data: Category[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const CategoryList: React.FC = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Tree navigation state
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Array<{id: string, name: string}>>([]);
  const [levelCategories, setLevelCategories] = useState<Category[]>([]);
  
  // Inline category creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('newcategory');
  const [saving, setSaving] = useState(false);

  const canManageCategories = admin && ["super_admin", "admin", "manager"].includes(admin.role);
  const canDeleteCategories = admin && ["super_admin", "admin"].includes(admin.role);

  // Debug logging moved to useEffect to avoid circular calls

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm, selectedStatus, currentLevel]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: 50,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
        parent: currentLevel || 'null' // Fetch categories for current level
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedStatus !== 'all') {
        params.isActive = selectedStatus === 'active';
      }

      const response = await axios.get('/categories', { params });

      if (response.data.success) {
        setLevelCategories(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!canDeleteCategories) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete categories.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/categories/${categoryId}`);
      
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
      
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    if (!canManageCategories) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify categories.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.put(`/categories/${categoryId}`, {
        isActive: !currentStatus
      });
      
      toast({
        title: "Success",
        description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
      
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update category.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = () => {
    setIsCreating(true);
    setNewCategoryName('newcategory');
  };

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const categoryData = {
        name: newCategoryName.trim(),
        parent: currentLevel || null // Set parent to current level or null for root
      };

      const response = await axios.post('/categories', categoryData);
      
      if (response.data.success) {
        const newCategory = response.data.data;
        
        // Add the new category to the current list silently
        setLevelCategories(prev => [...prev, newCategory]);
        
        toast({
          title: "Success",
          description: "Category created successfully.",
        });
        
        setIsCreating(false);
        setNewCategoryName('newcategory');
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create category.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewCategoryName('newcategory');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewCategory();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  // Tree navigation functions
  const navigateToCategory = (categoryId: string, categoryName: string) => {
    const newBreadcrumb = [...breadcrumb, { id: categoryId, name: categoryName }];
    setBreadcrumb(newBreadcrumb);
    setCurrentLevel(categoryId);
    setCurrentPage(1);
  };

  const navigateToProducts = (categoryId: string) => {
    // Navigate to products page filtered by this category
    navigate(`/products?tab=products&category=${categoryId}`);
  };

  const handleCategoryClick = (category: Category) => {
    // If grandchild (level 2), navigate to products
    if (category.level === 2) {
      navigateToProducts(category._id);
    } else {
      navigateToCategory(category._id, category.name);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      // Navigate to root
      setBreadcrumb([]);
      setCurrentLevel(null);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
      setCurrentLevel(newBreadcrumb[newBreadcrumb.length - 1]?.id || null);
    }
    setCurrentPage(1);
  };

  const getCurrentLevelName = () => {
    const level = getCurrentLevelNumber();
    if (level === 0) return 'Parent Categories (Level 1)';
    if (level === 1) {
      const lastItem = breadcrumb[breadcrumb.length - 1];
      return `${lastItem.name} - Child Categories (Level 2)`;
    }
    if (level === 2) {
      const lastItem = breadcrumb[breadcrumb.length - 1];
      return `${lastItem.name} - Grandchild Categories (Level 3 - Products go here)`;
    }
    return 'Categories';
  };

  const getCurrentLevelNumber = () => {
    return breadcrumb.length;
  };

  const canAddSubcategory = () => {
    const level = getCurrentLevelNumber();
    return level < 3; // Max 3 levels (0, 1, 2) - stop at level 3 (grandchild)
  };

  const getCreateButtonText = () => {
    const level = getCurrentLevelNumber();
    switch (level) {
      case 0: return 'Create Parent Category';
      case 1: return 'Create Child Category'; 
      case 2: return 'Create Grandchild Category';
      default: return 'Create Category';
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 1: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 2: return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0: return 'Parent';
      case 1: return 'Child';
      case 2: return 'Grandchild';
      default: return `Level ${level}`;
    }
  };

  const renderCategoryRow = (category: Category) => (
    <TableRow 
      key={category._id} 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleCategoryClick(category)}
    >
      <TableCell>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <Folder className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground">
                  {category.name}
                </span>
                {category.children.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.children.length} {category.children.length === 1 ? 'child' : 'children'}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {category.slug}
              </div>
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {category.level === 2 ? (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-purple-600" />
              <span className="text-foreground font-medium">{category.stats.productCount} products</span>
            </div>
          ) : (
            <>
              <div className="text-foreground">{category.stats.productCount} direct</div>
              <div className="text-muted-foreground">
                {category.stats.totalProductCount} total
              </div>
            </>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <Badge variant={category.isActive ? "default" : "secondary"}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
        {category.level === 2 && (
          <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            Products
          </Badge>
        )}
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {new Date(category.createdAt).toLocaleDateString()}
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {category.level === 2 ? (
              <DropdownMenuItem onClick={() => navigateToProducts(category._id)}>
                <Package className="h-4 w-4 mr-2" />
                View Products
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => navigateToCategory(category._id, category.name)}>
                <Folder className="h-4 w-4 mr-2" />
                Open Folder
              </DropdownMenuItem>
            )}
            
            {canManageCategories && (
              <>
                <DropdownMenuItem onClick={() => handleToggleStatus(category._id, category.isActive)}>
                  {category.isActive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {canDeleteCategories && (
                  <DropdownMenuItem 
                    onClick={() => handleDeleteCategory(category._id, category.name)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                    </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="min-h-[90vh]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60 mt-1" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Breadcrumb skeleton */}
              <div className="p-2 bg-muted/50 dark:bg-muted/20 rounded-lg">
                <Skeleton className="h-8 w-48" />
              </div>
              
              {/* Filters skeleton */}
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              
              {/* Table skeleton */}
              <div className="border rounded-lg">
                {/* Table header skeleton */}
                <div className="border-b p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                
                {/* Table rows skeleton */}
                <div className="space-y-0">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="border-b last:border-b-0 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="min-h-[90vh]">
      <CardHeader className="pb-2 pt-4">

        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between p-2 bg-muted/50 dark:bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumb.length === 0 ? (
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span className="font-medium">Home</span>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToBreadcrumb(-1)}
                  className="h-8 px-2"
                >
                  <Home className="h-4 w-4" />
                </Button>
                
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ChevronRight className="h-4 w-4" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateToBreadcrumb(index)}
                      className="h-8 px-2 font-medium"
                    >
                      {item.name}
                    </Button>
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCategories}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {canManageCategories && canAddSubcategory() && (
              <Button onClick={handleCreateCategory} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                {getCreateButtonText()}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 px-4 pb-4">
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Back button for navigation */}
          {breadcrumb.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigateToBreadcrumb(breadcrumb.length - 2)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        {/* Categories Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Inline category creation row */}
              {isCreating && (
                <TableRow className="bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={handleKeyPress}
                              className="h-8 text-sm max-w-xs"
                              placeholder="Category name"
                              autoFocus
                            />
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {getCurrentLevelNumber() === 0 ? 'Main category' : `Subcategory of ${breadcrumb[breadcrumb.length - 1]?.name}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>-</TableCell>
                  <TableCell>
                    <Badge variant="outline">New</Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        onClick={handleSaveNewCategory}
                        disabled={saving || !newCategoryName.trim()}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelCreate}
                        disabled={saving}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {levelCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || selectedStatus !== 'all' 
                        ? 'No categories match your filters' 
                        : getCurrentLevelNumber() === 0 
                          ? 'No categories found. Create your first category!' 
                          : 'This category has no subcategories yet.'
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                levelCategories.map(category => renderCategoryRow(category))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} categories
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === pagination.currentPage - 2 ||
                    page === pagination.currentPage + 2
                  ) {
                    return <span key={page} className="px-1">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryList;
