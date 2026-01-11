import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Filter } from 'lucide-react';

const OrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Orders
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Orders Page</h3>
            <p>This page is under development.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
