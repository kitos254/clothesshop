import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, MoreHorizontal, UserPlus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'new';
  avatar?: string;
}

interface RecentCustomersProps {
  data?: Customer[];
  isLoading?: boolean;
}

const RecentCustomers: React.FC<RecentCustomersProps> = ({ data, isLoading }) => {
  // Mock data if no data provided
  const mockCustomers: Customer[] = [
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
    {
      id: '4',
      name: 'David Rodriguez',
      email: 'david.r@email.com',
      joinDate: '2024-01-12',
      totalOrders: 1,
      totalSpent: 89.99,
      status: 'new',
    },
    {
      id: '5',
      name: 'Lisa Park',
      email: 'lisa.park@email.com',
      joinDate: '2024-01-10',
      totalOrders: 0,
      totalSpent: 0,
      status: 'inactive',
    },
  ];

  const customers = data || mockCustomers;

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Customers</CardTitle>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent customers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.slice(0, 5).map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {customer.avatar ? (
                      <img 
                        src={customer.avatar} 
                        alt={customer.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {getInitials(customer.name)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {customer.name}
                      </p>
                      {customer.status === 'new' && (
                        <UserPlus className="h-3 w-3 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(customer.status)}`}
                  >
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </Badge>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{customer.totalOrders} orders</div>
                    <div>${customer.totalSpent.toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(customer.joinDate)}
                  </div>
                </div>
              </div>
            ))}
            
            {customers.length > 5 && (
              <div className="text-center pt-2">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                  View all customers
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentCustomers;
