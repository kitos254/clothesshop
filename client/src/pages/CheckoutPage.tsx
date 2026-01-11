import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  Package,
  Check,
  Plus,
  Edit3,
  ShoppingBag,
  Loader2,
  ChevronRight,
  Home,
  Building2,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import Footer from '@/components/Footer';

interface ShippingAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { isAuthenticated, isLoading: authLoading, customer } = useAuth();
  const { toast } = useToast();

  // State
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_delivery');
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Cart side panel
  const [cartPanelOpen, setCartPanelOpen] = useState(false);

  // Address edit side panel
  const [addressPanelOpen, setAddressPanelOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [addressFormLoading, setAddressFormLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Kenya',
    isDefault: false,
  });

  // Calculate totals
  const subtotal = cartTotal;
  const shippingCost = subtotal > 5000 ? 0 : 350;
  const total = subtotal + shippingCost;

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: '/checkout' } } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (cartItems.length === 0 && !authLoading) {
      navigate('/cart');
    }
  }, [cartItems, authLoading, navigate]);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get('/api/customer/auth/addresses');
        if (response.data.success) {
          const fetchedAddresses = response.data.data.addresses;
          setAddresses(fetchedAddresses);

          // Select default address
          const defaultAddr = fetchedAddresses.find((a: ShippingAddress) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id);
          } else if (fetchedAddresses.length > 0) {
            setSelectedAddressId(fetchedAddresses[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated]);

  // Address form handlers
  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      fullName: customer?.name || '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kenya',
      isDefault: false,
    });
    setEditingAddress(null);
    setAddressPanelOpen(false);
  };

  const openAddressPanel = (address?: ShippingAddress) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state || '',
        zipCode: address.zipCode,
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: 'Home',
        fullName: customer?.name || '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Kenya',
        isDefault: addresses.length === 0,
      });
    }
    setAddressPanelOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.city || !addressForm.zipCode) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setAddressFormLoading(true);
    try {
      let response;
      if (editingAddress) {
        response = await api.put(`/api/customer/auth/addresses/${editingAddress._id}`, addressForm);
      } else {
        response = await api.post('/api/customer/auth/addresses', addressForm);
      }

      if (response.data.success) {
        setAddresses(response.data.data.addresses);
        
        // Select the new/edited address
        if (!editingAddress && response.data.data.addresses.length > 0) {
          const newAddress = response.data.data.addresses[response.data.data.addresses.length - 1];
          setSelectedAddressId(newAddress._id);
        }
        
        toast({
          title: editingAddress ? 'Address updated' : 'Address added',
          description: 'Your shipping address has been saved.',
        });
        resetAddressForm();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save address',
        variant: 'destructive',
      });
    } finally {
      setAddressFormLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({
        title: 'Address required',
        description: 'Please select or add a shipping address',
        variant: 'destructive',
      });
      return;
    }

    const selectedAddress = addresses.find(a => a._id === selectedAddressId);
    if (!selectedAddress) {
      toast({
        title: 'Invalid address',
        description: 'Please select a valid shipping address',
        variant: 'destructive',
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderItems = cartItems.map(item => ({
        product: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        selectedVariations: item.selectedOptions || {}
      }));

      const response = await api.post('/api/orders', {
        items: orderItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
        },
        paymentMethod,
        notes: orderNotes,
      });

      if (response.data.success) {
        clearCart();
        toast({
          title: 'Order placed successfully!',
          description: `Order ${response.data.data.order.orderNumber} has been placed.`,
        });
        navigate('/profile', { state: { tab: 'orders' } });
      }
    } catch (error: any) {
      toast({
        title: 'Order failed',
        description: error.response?.data?.error || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/cart">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-light tracking-wide">Checkout</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setCartPanelOpen(true)}
              className="gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">View Cart</span>
              <Badge variant="secondary">{cartItems.length}</Badge>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">Shipping Address</h2>
                        <p className="text-sm text-muted-foreground">Where should we deliver?</p>
                      </div>
                    </div>
                    {addresses.length < 2 && (
                      <Button variant="outline" size="sm" onClick={() => openAddressPanel()} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New
                      </Button>
                    )}
                  </div>

                  {addressesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No saved addresses</p>
                      <Button onClick={() => openAddressPanel()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shipping Address
                      </Button>
                    </div>
                  ) : (
                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      <div className="grid gap-4">
                        {addresses.map((address) => (
                          <div
                            key={address._id}
                            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedAddressId === address._id
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedAddressId(address._id)}
                          >
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={address._id} id={address._id} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {address.label === 'Home' && <Home className="h-4 w-4 text-primary" />}
                                  {address.label === 'Work' && <Building2 className="h-4 w-4 text-primary" />}
                                  {address.label === 'Other' && <MapPin className="h-4 w-4 text-primary" />}
                                  <span className="font-medium">{address.label}</span>
                                  {address.isDefault && (
                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                  )}
                                </div>
                                <p className="font-medium">{address.fullName}</p>
                                <p className="text-sm text-muted-foreground">{address.street}</p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}{address.state ? `, ${address.state}` : ''} {address.zipCode}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {address.phone}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddressPanel(address);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Payment Method</h2>
                      <p className="text-sm text-muted-foreground">How would you like to pay?</p>
                    </div>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === 'cash_on_delivery'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setPaymentMethod('cash_on_delivery')}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="cash_on_delivery" id="cod" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-green-600" />
                              <span className="font-medium">Payment on Delivery</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pay with cash or M-Pesa when your order arrives
                            </p>
                          </div>
                          <Check className={`h-5 w-5 ${paymentMethod === 'cash_on_delivery' ? 'text-primary' : 'text-transparent'}`} />
                        </div>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-all opacity-50 ${
                          paymentMethod === 'mpesa'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="mpesa" id="mpesa" disabled />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-5 w-5 text-green-600" />
                              <span className="font-medium">M-Pesa</span>
                              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Pay instantly using M-Pesa
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Order Notes</h2>
                      <p className="text-sm text-muted-foreground">Any special instructions?</p>
                    </div>
                  </div>
                  <textarea
                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Add any special delivery instructions or notes for your order..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg mb-6">Order Summary</h2>

                  {/* Items Preview */}
                  <div className="space-y-3 mb-6">
                    {cartItems.slice(0, 3).map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="flex gap-3">
                        <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium">KSh {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {cartItems.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => setCartPanelOpen(true)}
                      >
                        +{cartItems.length - 3} more items
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span>KSh {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                        {shippingCost === 0 ? 'Free' : `KSh ${shippingCost.toLocaleString()}`}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>KSh {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Selected Address Preview */}
                  {selectedAddress && (
                    <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Delivering to:</p>
                      <p className="text-sm font-medium">{selectedAddress.fullName}</p>
                      <p className="text-xs text-muted-foreground">{selectedAddress.street}, {selectedAddress.city}</p>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <Button
                    className="w-full h-12 mt-6 text-lg"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || !selectedAddressId || cartItems.length === 0}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {!selectedAddressId && addresses.length === 0 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Please add a shipping address</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing this order, you agree to our Terms & Conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Cart Side Panel */}
      <Sheet open={cartPanelOpen} onOpenChange={setCartPanelOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Cart ({cartItems.length})
            </SheetTitle>
            <SheetDescription>
              Review your items before checkout
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-16 h-20 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-xs text-muted-foreground uppercase">{item.brand}</p>
                    )}
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between font-semibold text-lg mb-4">
              <span>Subtotal</span>
              <span>KSh {subtotal.toLocaleString()}</span>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setCartPanelOpen(false)}>
              Continue Checkout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Address Edit Side Panel */}
      <Sheet open={addressPanelOpen} onOpenChange={(open) => !open && resetAddressForm()}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </SheetTitle>
            <SheetDescription>
              {editingAddress ? 'Update your shipping address' : 'Add a new shipping address'}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
            <div className="space-y-4">
              {/* Label Selection */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Address Label</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={addressForm.label === 'Home' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddressForm(prev => ({ ...prev, label: 'Home' }))}
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                  <Button
                    type="button"
                    variant={addressForm.label === 'Work' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddressForm(prev => ({ ...prev, label: 'Work' }))}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Work
                  </Button>
                  <Button
                    type="button"
                    variant={addressForm.label === 'Other' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddressForm(prev => ({ ...prev, label: 'Other' }))}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Other
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="123 Main Street, Apartment 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Nairobi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Region</Label>
                  <Input
                    id="state"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Nairobi County"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="00100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Kenya"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="text-sm cursor-pointer">
                  Set as default address
                </Label>
              </div>
            </div>
          </ScrollArea>
          <div className="mt-6 pt-4 border-t flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetAddressForm}
              disabled={addressFormLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveAddress}
              disabled={addressFormLoading}
            >
              {addressFormLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Address'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
