import { useState, useEffect } from 'react';

interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  itemCount: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'new';
}

interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'product' | 'system' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
  userId?: string;
  userName?: string;
}

interface OverviewData {
  stats: OverviewStats;
  salesChart: SalesData[];
  topProducts: Product[];
  recentOrders: Order[];
  recentCustomers: Customer[];
  activities: ActivityItem[];
}

export const useOverviewData = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data - no authentication required
      const mockData: OverviewData = {
        stats: {
          totalRevenue: 125430,
          totalOrders: 1248,
          totalCustomers: 4567,
          totalProducts: 234,
          revenueChange: 12.5,
          ordersChange: 8.3,
          customersChange: 15.7,
          productsChange: 3.2,
        },
        salesChart: [
          { date: 'Jan', sales: 4000, orders: 120, revenue: 45000 },
          { date: 'Feb', sales: 3000, orders: 98, revenue: 35000 },
          { date: 'Mar', sales: 5000, orders: 150, revenue: 55000 },
          { date: 'Apr', sales: 4500, orders: 135, revenue: 48000 },
          { date: 'May', sales: 6000, orders: 180, revenue: 65000 },
          { date: 'Jun', sales: 5500, orders: 165, revenue: 58000 },
          { date: 'Jul', sales: 7000, orders: 210, revenue: 75000 },
        ],
        topProducts: [
          {
            id: '1',
            name: 'Premium Cotton T-Shirt',
            category: 'Clothing',
            sales: 245,
            revenue: 4900,
            trend: 'up',
            trendPercentage: 12.5,
          },
          {
            id: '2',
            name: 'Denim Jacket',
            category: 'Outerwear',
            sales: 189,
            revenue: 7560,
            trend: 'up',
            trendPercentage: 8.3,
          },
          {
            id: '3',
            name: 'Running Shoes',
            category: 'Footwear',
            sales: 156,
            revenue: 12480,
            trend: 'down',
            trendPercentage: -3.2,
          },
        ],
        recentOrders: [
          {
            id: 'ORD-001',
            customerName: 'Sarah Johnson',
            customerEmail: 'sarah.j@email.com',
            total: 129.99,
            status: 'processing',
            createdAt: '2024-01-15T10:30:00Z',
            itemCount: 2,
          },
          {
            id: 'ORD-002',
            customerName: 'Mike Chen',
            customerEmail: 'mike.chen@email.com',
            total: 89.99,
            status: 'pending',
            createdAt: '2024-01-15T09:45:00Z',
            itemCount: 1,
          },
          {
            id: 'ORD-003',
            customerName: 'Emma Wilson',
            customerEmail: 'emma.w@email.com',
            total: 249.99,
            status: 'shipped',
            createdAt: '2024-01-15T08:20:00Z',
            itemCount: 3,
          },
        ],
        recentCustomers: [
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.j@email.com',
            phone: '+1 (555) 123-4567',
            joinDate: '2024-01-15',
            totalOrders: 8,
            totalSpent: 1240.00,
            status: 'active',
          },
          {
            id: '2',
            name: 'Mike Chen',
            email: 'mike.chen@email.com',
            joinDate: '2024-01-14',
            totalOrders: 3,
            totalSpent: 450.00,
            status: 'new',
          },
          {
            id: '3',
            name: 'Emma Wilson',
            email: 'emma.w@email.com',
            phone: '+1 (555) 987-6543',
            joinDate: '2024-01-13',
            totalOrders: 12,
            totalSpent: 2100.00,
            status: 'active',
          },
        ],
        activities: [
          {
            id: '1',
            type: 'order',
            title: 'New Order Placed',
            description: 'Order #12345 placed by Sarah Johnson',
            timestamp: '2024-01-15T10:30:00Z',
            userId: 'user1',
            userName: 'Sarah Johnson',
          },
          {
            id: '2',
            type: 'customer',
            title: 'New Customer Registration',
            description: 'Mike Chen joined the platform',
            timestamp: '2024-01-15T09:45:00Z',
            userId: 'user2',
            userName: 'Mike Chen',
          },
          {
            id: '3',
            type: 'alert',
            title: 'Low Stock Alert',
            description: 'Running Shoes stock is running low (5 items left)',
            timestamp: '2024-01-15T08:30:00Z',
            severity: 'medium',
          },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setData(mockData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchOverviewData();
  };

  useEffect(() => {
    fetchOverviewData();
  }, []); // Remove isAuthenticated dependency

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
