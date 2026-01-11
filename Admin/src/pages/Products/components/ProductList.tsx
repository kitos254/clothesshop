import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  Trash2,
  Power,
  PowerOff,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/axios';

interface VariationCombination {
  _id: string;
  stock: {
    quantity: number;
    reserved?: number;
  };
  isActive: boolean;
}

interface VariationDefinition {
  _id: string;
  name: string;
  affectsStock: boolean;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  status: 'active' | 'inactive' | 'draft' | 'discontinued';
  category?: {
    _id: string;
    name: string;
  };
  brand: {
    name: string;
  };
  stock?: {
    quantity: number;
    trackQuantity: boolean;
    minQuantity: number;
  };
  hasVariations?: boolean;
  variationDefinitions?: VariationDefinition[];
  variationCombinations?: VariationCombination[];
  isFeatured: boolean;
  isActive: boolean;
  images: Array<{ url: string; isPrimary: boolean }>;
  createdAt: string;
  updatedAt: string;
}

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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '20'));

  useEffect(() => {
    fetchProducts();
  }, [page, limit, search, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    // Update URL with current filters
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (sortBy !== 'createdAt') params.sortBy = sortBy;
    if (sortOrder !== 'desc') params.sortOrder = sortOrder;
    if (page !== 1) params.page = page.toString();
    if (limit !== 20) params.limit = limit.toString();
    
    setSearchParams(params);
  }, [search, statusFilter, categoryFilter, sortBy, sortOrder, page, limit, setSearchParams]);

  // Permission checks
  const canManageProducts = admin && ["super_admin", "admin", "manager"].includes(admin.role);
  const canDeleteProducts = admin && ["super_admin", "admin"].includes(admin.role);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
        includeDrafts: true // Always include drafts in the fetch
      };

      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const response = await axios.get('/products', { params });

      if (response.data.success) {
        // Ensure data is an array
        const productsData = Array.isArray(response.data.data) ? response.data.data : [];
        setProducts(productsData);
        
        // Set pagination with defaults if not provided
        setPagination(response.data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: productsData.length,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        // Handle unsuccessful response
        setProducts([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        });
      }

    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      // Reset to empty state on error
      setProducts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPrevPage: false
      });
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    if (!canManageProducts) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify products.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.put(`/products/${productId}`, {
        isFeatured: !currentFeatured
      });

      setProducts(prev => prev.map(product => 
        product._id === productId 
          ? { ...product, isFeatured: !currentFeatured }
          : product
      ));

      toast({
        title: "Success",
        description: `Product ${!currentFeatured ? 'added to' : 'removed from'} featured`,
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    if (!canManageProducts) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify products.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.put(`/products/${productId}`, {
        isActive: !currentActive
      });

      setProducts(prev => prev.map(product => 
        product._id === productId 
          ? { ...product, isActive: !currentActive }
          : product
      ));

      toast({
        title: "Success",
        description: `Product ${!currentActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!canDeleteProducts) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete products.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/products/${productId}`);

      setProducts(prev => prev.filter(product => product._id !== productId));
      setSelectedProducts(prev => prev.filter(id => id !== productId));

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete product",
        variant: "destructive",
      });
    }
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
        return <Badge variant="destructive">Discontinued</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStockBadge = (product: Product) => {
    if (!product.stock || !product.stock.trackQuantity) return null;
    
    const stockQuantity = calculateProductStock(product);
    
    if (stockQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (stockQuantity <= product.stock.minQuantity) {
      return <Badge variant="outline" className="text-orange-600">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="text-green-600">In Stock</Badge>;
  };

  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSortChange('price')}
              >
                Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSortChange('createdAt')}
              >
                Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : !Array.isArray(products) || products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No products found</p>
                  <Button onClick={() => navigate('/products/create')} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedProducts.includes(product._id)}
                      onCheckedChange={() => handleSelectProduct(product._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted rounded flex-shrink-0">
                        {product.images.length > 0 ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.category?.name || 'No Category'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{calculateProductStock(product)}</span>
                      {getStockBadge(product)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(product.status)}
                      {product.isFeatured && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/products/view/${product._id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/products/edit/${product._id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        
                        {canManageProducts && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleFeatured(product._id, product.isFeatured)}>
                              {product.isFeatured ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove from Featured
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(product._id, product.isActive)}>
                              {product.isActive ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {canDeleteProducts && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteProduct(product._id, product.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))
      ) : !Array.isArray(products) || products.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No products found</p>
          <Button onClick={() => navigate('/products/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      ) : (
        products.map((product) => (
          <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="h-48 bg-muted">
                {product.images.length > 0 ? (
                  <img 
                    src={product.images[0].url} 
                    alt={product.name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {product.isFeatured && (
                  <Badge className="bg-yellow-500">Featured</Badge>
                )}
                {getStatusBadge(product.status)}
              </div>
              <div className="absolute top-2 left-2">
                <Checkbox 
                  checked={selectedProducts.includes(product._id)}
                  onCheckedChange={() => handleSelectProduct(product._id)}
                  className="bg-white"
                />
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
              <p className="text-lg font-bold mt-2">${product.price}</p>
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">{product.category?.name || 'No Category'}</p>
                  {getStockBadge(product)}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/products/view/${product._id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/products/edit/${product._id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} products
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={!pagination.hasPrevPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={!pagination.hasNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length} products selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Power className="h-4 w-4 mr-2" />
                Bulk Activate
              </Button>
              <Button variant="outline" size="sm">
                <PowerOff className="h-4 w-4 mr-2" />
                Bulk Deactivate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Products List */}
      {viewMode === 'table' ? renderTableView() : renderCardView()}

      {/* Pagination */}
      {!loading && Array.isArray(products) && products.length > 0 && renderPagination()}
    </div>
  );
};

export default ProductList;
