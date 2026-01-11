export interface CloudinaryAccount {
  _id: string;
  name: string;
  email: string;
  cloudName: string;
  apiKey: string;
  apiSecret?: string;
  uploadCount: number;
  maxUploadsPerDay: number;
  maxUploadsPerMonth: number;
  dailyStats: {
    date: string;
    uploadsToday: number;
  };
  monthlyStats: {
    month: number;
    year: number;
    uploadsThisMonth: number;
  };
  isActive: boolean;
  isPrimary: boolean;
  priority: number;
  defaultFolder: string;
  settings: {
    allowedFormats: string[];
    maxFileSize: number;
    autoOptimize: boolean;
    generateThumbnails: boolean;
  };
  lastUsed: string;
  lastHealthCheck: string;
  healthStatus: 'healthy' | 'warning' | 'error' | 'maintenance';
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: string;
    details: any;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
  // Virtual fields
  isAvailable?: boolean;
  dailyUsagePercentage?: number;
  monthlyUsagePercentage?: number;
}

export interface CloudinaryAccountForm {
  name?: string;
  email: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  maxUploadsPerDay: number;
  maxUploadsPerMonth: number;
  priority: number;
  isPrimary: boolean;
  defaultFolder: string;
  settings: {
    allowedFormats: string[];
    maxFileSize: number;
    autoOptimize: boolean;
    generateThumbnails: boolean;
  };
}

export interface CloudinaryUsageStats {
  global: {
    totalAccounts: number;
    totalUploads: number;
    averageUploads: number;
    healthyAccounts: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    uploadCount: number;
    dailyUsage: number;
    monthlyUsage: number;
    healthStatus: string;
    isAvailable: boolean;
    lastUsed: string;
  }>;
}

export interface HealthCheckResult {
  accountId: string;
  accountName: string;
  status: 'healthy' | 'error';
  message: string;
}

export interface CloudinaryApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type CloudinaryAccountStatus = 'healthy' | 'warning' | 'error' | 'maintenance';
export type CloudinaryAccountAction = 'activate' | 'suspend' | 'delete' | 'health-check' | 'reset-errors';
