import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye
} from 'lucide-react';

const Index: React.FC = () => {
  // Mock user data (no authentication)
  const user = {
    firstName: "Admin",
    lastName: "User",
    email: "admin@newran.com"
  };

  // Mock stats data - in a real app, this would come from an API
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: "2,350",
      change: "+180.1% from last month",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Total Products",
      value: "1,254",
      change: "+19% from last month",
      trend: "up",
      icon: Package,
    },
    {
      title: "Active Customers",
      value: "573",
      change: "+201 since last hour",
      trend: "up",
      icon: Users,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'Admin'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendIcon className={`mr-1 h-3 w-3 ${
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`} />
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                You have 3 new orders to process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Order #12345</span>
                  <span className="font-medium">$129.99</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Order #12346</span>
                  <span className="font-medium">$89.99</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Order #12347</span>
                  <span className="font-medium">$199.99</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>
                5 products are running low on stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Nike Air Max</span>
                  <span className="text-orange-500 font-medium">3 left</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>iPhone Case</span>
                  <span className="text-red-500 font-medium">1 left</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Wireless Earbuds</span>
                  <span className="text-orange-500 font-medium">5 left</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Best selling items this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Premium T-Shirt</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>342</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Designer Jeans</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>289</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Sports Shoes</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>234</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Overview
              </CardTitle>
              <CardDescription>
                Revenue trends for the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Chart placeholder - Integration with chart library needed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Analytics
              </CardTitle>
              <CardDescription>
                New vs returning customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Chart placeholder - Integration with chart library needed
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
