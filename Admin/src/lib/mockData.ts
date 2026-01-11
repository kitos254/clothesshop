/**
 * Mock Data for Admin Application
 * Replaces all backend API calls with static mock data
 */

// Mock Admin User Data
export const mockAdmin = {
  _id: "66c4e5f8a7b2c1d3e4f56789",
  username: "admin",
  email: "admin@newran.com",
  firstName: "John",
  lastName: "Admin",
  fullName: "John Admin",
  role: "super_admin",
  permissions: [
    "view_dashboard",
    "manage_products",
    "manage_customers",
    "manage_orders",
    "manage_admins",
    "view_analytics",
    "system_settings"
  ],
  isActive: true,
  avatar: {
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    publicId: "admin_avatar_001"
  },
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-09-19T08:15:00.000Z",
  lastLogin: "2024-09-19T08:00:00.000Z",
  preferences: {
    theme: "light",
    language: "en",
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    dashboard: {
      layout: "grid",
      widgets: ["stats", "recent_orders", "top_products"]
    }
  }
};

// Mock Authentication Tokens
export const mockTokens = {
  accessToken: "mock_access_token_12345",
  refreshToken: "mock_refresh_token_67890",
  sessionId: "mock_session_abc123"
};

// Mock Dashboard Statistics
export const mockStats = {
  overview: {
    totalRevenue: 245680.50,
    totalOrders: 1248,
    totalCustomers: 892,
    totalProducts: 156,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    customersGrowth: 15.2,
    productsGrowth: 5.1
  },
  recentOrders: [
    {
      id: "ORD-001",
      customer: "Alice Johnson",
      total: 149.99,
      status: "completed",
      createdAt: "2024-09-19T06:30:00.000Z"
    },
    {
      id: "ORD-002", 
      customer: "Bob Smith",
      total: 89.50,
      status: "pending",
      createdAt: "2024-09-19T05:45:00.000Z"
    },
    {
      id: "ORD-003",
      customer: "Carol Williams",
      total: 299.99,
      status: "shipped",
      createdAt: "2024-09-19T04:20:00.000Z"
    }
  ],
  topProducts: [
    {
      id: "PROD-001",
      name: "Premium T-Shirt",
      sales: 156,
      revenue: 2340.00,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop"
    },
    {
      id: "PROD-002",
      name: "Designer Jeans",
      sales: 89,
      revenue: 8900.00,
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=100&h=100&fit=crop"
    },
    {
      id: "PROD-003",
      name: "Winter Jacket",
      sales: 67,
      revenue: 6700.00,
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop"
    }
  ]
};

// Mock Security Settings
export const mockSecuritySettings = {
  twoFactorAuth: {
    enabled: false,
    method: null,
    backupCodes: []
  },
  activeSessions: [
    {
      sessionId: "session_001",
      deviceInfo: {
        device: "MacBook Pro",
        browser: "Chrome 118",
        os: "macOS",
        ip: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      },
      createdAt: "2024-09-19T08:00:00.000Z",
      lastActivityAt: "2024-09-19T08:00:00.000Z",
      isCurrent: true
    },
    {
      sessionId: "session_002",
      deviceInfo: {
        device: "iPhone 15",
        browser: "Safari Mobile",
        os: "iOS",
        ip: "192.168.1.101",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
      },
      createdAt: "2024-09-18T22:30:00.000Z",
      lastActivityAt: "2024-09-18T22:30:00.000Z",
      isCurrent: false
    }
  ],
  loginHistory: [
    {
      timestamp: "2024-09-19T08:00:00.000Z",
      ipAddress: "192.168.1.100",
      device: "MacBook Pro",
      location: "New York, US",
      status: "success"
    },
    {
      timestamp: "2024-09-18T22:30:00.000Z",
      ipAddress: "192.168.1.101",
      device: "iPhone 15",
      location: "New York, US",
      status: "success"
    },
    {
      timestamp: "2024-09-18T10:15:00.000Z",
      ipAddress: "192.168.1.100",
      device: "MacBook Pro",
      location: "New York, US",
      status: "success"
    }
  ]
};

// Mock Audit Logs
export const mockAuditLogs = [
  {
    id: "audit_001",
    action: "LOGIN",
    resource: "Authentication",
    details: "Admin logged in successfully",
    timestamp: "2024-09-19T08:00:00.000Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  },
  {
    id: "audit_002",
    action: "PROFILE_UPDATE",
    resource: "Admin Profile",
    details: "Updated profile preferences",
    timestamp: "2024-09-18T15:30:00.000Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  },
  {
    id: "audit_003",
    action: "PASSWORD_CHANGE",
    resource: "Security",
    details: "Password changed successfully",
    timestamp: "2024-09-17T09:45:00.000Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  }
];

// Mock API Response Format
export const createMockResponse = (data: any, success = true, message = "") => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString()
});

// Mock API Delays (simulate network latency)
export const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication Mock Functions
export const mockAuth = {
  login: async (credentials: { email?: string; username?: string; password: string }) => {
    await mockDelay(800);
    
    // Simulate validation
    const identifier = credentials.email || credentials.username;
    if (!identifier || !credentials.password) {
      throw new Error("Email/Username and password are required");
    }
    
    // Simulate different responses based on credentials
    if (credentials.password !== "admin123") {
      throw new Error("Invalid credentials");
    }
    
    return createMockResponse({
      admin: mockAdmin,
      tokens: mockTokens,
      sessionId: mockTokens.sessionId
    });
  },
  
  verifyToken: async () => {
    await mockDelay(300);
    return createMockResponse({ admin: mockAdmin });
  },
  
  logout: async () => {
    await mockDelay(200);
    return createMockResponse(null);
  },
  
  refreshToken: async () => {
    await mockDelay(400);
    return createMockResponse({ tokens: mockTokens });
  }
};

// Profile Mock Functions
export const mockProfile = {
  getProfile: async () => {
    await mockDelay(300);
    return createMockResponse({ admin: mockAdmin });
  },
  
  updateProfile: async (data: Partial<typeof mockAdmin>) => {
    await mockDelay(600);
    const updatedAdmin = { ...mockAdmin, ...data, updatedAt: new Date().toISOString() };
    return createMockResponse({ admin: updatedAdmin });
  },
  
  getSecuritySettings: async () => {
    await mockDelay(400);
    return createMockResponse(mockSecuritySettings);
  },
  
  updateSecuritySettings: async (data: any) => {
    await mockDelay(700);
    const updatedSettings = { ...mockSecuritySettings, ...data };
    return createMockResponse(updatedSettings);
  },
  
  getAuditLogs: async () => {
    await mockDelay(500);
    return createMockResponse(mockAuditLogs);
  }
};

// Dashboard Mock Functions
export const mockDashboard = {
  getStats: async () => {
    await mockDelay(600);
    return createMockResponse(mockStats);
  }
};

export default {
  mockAdmin,
  mockTokens,
  mockStats,
  mockSecuritySettings,
  mockAuditLogs,
  createMockResponse,
  mockDelay,
  mockAuth,
  mockProfile,
  mockDashboard
};
