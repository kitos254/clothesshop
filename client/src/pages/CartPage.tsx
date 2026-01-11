import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');

  const subtotal = cartTotal;
  const shipping = subtotal > 5000 ? 0 : 350; // Free shipping over 5000 KSh
  const tax = 0; // No tax for now
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen">
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light tracking-wide">Shopping Cart</h1>
            {cartItems.length > 0 && (
              <Button variant="ghost" onClick={clearCart} className="text-muted-foreground">
                Clear Cart
              </Button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-light mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some items to get started
              </p>
              <Link to="/">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item, index) => (
                  <div 
                    key={`${item.productId}-${item.combinationId || index}`} 
                    className="flex gap-4 p-6 bg-card rounded-lg shadow-sm"
                  >
                    <div className="w-24 h-32 overflow-hidden rounded-md bg-gray-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          {item.brand && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              {item.brand}
                            </p>
                          )}
                          <h3 className="font-medium">{item.name}</h3>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {Object.entries(item.selectedOptions)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' • ')}
                            </p>
                          )}
                          {item.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.productId, item.combinationId)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.combinationId)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.combinationId)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                              KSh {item.price.toLocaleString()} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card p-6 rounded-lg shadow-sm sticky top-24">
                  <h2 className="text-xl font-medium mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span>KSh {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'Free' : `KSh ${shipping.toLocaleString()}`}</span>
                    </div>
                    {tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>KSh {tax.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>KSh {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-3 mb-6">
                    <label className="text-sm font-medium">Promo Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button variant="outline">Apply</Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-lg mb-4"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate('/checkout');
                      } else {
                        navigate('/auth', { state: { from: { pathname: '/checkout' } } });
                      }
                    }}
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Secure checkout powered by M-Pesa & Card
                  </p>

                  {shipping > 0 && subtotal < 5000 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-center">
                        Add KSh {(5000 - subtotal).toLocaleString()} more for free shipping!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
