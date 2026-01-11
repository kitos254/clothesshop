import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import Footer from '@/components/Footer';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: typeof wishlistItems[0]) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      price: item.price,
      image: item.image,
    });
  };

  return (
    <div className="min-h-screen">
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light tracking-wide">My Wishlist</h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </p>
              {wishlistItems.length > 0 && (
                <Button variant="ghost" onClick={clearWishlist} className="text-muted-foreground">
                  Clear All
                </Button>
              )}
            </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {wishlistItems.map((item) => (
                <div key={item.productId} className="bg-card rounded-lg shadow-sm overflow-hidden group">
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Link to={`/product/${item.productId}`}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background text-red-500"
                      onClick={() => removeFromWishlist(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div>
                      {item.brand && (
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          {item.brand}
                        </p>
                      )}
                      <Link to={`/product/${item.productId}`}>
                        <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">KSh {item.price.toLocaleString()}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          KSh {item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
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
