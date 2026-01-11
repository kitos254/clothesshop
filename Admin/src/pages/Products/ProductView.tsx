import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share, 
  Star,
  Package,
  DollarSign,
  Tag,
  Calendar,
  Barcode,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import axios from '@/lib/axios';

interface VariationCombination {
  _id: string;
  combination: Array<{ name: string; value: string }>;
  sku: string;
  price: number;
  stock: {
    quantity: number;
    reserved?: number;
  };
  isActive: boolean;
}

interface VariationDefinition {
  _id: string;
  name: string;
  values: string[];
  affectsPrice: boolean;
  affectsStock: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  brand: {
    name: string;
    logo?: string;
    website?: string;
  };
  category: string;
  tags: string[];
  status: string;
  condition: string;
  isFeatured: boolean;
  isActive: boolean;
  isDigital: boolean;
  hasVariations?: boolean;
  variationDefinitions?: VariationDefinition[];
  variationCombinations?: VariationCombination[];
  stock: {
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
  };
  images: Array<{
    _id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Helper function to calculate total stock considering variations
const calculateTotalStock = (product: Product): number => {
  // Check if product has variations that affect stock
  const hasStockAffectingVariations = product.hasVariations && 
    product.variationDefinitions?.some(def => def.affectsStock) &&
    product.variationCombinations && 
    product.variationCombinations.length > 0;

  if (hasStockAffectingVariations) {
    // Sum stock from all active variation combinations
    return product.variationCombinations!
      .filter(combo => combo.isActive)
      .reduce((total, combo) => total + (combo.stock?.quantity || 0), 0);
  }

  // Use base product stock
  return product.stock?.quantity || 0;
};

const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/products/${id}`);
      
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch product');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load product",
        variant: "destructive",
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-lg font-semibold">Loading Product...</h2>
          <p className="text-muted-foreground">
            Please wait while we load the product details.
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold">Product Not Found</h2>
          <p className="text-muted-foreground">
            The product you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/products/edit/${product._id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 ? (
                <div className="space-y-4">
                  {primaryImage && (
                    <div className="aspect-video relative overflow-hidden rounded-lg border">
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.alt || product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.slice(0, 4).map((image) => (
                        <div
                          key={image._id}
                          className="aspect-square relative overflow-hidden rounded border"
                        >
                          <img
                            src={image.url}
                            alt={image.alt || product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No images available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Featured</span>
                <Badge variant={product.isFeatured ? "default" : "secondary"}>
                  {product.isFeatured ? (
                    <>
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </>
                  ) : (
                    'Not Featured'
                  )}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type</span>
                <Badge variant="outline">
                  {product.isDigital ? 'Digital' : 'Physical'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price</span>
                <span className="font-semibold">${product.price?.toFixed(2) || '0.00'}</span>
              </div>
              
              {product.comparePrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compare Price</span>
                  <span className="text-muted-foreground line-through">
                    ${product.comparePrice.toFixed(2)}
                  </span>
                </div>
              )}
              
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cost Price</span>
                  <span className="text-muted-foreground">
                    ${product.costPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SKU</span>
                <Badge variant="outline" className="font-mono text-xs">
                  <Barcode className="h-3 w-3 mr-1" />
                  {product.sku}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity</span>
                <div className="text-right">
                  <span className="font-medium">{calculateTotalStock(product)}</span>
                  {product.hasVariations && product.variationDefinitions?.some(def => def.affectsStock) && (
                    <span className="text-xs text-muted-foreground ml-1">(from variations)</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Min Quantity</span>
                <span className="text-muted-foreground">{product.stock?.minQuantity || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Track Quantity</span>
                <Badge variant={product.stock?.trackQuantity ? "default" : "secondary"}>
                  {product.stock?.trackQuantity ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.brand?.name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brand</span>
                  <Badge variant="outline" className="flex items-center">
                    <Building className="h-3 w-3 mr-1" />
                    {product.brand.name}
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Condition</span>
                <Badge variant="outline">{product.condition || 'New'}</Badge>
              </div>
              
              {product.tags && product.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium mb-2 block">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-2" />
                  Created: {new Date(product.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-2" />
                  Updated: {new Date(product.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductView;
