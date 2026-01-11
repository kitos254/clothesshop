import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StatItem {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
  color: string;
}

interface StatsCardsProps {
  data?: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
    productsChange: number;
  };
  isLoading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <LoadingSpinner size="sm" />
          </Card>
        ))}
      </div>
    );
  }

  const stats: StatItem[] = [
    {
      title: 'Total Revenue',
      value: `$${data?.totalRevenue?.toLocaleString() || '0'}`,
      change: data?.revenueChange || 0,
      changeType: (data?.revenueChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: data?.totalOrders?.toLocaleString() || '0',
      change: data?.ordersChange || 0,
      changeType: (data?.ordersChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Total Customers',
      value: data?.totalCustomers?.toLocaleString() || '0',
      change: data?.customersChange || 0,
      changeType: (data?.customersChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Total Products',
      value: data?.totalProducts?.toLocaleString() || '0',
      change: data?.productsChange || 0,
      changeType: (data?.productsChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Package,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.changeType === 'increase' ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendIcon
                  className={`h-3 w-3 mr-1 ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <span
                  className={
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {Math.abs(stat.change)}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
