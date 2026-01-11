import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from '@/lib/axios';
import ProductForm from './components/ProductForm';

interface Product {
  _id: string;
  name: string;
  description: string;
  keyFeatures?: string;
  whatsInBox?: string;
  specifications?: string;
  sku: string;
  price: number;
  originalPrice?: number;
  currentPrice?: number;
  comparePrice?: number;
  costPrice?: number;
  brand: {
    name: string;
    logo?: string;
    website?: string;
  };
  category: string;
  status: string;
  condition: string;
  isFeatured: boolean;
  isActive: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
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
  hasVariations?: boolean;
  variationDefinitions?: any[];
  variationCombinations?: any[];
}

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (productData: any) => {
    try {
      setSaving(true);
      const response = await axios.put(`/products/${id}`, productData);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        setProduct(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update product",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
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
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">{product.name}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/products')}
            disabled={saving}
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // Find the form and trigger submit
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={saving}
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Product
              </>
            )}
          </Button>
        </div>
      </div>

      <ProductForm
        product={product}
        onSave={handleSave}
        saving={saving}
        mode="edit"
      />
    </div>
  );
};

export default ProductEdit;
