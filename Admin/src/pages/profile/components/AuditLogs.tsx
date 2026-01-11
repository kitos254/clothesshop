import React, { useState, useEffect } from 'react';
import { Activity, Calendar, ChevronDown, ChevronUp, Filter, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AuditLog, profileAPI } from '../services/profileApi';

const AuditLogs: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    action: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters.page, filters.limit, filters.action]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const response = await profileAPI.getAuditLogs(filters);
      
      if (response.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to load audit logs',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const getActionBadgeColor = (action: string) => {
    const colors = {
      LOGIN_SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      LOGIN_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      LOGOUT_ALL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      PASSWORD_CHANGE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      PROFILE_UPDATE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      TOKEN_REFRESH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      SESSION_REVOKE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatActionName = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
      case 'LOGIN_FAILED':
        return <Shield className="w-4 h-4" />;
      case 'PROFILE_UPDATE':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const actionTypes = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGOUT',
    'LOGOUT_ALL',
    'PASSWORD_CHANGE',
    'PROFILE_UPDATE',
    'TOKEN_REFRESH',
    'SESSION_REVOKE',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Activity Log
        </CardTitle>
        <CardDescription>
          View your account activity and security events
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={filters.action || "all"} onValueChange={(value) => handleFilterChange('action', value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatActionName(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              placeholder="Start date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              placeholder="End date"
            />
          </div>
          
          <Button onClick={loadAuditLogs} disabled={isLoading}>
            <Filter className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No audit logs found
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const { date, time } = formatTimestamp(log.timestamp);
              const isExpanded = expandedLog === log._id;
              
              return (
                <div
                  key={log._id}
                  className={`border rounded-lg p-4 transition-all ${
                    log.success 
                      ? 'border-border' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {formatActionName(log.action)}
                          </Badge>
                          {!log.success && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {date} at {time}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLogExpansion(log._id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">IP Address:</span>
                          <p className="text-muted-foreground">{log.ip || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="font-medium">User Agent:</span>
                          <p className="text-muted-foreground break-all">
                            {log.userAgent || 'Unknown'}
                          </p>
                        </div>
                        {log.resource && (
                          <div>
                            <span className="font-medium">Resource:</span>
                            <p className="text-muted-foreground">{log.resource}</p>
                          </div>
                        )}
                        {log.resourceId && (
                          <div>
                            <span className="font-medium">Resource ID:</span>
                            <p className="text-muted-foreground">{log.resourceId}</p>
                          </div>
                        )}
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">Details:</span>
                          <pre className="text-xs text-muted-foreground mt-1 p-2 bg-background rounded border overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.errorMessage && (
                        <div className="mt-3">
                          <span className="font-medium text-sm text-red-600">Error:</span>
                          <p className="text-sm text-red-600 mt-1">{log.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
