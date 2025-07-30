import { useState } from 'react';
import { User, Package, Heart, Settings, LogOut, Edit3, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import Footer from '@/components/Footer';

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  const orderHistory = [
    {
      id: '#UT-001',
      date: '2024-01-15',
      status: 'Delivered',
      total: 234,
      items: 3,
    },
    {
      id: '#UT-002',
      date: '2024-01-10',
      status: 'Shipped',
      total: 156,
      items: 2,
    },
    {
      id: '#UT-003',
      date: '2024-01-05',
      status: 'Processing',
      total: 89,
      items: 1,
    },
  ];

  const handleSaveProfile = () => {
    // TODO: Implement profile update with Supabase
    setIsEditing(false);
    console.log('Profile updated:', userInfo);
  };

  return (
    <div className="min-h-screen">
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="relative mx-auto">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={userInfo.avatar} />
                      <AvatarFallback className="text-lg">
                        {userInfo.firstName[0]}{userInfo.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">
                      {userInfo.firstName} {userInfo.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {userInfo.email}
                    </p>
                  </div>
                </CardHeader>
              </Card>

              <div className="mt-6 space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Wishlist
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Personal Information</CardTitle>
                          <CardDescription>
                            Manage your account details and preferences
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={userInfo.firstName}
                            onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={userInfo.lastName}
                            onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userInfo.email}
                          onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={userInfo.phone}
                          onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>

                      {isEditing && (
                        <div className="flex space-x-4">
                          <Button onClick={handleSaveProfile}>
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>
                        View and track your recent orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orderHistory.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.date} • {order.items} items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.total}</p>
                              <p className={`text-sm ${
                                order.status === 'Delivered' ? 'text-green-600' :
                                order.status === 'Shipped' ? 'text-blue-600' :
                                'text-yellow-600'
                              }`}>
                                {order.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account preferences and security
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Settings functionality requires Supabase integration for user management.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;