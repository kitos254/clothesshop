import { useState, useEffect } from 'react';
import { 
  User, Package, Heart, LogOut, Edit3, MapPin, Mail, Phone, 
  Calendar, ChevronRight, ShoppingBag, Clock, CheckCircle2,
  Truck, XCircle, Loader2, Eye, Plus, Trash2, Star, Home, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import Footer from '@/components/Footer';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    name: string;
    image?: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  orderStatus: string;
  createdAt: string;
}

interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
}

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

const ProfilePage = () => {
  const { customer, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
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

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: '/profile' } } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Parse name into first and last
  const nameParts = customer?.name?.split(' ') || ['', ''];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [userInfo, setUserInfo] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: customer?.email || '',
  });

  // Update form when customer data changes
  useEffect(() => {
    if (customer) {
      const parts = customer.name?.split(' ') || ['', ''];
      setUserInfo({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: customer.email || '',
      });
    }
  }, [customer]);

  // Fetch order stats on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrderStats();
    }
  }, [isAuthenticated]);

  // Fetch orders when tab changes to orders
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  // Fetch addresses when tab changes to addresses
  useEffect(() => {
    if (activeTab === 'addresses' && isAuthenticated) {
      fetchAddresses();
    }
  }, [activeTab, isAuthenticated]);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const response = await api.get('/api/customer/auth/addresses');
      if (response.data.success) {
        setAddresses(response.data.data.addresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setAddressesLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
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
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleAddAddress = async () => {
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
      const response = await api.post('/api/customer/auth/addresses', addressForm);
      if (response.data.success) {
        setAddresses(response.data.data.addresses);
        toast({
          title: 'Address added',
          description: 'Your shipping address has been added successfully.',
        });
        resetAddressForm();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add address',
        variant: 'destructive',
      });
    } finally {
      setAddressFormLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;

    setAddressFormLoading(true);
    try {
      const response = await api.put(`/api/customer/auth/addresses/${editingAddress._id}`, addressForm);
      if (response.data.success) {
        setAddresses(response.data.data.addresses);
        toast({
          title: 'Address updated',
          description: 'Your shipping address has been updated successfully.',
        });
        resetAddressForm();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update address',
        variant: 'destructive',
      });
    } finally {
      setAddressFormLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await api.delete(`/api/customer/auth/addresses/${addressId}`);
      if (response.data.success) {
        setAddresses(response.data.data.addresses);
        toast({
          title: 'Address deleted',
          description: 'Your shipping address has been removed.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete address',
        variant: 'destructive',
      });
    }
  };

  const startEditAddress = (address: ShippingAddress) => {
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
    setShowAddressForm(true);
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.get('/api/orders/my-orders');
      if (response.data.success) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await api.get('/api/orders/stats');
      if (response.data.success) {
        setOrderStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const result = await updateProfile({
      name: `${userInfo.firstName.trim()} ${userInfo.lastName.trim()}`,
      email: userInfo.email,
    });
    
    if (result.success) {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
    } else {
      toast({
        title: 'Update failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle2 className="h-4 w-4" />,
      processing: <Package className="h-4 w-4" />,
      shipped: <Truck className="h-4 w-4" />,
      delivered: <CheckCircle2 className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />,
    };
    return icons[status] || <Clock className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-16">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary/90 to-primary text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-white/20 shadow-xl">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-white/10 text-white">
                  {userInfo.firstName[0]?.toUpperCase()}{userInfo.lastName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">
                  {userInfo.firstName} {userInfo.lastName}
                </h1>
                <p className="text-white/80 mt-1 flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {userInfo.email}
                </p>
                <p className="text-white/60 text-sm mt-2 flex items-center justify-center md:justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {customer?.createdAt ? formatDate(customer.createdAt) : 'Recently'}
                </p>
              </div>
              <div className="md:ml-auto">
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="container mx-auto px-4 -mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{orderStats?.totalOrders || 0}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{orderStats?.completedOrders || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">{orderStats?.pendingOrders || 0}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{customer?.wishlist?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Wishlist</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('profile')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => setActiveTab('orders')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Orders
            </Button>
            <Button
              variant={activeTab === 'addresses' ? 'default' : 'outline'}
              onClick={() => setActiveTab('addresses')}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              Addresses
            </Button>
            <Link to="/wishlist">
              <Button variant="outline" className="gap-2">
                <Heart className="h-4 w-4" />
                Wishlist
              </Button>
            </Link>
          </div>

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Personal Information</h3>
                        <p className="text-sm text-muted-foreground">Manage your details</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-muted-foreground text-sm">First Name</Label>
                        <Input
                          id="firstName"
                          value={userInfo.firstName}
                          onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-muted' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-muted-foreground text-sm">Last Name</Label>
                        <Input
                          id="lastName"
                          value={userInfo.lastName}
                          onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-muted' : ''}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground text-sm">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-muted' : ''}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1">
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChevronRight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Quick Actions</h3>
                      <p className="text-sm text-muted-foreground">Shortcuts to common actions</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link to="/wishlist" className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Heart className="h-5 w-5 text-pink-500" />
                          <span>My Wishlist</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setActiveTab('orders')}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-blue-500" />
                        <span>View Orders</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Link to="/shop" className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-5 w-5 text-green-500" />
                          <span>Continue Shopping</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Tab Content */}
          {activeTab === 'orders' && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Order History</h3>
                      <p className="text-sm text-muted-foreground">Track and manage your orders</p>
                    </div>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-lg mb-2">No orders yet</h4>
                    <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                    <Link to="/shop">
                      <Button>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold">{order.orderNumber}</span>
                              <Badge className={getStatusColor(order.orderStatus)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.orderStatus)}
                                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                </span>
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(order.createdAt)}
                              </span>
                              <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <Separator className="my-4" />
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {order.items.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex-shrink-0 w-16">
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{item.name}</p>
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">+{order.items.length - 4}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Addresses Tab Content */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              {/* Address Form */}
              {showAddressForm && (
                <Card className="shadow-sm border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {editingAddress ? 'Update your shipping address' : 'Add a new shipping address'}
                          </p>
                        </div>
                      </div>
                    </div>

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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-muted-foreground text-sm">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-muted-foreground text-sm">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+254 700 000 000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="street" className="text-muted-foreground text-sm">Street Address *</Label>
                        <Input
                          id="street"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                          placeholder="123 Main Street, Apartment 4B"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-muted-foreground text-sm">City *</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Nairobi"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-muted-foreground text-sm">State/Region</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="Nairobi County"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-muted-foreground text-sm">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            value={addressForm.zipCode}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                            placeholder="00100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-muted-foreground text-sm">Country</Label>
                          <Input
                            id="country"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="Kenya"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                          disabled={addressFormLoading}
                          className="flex-1"
                        >
                          {addressFormLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {editingAddress ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            editingAddress ? 'Update Address' : 'Add Address'
                          )}
                        </Button>
                        <Button variant="outline" onClick={resetAddressForm} disabled={addressFormLoading}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address List */}
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Shipping Addresses</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your delivery addresses (max 2)
                        </p>
                      </div>
                    </div>
                    {!showAddressForm && addresses.length < 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressForm(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Address
                      </Button>
                    )}
                  </div>

                  {addressesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="font-medium text-lg mb-2">No addresses saved</h4>
                      <p className="text-muted-foreground mb-4">Add a shipping address for faster checkout</p>
                      {!showAddressForm && (
                        <Button onClick={() => setShowAddressForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Address
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          className={`relative border rounded-lg p-4 transition-all ${
                            address.isDefault 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                        >
                          {/* Default Badge */}
                          {address.isDefault && (
                            <Badge className="absolute -top-2 -right-2 bg-primary gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}

                          {/* Address Label */}
                          <div className="flex items-center gap-2 mb-3">
                            {address.label === 'Home' && <Home className="h-4 w-4 text-primary" />}
                            {address.label === 'Work' && <Building2 className="h-4 w-4 text-primary" />}
                            {address.label === 'Other' && <MapPin className="h-4 w-4 text-primary" />}
                            <span className="font-medium">{address.label}</span>
                          </div>

                          {/* Address Details */}
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{address.fullName}</p>
                            <p className="text-muted-foreground">{address.street}</p>
                            <p className="text-muted-foreground">
                              {address.city}{address.state ? `, ${address.state}` : ''} {address.zipCode}
                            </p>
                            <p className="text-muted-foreground">{address.country}</p>
                            <div className="flex items-center gap-1 pt-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{address.phone}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditAddress(address)}
                              className="flex-1 gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAddress(address._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addresses.length >= 2 && !showAddressForm && (
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      You've reached the maximum of 2 addresses. Delete one to add a new address.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;