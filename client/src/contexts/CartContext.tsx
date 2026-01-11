import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

export interface CartItem {
  productId: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions?: Record<string, string>; // e.g., { "Color": "Red", "Size": "M" }
  combinationId?: string;
  sku?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: string, combinationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, combinationId?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isInCart: (productId: string, combinationId?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helper to generate a unique key for cart items
const getCartItemKey = (productId: string, selectedOptions?: Record<string, string>, combinationId?: string): string => {
  if (combinationId) return `${productId}_${combinationId}`;
  if (selectedOptions && Object.keys(selectedOptions).length > 0) {
    const optionsKey = Object.entries(selectedOptions).sort().map(([k, v]) => `${k}:${v}`).join('|');
    return `${productId}_${optionsKey}`;
  }
  return productId;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, registerSyncCallback, unregisterSyncCallback } = useAuth();

  // Sync cart to database
  const syncCartToDb = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const localCart = localStorage.getItem('newRan_cart');
    const cartToSync = localCart ? JSON.parse(localCart) : [];
    
    try {
      const response = await api.post('/api/customer/auth/sync/cart', { cartItems: cartToSync });
      if (response.data.success) {
        setCartItems(response.data.data.cart);
        localStorage.setItem('newRan_cart', JSON.stringify(response.data.data.cart));
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, [isAuthenticated]);

  // Update cart in database when items change
  const updateCartInDb = useCallback(async (items: CartItem[]) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/api/customer/auth/cart', { cartItems: items });
    } catch (error) {
      console.error('Failed to update cart in database:', error);
    }
  }, [isAuthenticated]);

  // Register sync callback on mount
  useEffect(() => {
    registerSyncCallback('cart', syncCartToDb);
    return () => unregisterSyncCallback('cart');
  }, [registerSyncCallback, unregisterSyncCallback, syncCartToDb]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('newRan_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart from localStorage', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Fetch cart from database when user becomes authenticated
  useEffect(() => {
    const fetchCartFromDb = async () => {
      if (!isAuthenticated || !isInitialized) return;
      
      try {
        const response = await api.get('/api/customer/auth/cart');
        if (response.data.success && response.data.data.cart.length > 0) {
          // Merge with local cart
          const dbCart = response.data.data.cart;
          const localCart = cartItems;
          
          const mergedCartMap = new Map<string, CartItem>();
          
          // Add DB items first
          dbCart.forEach((item: CartItem) => {
            const key = getCartItemKey(item.productId, item.selectedOptions, item.combinationId);
            mergedCartMap.set(key, item);
          });
          
          // Then merge local items
          localCart.forEach((item: CartItem) => {
            const key = getCartItemKey(item.productId, item.selectedOptions, item.combinationId);
            if (mergedCartMap.has(key)) {
              const existing = mergedCartMap.get(key)!;
              mergedCartMap.set(key, {
                ...item,
                quantity: Math.max(existing.quantity, item.quantity)
              });
            } else {
              mergedCartMap.set(key, item);
            }
          });
          
          const mergedCart = Array.from(mergedCartMap.values());
          setCartItems(mergedCart);
          localStorage.setItem('newRan_cart', JSON.stringify(mergedCart));
        }
      } catch (error) {
        console.error('Failed to fetch cart from database:', error);
      }
    };
    
    fetchCartFromDb();
  }, [isAuthenticated, isInitialized]);

  // Save cart to localStorage and database whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('newRan_cart', JSON.stringify(cartItems));
    updateCartInDb(cartItems);
  }, [cartItems, isInitialized, updateCartInDb]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantityToAdd = item.quantity || 1;
    
    setCartItems(prev => {
      const itemKey = getCartItemKey(item.productId, item.selectedOptions, item.combinationId);
      
      const existingIndex = prev.findIndex(cartItem => 
        getCartItemKey(cartItem.productId, cartItem.selectedOptions, cartItem.combinationId) === itemKey
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd
        };
        return updated;
      }

      // Add new item
      return [...prev, { ...item, quantity: quantityToAdd }];
    });

    toast({
      title: 'Added to Cart',
      description: `${item.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (productId: string, combinationId?: string) => {
    setCartItems(prev => prev.filter(item => {
      if (combinationId) {
        return !(item.productId === productId && item.combinationId === combinationId);
      }
      return item.productId !== productId;
    }));
  };

  const updateQuantity = (productId: string, quantity: number, combinationId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, combinationId);
      return;
    }

    setCartItems(prev =>
      prev.map(item => {
        if (combinationId) {
          if (item.productId === productId && item.combinationId === combinationId) {
            return { ...item, quantity };
          }
        } else if (item.productId === productId && !item.combinationId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (productId: string, combinationId?: string): boolean => {
    return cartItems.some(item => {
      if (combinationId) {
        return item.productId === productId && item.combinationId === combinationId;
      }
      return item.productId === productId;
    });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
