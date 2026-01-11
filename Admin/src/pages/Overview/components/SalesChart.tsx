import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SalesData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

interface SalesChartProps {
  data?: SalesData[];
  isLoading?: boolean;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, isLoading }) => {
  // Mock data if no data provided
  const mockData: SalesData[] = [
    { date: 'Jan', sales: 4000, orders: 120, revenue: 45000 },
    { date: 'Feb', sales: 3000, orders: 98, revenue: 35000 },
    { date: 'Mar', sales: 5000, orders: 150, revenue: 55000 },
    { date: 'Apr', sales: 4500, orders: 135, revenue: 48000 },
    { date: 'May', sales: 6000, orders: 180, revenue: 65000 },
    { date: 'Jun', sales: 5500, orders: 165, revenue: 58000 },
    { date: 'Jul', sales: 7000, orders: 210, revenue: 75000 },
  ];

  const chartData = data || mockData;

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Revenue and order trends over time
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Revenue Chart */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Revenue Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelStyle={{ color: 'var(--foreground)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      border: '1px solid var(--border)',
                      borderRadius: '6px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Chart */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Orders Trend</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatNumber(value), 'Orders']}
                    labelStyle={{ color: 'var(--foreground)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      border: '1px solid var(--border)',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart;
