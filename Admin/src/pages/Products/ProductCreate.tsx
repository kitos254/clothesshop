import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

// This component handles the creation flow by creating a draft and redirecting to edit
const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    createDraftProduct();
  }, []);

  const createDraftProduct = async () => {
    try {
      // Call backend API to create draft product
      const response = await axios.post('/products/draft');
      
      if (response.data.success) {
        const productId = response.data.data._id;
        
        // Redirect to edit page with the real product ID
        navigate(`/products/edit/${productId}`, { replace: true });
      } else {
        throw new Error(response.data.message || 'Failed to create draft product');
      }
      
    } catch (error: any) {
      console.error('Error creating draft product:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create new product. Please try again.",
        variant: "destructive",
      });
      
      // Redirect back to products on error
      navigate('/products', { replace: true });
    }
  };

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <h2 className="text-lg font-semibold">Creating Product...</h2>
        <p className="text-muted-foreground">
          Please wait while we prepare your new product draft.
        </p>
      </div>
    </div>
  );
};

export default ProductCreate;
