import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  MoreHorizontal, 
  ShoppingCart, 
  User, 
  Package, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

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

interface ActivityFeedProps {
  data?: ActivityItem[];
  isLoading?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ data, isLoading }) => {
  // Mock data if no data provided
  const mockActivities: ActivityItem[] = [
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
      type: 'product',
      title: 'Product Updated',
      description: 'Premium Cotton T-Shirt inventory updated',
      timestamp: '2024-01-15T09:15:00Z',
    },
    {
      id: '4',
      type: 'alert',
      title: 'Low Stock Alert',
      description: 'Running Shoes stock is running low (5 items left)',
      timestamp: '2024-01-15T08:30:00Z',
      severity: 'medium',
    },
    {
      id: '5',
      type: 'system',
      title: 'System Backup Completed',
      description: 'Daily backup completed successfully',
      timestamp: '2024-01-15T02:00:00Z',
      severity: 'low',
    },
    {
      id: '6',
      type: 'order',
      title: 'Order Shipped',
      description: 'Order #12340 has been shipped',
      timestamp: '2024-01-14T16:20:00Z',
    },
  ];

  const activities = data || mockActivities;

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type'], severity?: ActivityItem['severity']) => {
    if (type === 'alert') {
      switch (severity) {
        case 'high':
          return 'text-red-600 bg-red-100 dark:bg-red-900/20';
        case 'medium':
          return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
        case 'low':
          return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
        default:
          return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      }
    }

    switch (type) {
      case 'order':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'customer':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'product':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'system':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Activity Feed</CardTitle>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 6).map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.userName && (
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.userName}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length > 6 && (
              <div className="text-center pt-2">
                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                  View all activities
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
