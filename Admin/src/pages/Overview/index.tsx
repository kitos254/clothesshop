import React from 'react';
import StatsCards from './components/StatsCards';
import RecentOrders from './components/RecentOrders';
import SalesChart from './components/SalesChart';
import TopProducts from './components/TopProducts';
import RecentCustomers from './components/RecentCustomers';
import ActivityFeed from './components/ActivityFeed';
import { useOverviewData } from './hooks/useOverviewData';

/**
 * Overview Page - Main Dashboard
 * 
 * This is the main dashboard page that provides an overview of:
 * - Key statistics and metrics
 * - Recent orders and activities
 * - Sales performance charts
 * - Top-performing products
 * - Recent customer activity
 * - System activity feed
 */
const OverviewPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useOverviewData();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground mb-4">
            Failed to load dashboard data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={data?.stats} isLoading={isLoading} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sales Chart */}
        <div className="lg:col-span-2">
          <SalesChart data={data?.salesChart} isLoading={isLoading} />
        </div>

        {/* Right Column - Top Products */}
        <div>
          <TopProducts data={data?.topProducts} isLoading={isLoading} />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-1">
          <RecentOrders data={data?.recentOrders} isLoading={isLoading} />
        </div>

        {/* Recent Customers */}
        <div className="xl:col-span-1">
          <RecentCustomers data={data?.recentCustomers} isLoading={isLoading} />
        </div>

        {/* Activity Feed */}
        <div className="xl:col-span-1">
          <ActivityFeed data={data?.activities} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
