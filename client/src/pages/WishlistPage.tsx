import { useState } from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

import Footer from '@/components/Footer';
import collectionImage from '@/assets/collection-showcase.jpg';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      name: 'Minimalist Blazer',
      brand: 'UrbanThreadz',
      price: 189,
      originalPrice: 229,
      image: collectionImage,
      inStock: true,
    },
    {
      id: 2,
      name: 'Cropped Jacket',
      brand: 'UrbanThreadz',
      price: 159,
      originalPrice: null,
      image: collectionImage,
      inStock: false,
    },
    {
      id: 3,
      name: 'Wide Leg Pants',
      brand: 'UrbanThreadz',
      price: 129,
      originalPrice: null,
      image: collectionImage,
      inStock: true,
    },
  ]);

  const removeFromWishlist = (id: number) => {
    setWishlistItems(items => items.filter(item => item.id !== id));
  };

  const addToCart = (id: number) => {
    // TODO: Implement add to cart functionality with Supabase
    console.log('Added to cart:', id);
  };

  return (
    <div className="min-h-screen">
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light tracking-wide">My Wishlist</h1>
            <p className="text-muted-foreground">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-light mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Save items you love for later
              </p>
              <Link to="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-card rounded-lg shadow-sm overflow-hidden group">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Link to={`/product/${item.id}`}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background text-red-500"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {item.brand}
                      </p>
                      <Link to={`/product/${item.id}`}>
                        <h3 className="font-medium hover:text-accent transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">${item.price}</span>
                      {item.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${item.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => addToCart(item.id)}
                      disabled={!item.inStock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {wishlistItems.length > 0 && (
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Want to save these items for later?
              </p>
              <Button variant="outline">Share Wishlist</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;