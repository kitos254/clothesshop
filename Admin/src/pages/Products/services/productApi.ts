import api from '@/lib/axios';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  model?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
    path: string;
  };
  brand: {
    name: string;
    logo?: string;
  };
  price: number;
  comparePrice?: number;
  costPrice?: number;
  images: Array<{
    _id: string;
    url: string;
    publicId: string;
    isPrimary: boolean;
    alt?: string;
  }>;
  variants?: Array<{
    _id: string;
    name: string;
    values: string[];
    price?: number;
    sku?: string;
    stock?: {
      quantity: number;
      reserved: number;
    };
  }>;
  hasVariations?: boolean;
  variationDefinitions?: Array<{
    _id: string;
    name: string;
    values: string[];
    affectsPrice: boolean;
    affectsStock: boolean;
  }>;
  variationCombinations?: Array<{
    _id: string;
    combination: Array<{ name: string; value: string }>;
    sku: string;
    price: number;
    stock: {
      quantity: number;
      reserved?: number;
    };
    isActive: boolean;
  }>;
  stock: {
    quantity: number;
    reserved: number;
    minQuantity: number;
    trackQuantity: boolean;
  };
  dimensions?: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  status: 'active' | 'inactive' | 'discontinued';
  condition: 'new' | 'used' | 'refurbished';
  isFeatured: boolean;
  isActive: boolean;
  isDraft?: boolean;
  visibility: 'public' | 'private' | 'hidden';
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  settings: {
    allowBackorders: boolean;
    requiresShipping: boolean;
    isDigital: boolean;
    maxQuantityPerOrder?: number;
    minQuantityPerOrder?: number;
  };
  analytics: {
    views: number;
    sales: number;
    revenue: number;
    lastViewed?: Date;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductForm {
  name: string;
  description: string;
  sku: string;
  model?: string;
  category: string;
  brand: {
    name: string;
    logo?: string;
  };
  price: number;
  comparePrice?: number;
  costPrice?: number;
  images?: File[];
  variants?: Array<{
    name: string;
    values: string[];
    price?: number;
    sku?: string;
    stock?: {
      quantity: number;
      reserved: number;
    };
  }>;
  stock: {
    quantity: number;
    reserved: number;
    minQuantity: number;
    trackQuantity: boolean;
  };
  dimensions?: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  status: 'active' | 'inactive' | 'discontinued';
  condition: 'new' | 'used' | 'refurbished';
  isFeatured: boolean;
  isActive: boolean;
  isDraft?: boolean;
  visibility: 'public' | 'private' | 'hidden';
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  settings: {
    allowBackorders: boolean;
    requiresShipping: boolean;
    isDigital: boolean;
    maxQuantityPerOrder?: number;
    minQuantityPerOrder?: number;
  };
}

export interface ProductStats {
  totals: {
    total: number;
    active: number;
    featured: number;
    outOfStock: number;
    lowStock: number;
  };
  topBrands: Array<{
    _id: string;
    count: number;
  }>;
  topCategories: Array<{
    _id: string;
    name: string;
    count: number;
  }>;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ProductApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ProductApiService {
  private static baseUrl = '/products';

  // Get all products with filtering, sorting, and pagination
  static async getAllProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    isFeatured?: boolean;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    condition?: string;
    tags?: string;
  }): Promise<ProductApiResponse<ProductListResponse>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`${this.baseUrl}?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch products'
      };
    }
  }

  // Get recent products
  static async getRecentProducts(params?: {
    limit?: number;
  }): Promise<ProductApiResponse<{ products: Product[] }>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('sortBy', 'createdAt');
      queryParams.append('sortOrder', 'desc');
      queryParams.append('limit', (params?.limit || 5).toString());

      const response = await api.get(`${this.baseUrl}?${queryParams.toString()}`);
      return {
        success: true,
        data: { products: response.data.data.products }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch recent products'
      };
    }
  }

  // Get single product
  static async getProduct(id: string): Promise<ProductApiResponse<Product>> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch product'
      };
    }
  }

  // Create new product
  static async createProduct(data: Partial<ProductForm>): Promise<ProductApiResponse<Product>> {
    try {
      const formData = new FormData();
      
      // Handle images
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
        delete data.images;
      }

      // Add other fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.post(this.baseUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create product'
      };
    }
  }

  // Create draft product
  static async createDraftProduct(): Promise<ProductApiResponse<Product>> {
    try {
      const response = await api.post(`${this.baseUrl}/draft`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create draft product'
      };
    }
  }

  // Update product
  static async updateProduct(id: string, data: Partial<ProductForm>): Promise<ProductApiResponse<Product>> {
    try {
      const formData = new FormData();
      
      // Handle images
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
        delete data.images;
      }

      // Add other fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.put(`${this.baseUrl}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update product'
      };
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<ProductApiResponse<{}>> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: {}
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete product'
      };
    }
  }

  // Toggle product status
  static async toggleProductStatus(id: string, action: 'suspend' | 'activate' | 'discontinue'): Promise<ProductApiResponse<Product>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/status`, { action });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to toggle product status'
      };
    }
  }

  // Get product statistics
  static async getStats(): Promise<ProductApiResponse<ProductStats>> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get product statistics'
      };
    }
  }

  // Remove product images
  static async removeProductImages(id: string, imageIds: string[]): Promise<ProductApiResponse<Product>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}/images`, {
        data: { imageIds }
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to remove images'
      };
    }
  }

  // Bulk update products
  static async bulkUpdateProducts(productIds: string[], updates: Partial<ProductForm>): Promise<ProductApiResponse<{ matchedCount: number; modifiedCount: number }>> {
    try {
      const response = await api.patch(`${this.baseUrl}/bulk/update`, {
        productIds,
        updates
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to bulk update products'
      };
    }
  }
}

export default ProductApiService;
