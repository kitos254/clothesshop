import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  X, 
  Upload, 
  Package, 
  DollarSign, 
  Building,
  Image as ImageIcon,
  Plus,
  Trash2,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ImageUpload from '@/components/ImageUpload';
import ProductVariations from './ProductVariations';
import { formatCurrency } from '@/utils/currency';
import axios from '@/lib/axios';

interface ProductFormProps {
  product?: any;
  onSave: (productData: any) => Promise<any>;
  saving: boolean;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  keyFeatures: string;
  whatsInBox: string;
  specifications: string;
  sku: string;
  originalPrice: number;
  currentPrice: number;
  brand: {
    name: string;
    logo: string;
    website: string;
  };
  category: string; // This will store the final child category ID
  mainCategory: string; // For UI purposes
  subCategory: string; // For UI purposes
  specificCategory: string; // For UI purposes
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
    _id?: string;
    url: string;
    alt: string;
    isPrimary: boolean;
    file?: File;
    isPreview?: boolean;
  }>;
  hasVariations: boolean;
  variationDefinitions: Array<{
    _id?: string;
    name: string;
    displayOrder: number;
    affectsPrice: boolean;
    affectsStock: boolean;
    values: Array<{
      value: string;
      displayName?: string;
      colorCode?: string;
      image?: string;
      isActive: boolean;
      displayOrder: number;
    }>;
    isActive: boolean;
  }>;
  variationCombinations: Array<{
    _id?: string;
    combination: Array<{
      variationId: string;
      variationName: string;
      value: string;
    }>;
    sku?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    stock: {
      quantity: number;
      reserved: number;
    };
    isActive: boolean;
    isDefault: boolean;
  }>;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSave, 
  saving, 
  mode 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    keyFeatures: '',
    whatsInBox: '',
    specifications: '',
    sku: '',
    originalPrice: 0,
    currentPrice: 0,
    brand: {
      name: '',
      logo: '',
      website: ''
    },
    category: '',
    mainCategory: '',
    subCategory: '',
    specificCategory: '',
    status: 'draft',
    condition: 'new',
    isFeatured: false,
    isActive: true,
    isNewArrival: false,
    isOnSale: false,
    stock: {
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 1000,
      trackQuantity: true,
      allowBackorder: false
    },
    images: [],
    hasVariations: false,
    variationDefinitions: [],
    variationCombinations: []
  });

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [specificCategories, setSpecificCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchMainCategories();
    
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        keyFeatures: product.keyFeatures || '',
        whatsInBox: product.whatsInBox || '',
        specifications: product.specifications || '',
        sku: product.sku || '',
        originalPrice: product.originalPrice || product.price || 0,
        currentPrice: product.currentPrice || product.price || 0,
        brand: {
          name: product.brand?.name || '',
          logo: product.brand?.logo || '',
          website: product.brand?.website || ''
        },
        // Handle category as either string ID or object with _id
        category: typeof product.category === 'object' ? product.category?._id || '' : product.category || '',
        mainCategory: '',
        subCategory: '',
        specificCategory: '',
        status: product.status || 'draft',
        condition: product.condition || 'new',
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== undefined ? product.isActive : true,
        isNewArrival: product.isNewArrival || false,
        isOnSale: product.isOnSale || false,
        stock: {
          quantity: product.stock?.quantity || 0,
          minQuantity: product.stock?.minQuantity || 0,
          maxQuantity: product.stock?.maxQuantity || 1000,
          trackQuantity: product.stock?.trackQuantity !== undefined ? product.stock.trackQuantity : true,
          allowBackorder: product.stock?.allowBackorder || false
        },
        images: product.images || [],
        hasVariations: product.hasVariations || false,
        variationDefinitions: product.variationDefinitions || [],
        variationCombinations: product.variationCombinations || []
      });

      // If product has a category, fetch the hierarchy
      if (product.category) {
        // Handle category as either string ID or object with _id
        const categoryId = typeof product.category === 'object' ? product.category?._id : product.category;
        if (categoryId) {
          fetchCategoryHierarchy(categoryId);
        }
      }
    }
  }, [product]);

  const fetchMainCategories = async () => {
    try {
      const response = await axios.get('/categories/main');
      if (response.data.success) {
        setMainCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching main categories:', error);
    }
  };

  const fetchSubCategories = async (parentId: string): Promise<any[]> => {
    try {
      const response = await axios.get(`/categories/sub/${parentId}`);
      if (response.data.success) {
        const data = response.data.data || [];
        setSubCategories(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
      return [];
    }
  };

  const fetchSpecificCategories = async (parentId: string): Promise<any[]> => {
    try {
      const response = await axios.get(`/categories/child/${parentId}`);
      if (response.data.success) {
        const data = response.data.data || [];
        setSpecificCategories(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching specific categories:', error);
      setSpecificCategories([]);
      return [];
    }
  };

  const fetchCategoryHierarchy = async (categoryId: string) => {
    try {
      const response = await axios.get(`/categories/hierarchy/${categoryId}`);
      if (response.data.success) {
        const hierarchy = response.data.data;
        
        // First, fetch the dropdown options BEFORE setting form values
        // This ensures the options are available when the values are set
        let subCats: any[] = [];
        let specificCats: any[] = [];
        
        if (hierarchy.mainCategory?._id) {
          subCats = await fetchSubCategories(hierarchy.mainCategory._id);
        }

        if (hierarchy.subCategory?._id) {
          specificCats = await fetchSpecificCategories(hierarchy.subCategory._id);
        }

        // Now update form data with hierarchy values after options are loaded
        // The category field should be set to specificCategory (grandchild) ID
        setFormData(prev => ({
          ...prev,
          mainCategory: hierarchy.mainCategory?._id || '',
          subCategory: hierarchy.subCategory?._id || '',
          specificCategory: hierarchy.specificCategory?._id || '',
          // Keep category in sync with specificCategory (the grandchild where products are stored)
          category: hierarchy.specificCategory?._id || prev.category
        }));
      }
    } catch (error) {
      console.error('Error fetching category hierarchy:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleMainCategoryChange = async (value: string) => {
    setFormData(prev => ({
      ...prev,
      mainCategory: value,
      subCategory: '',
      specificCategory: '',
      category: '' // Clear final category
    }));
    
    // Clear dependent dropdowns
    setSubCategories([]);
    setSpecificCategories([]);
    
    // Fetch subcategories for selected main category
    if (value) {
      await fetchSubCategories(value);
    }
  };

  const handleSubCategoryChange = async (value: string) => {
    setFormData(prev => ({
      ...prev,
      subCategory: value,
      specificCategory: '',
      category: '' // Clear final category
    }));
    
    // Clear dependent dropdown
    setSpecificCategories([]);
    
    // Fetch specific categories for selected subcategory
    if (value) {
      await fetchSpecificCategories(value);
    }
  };

  const handleSpecificCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      specificCategory: value,
      category: value // Set the final category to be saved
    }));
  };

  const handleVariationsChange = (definitions: any[], combinations: any[]) => {
    setFormData(prev => ({
      ...prev,
      hasVariations: definitions.length > 0,
      variationDefinitions: definitions,
      variationCombinations: combinations
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        // Remove UI-only fields before submission
        mainCategory: undefined,
        subCategory: undefined,
        specificCategory: undefined,
        // Remove empty category to prevent ObjectId cast error
        category: formData.category && formData.category.trim() ? formData.category : undefined
      };

      // For new products, we need to handle file uploads differently
      if (mode === 'create') {
        // Filter out preview images and prepare file data
        const imageFiles = formData.images
          .filter(img => img.isPreview && img.file)
          .map(img => img.file);
        
        // For new products, don't send any images in the JSON data - only via FormData
        submitData.images = [];
        
        // If there are files to upload, use FormData
        if (imageFiles.length > 0) {
          const formDataWithFiles = new FormData();
          
          // Add all form fields
          Object.entries(submitData).forEach(([key, value]) => {
            if (key !== 'images' && value !== undefined) {
              if (typeof value === 'object') {
                formDataWithFiles.append(key, JSON.stringify(value));
              } else {
                formDataWithFiles.append(key, value.toString());
              }
            }
          });
          
          // Add image files
          imageFiles.forEach(file => {
            formDataWithFiles.append('images', file);
          });
          
          await onSave(formDataWithFiles);
        } else {
          await onSave(submitData);
        }
      } else {
        // For updates, images are handled separately via the image upload endpoint
        // Remove images from submitData to prevent validation errors
        delete submitData.images;
        await onSave(submitData);
      }
    } catch (error) {
      // Error is already handled in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyFeatures">Key Features</Label>
                <RichTextEditor
                  value={formData.keyFeatures}
                  onChange={(value) => handleInputChange('keyFeatures', value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsInBox">What's in the Box</Label>
                <RichTextEditor
                  value={formData.whatsInBox}
                  onChange={(value) => handleInputChange('whatsInBox', value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">Specifications</Label>
                <RichTextEditor
                  value={formData.specifications}
                  onChange={(value) => handleInputChange('specifications', value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Product SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleInputChange('condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (KSH) *</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Current Price (KSH) *</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.currentPrice}
                    onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Brand Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.brand.name}
                    onChange={(e) => handleInputChange('brand.name', e.target.value)}
                    placeholder="Brand name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandWebsite">Brand Website</Label>
                  <Input
                    id="brandWebsite"
                    value={formData.brand.website}
                    onChange={(e) => handleInputChange('brand.website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mainCategory">Main Category</Label>
                  <Select
                    value={formData.mainCategory}
                    onValueChange={handleMainCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select main category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategory">Subcategory</Label>
                  <Select
                    key={`sub-${subCategories.length}-${formData.mainCategory}`}
                    value={formData.subCategory}
                    onValueChange={handleSubCategoryChange}
                    disabled={!formData.mainCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.mainCategory ? "Select subcategory" : "Select main category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specificCategory">Specific Category</Label>
                  <Select
                    key={`specific-${specificCategories.length}-${formData.subCategory}`}
                    value={formData.specificCategory}
                    onValueChange={handleSpecificCategoryChange}
                    disabled={!formData.subCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.subCategory ? "Select specific category" : "Select subcategory first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {specificCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Featured</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isNewArrival">New Arrival</Label>
                    <p className="text-xs text-muted-foreground">Show in New Arrivals section</p>
                  </div>
                  <Switch
                    id="isNewArrival"
                    checked={formData.isNewArrival}
                    onCheckedChange={(checked) => handleInputChange('isNewArrival', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isOnSale">On Sale</Label>
                    <p className="text-xs text-muted-foreground">Show in Sale section</p>
                  </div>
                  <Switch
                    id="isOnSale"
                    checked={formData.isOnSale}
                    onCheckedChange={(checked) => handleInputChange('isOnSale', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.stock.quantity}
                      onChange={(e) => handleInputChange('stock.quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Min Quantity</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      min="0"
                      value={formData.stock.minQuantity}
                      onChange={(e) => handleInputChange('stock.minQuantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trackQuantity">Track Quantity</Label>
                    <Switch
                      id="trackQuantity"
                      checked={formData.stock.trackQuantity}
                      onCheckedChange={(checked) => handleInputChange('stock.trackQuantity', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowBackorder">Allow Backorder</Label>
                    <Switch
                      id="allowBackorder"
                      checked={formData.stock.allowBackorder}
                      onCheckedChange={(checked) => handleInputChange('stock.allowBackorder', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Product Variations - Full Width Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Product Variations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductVariations
            productId={mode === 'edit' ? product?._id : undefined}
            variationDefinitions={formData.variationDefinitions}
            variationCombinations={formData.variationCombinations}
            basePrice={formData.currentPrice}
            baseComparePrice={formData.originalPrice}
            baseCostPrice={0}
            onVariationsChange={handleVariationsChange}
            mode={mode}
          />
        </CardContent>
      </Card>

      {/* Product Images - Full Width Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            productId={mode === 'edit' ? product?._id : undefined}
            images={formData.images}
            onImagesChange={(images) => handleInputChange('images', images)}
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
