import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

export interface WishlistItem {
  productId: string;
  name: string;
  brand?: string;
  price: number;
  image: string;
  originalPrice?: number;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, registerSyncCallback, unregisterSyncCallback } = useAuth();

  // Sync wishlist to database
  const syncWishlistToDb = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const localWishlist = localStorage.getItem('newRan_wishlist');
    const wishlistToSync = localWishlist ? JSON.parse(localWishlist) : [];
    
    try {
      const response = await api.post('/api/customer/auth/sync/wishlist', { wishlistItems: wishlistToSync });
      if (response.data.success) {
        setWishlistItems(response.data.data.wishlist);
        localStorage.setItem('newRan_wishlist', JSON.stringify(response.data.data.wishlist));
      }
    } catch (error) {
      console.error('Failed to sync wishlist:', error);
    }
  }, [isAuthenticated]);

  // Update wishlist in database when items change
  const updateWishlistInDb = useCallback(async (items: WishlistItem[]) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/api/customer/auth/wishlist', { wishlistItems: items });
    } catch (error) {
      console.error('Failed to update wishlist in database:', error);
    }
  }, [isAuthenticated]);

  // Register sync callback on mount
  useEffect(() => {
    registerSyncCallback('wishlist', syncWishlistToDb);
    return () => unregisterSyncCallback('wishlist');
  }, [registerSyncCallback, unregisterSyncCallback, syncWishlistToDb]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('newRan_wishlist');
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to load wishlist from localStorage', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Fetch wishlist from database when user becomes authenticated
  useEffect(() => {
    const fetchWishlistFromDb = async () => {
      if (!isAuthenticated || !isInitialized) return;
      
      try {
        const response = await api.get('/api/customer/auth/wishlist');
        if (response.data.success && response.data.data.wishlist.length > 0) {
          // Merge with local wishlist
          const dbWishlist = response.data.data.wishlist;
          const localWishlist = wishlistItems;
          
          const mergedWishlistMap = new Map<string, WishlistItem>();
          
          // Add DB items first
          dbWishlist.forEach((item: WishlistItem) => {
            mergedWishlistMap.set(item.productId, item);
          });
          
          // Then merge local items (if not already in DB)
          localWishlist.forEach((item: WishlistItem) => {
            if (!mergedWishlistMap.has(item.productId)) {
              mergedWishlistMap.set(item.productId, item);
            }
          });
          
          const mergedWishlist = Array.from(mergedWishlistMap.values());
          setWishlistItems(mergedWishlist);
          localStorage.setItem('newRan_wishlist', JSON.stringify(mergedWishlist));
        }
      } catch (error) {
        console.error('Failed to fetch wishlist from database:', error);
      }
    };
    
    fetchWishlistFromDb();
  }, [isAuthenticated, isInitialized]);

  // Save wishlist to localStorage and database whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('newRan_wishlist', JSON.stringify(wishlistItems));
    updateWishlistInDb(wishlistItems);
  }, [wishlistItems, isInitialized, updateWishlistInDb]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlistItems(prev => {
      const exists = prev.find(wishlistItem => wishlistItem.productId === item.productId);
      if (exists) return prev;
      return [...prev, item];
    });

    toast({
      title: 'Added to Wishlist',
      description: `${item.name} has been added to your wishlist.`,
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.productId !== productId));
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
