import { mockProfile, mockAuth, mockAdmin, mockSecuritySettings, mockAuditLogs } from '@/lib/mockData';

export interface Admin {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  avatar?: {
    url: string;
    publicId: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      inApp: boolean;
    };
  };
  lastLoginAt?: string;
  lastLoginIp?: string;
  activeSessionsCount?: number;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferences?: Partial<Admin['preferences']>;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface Session {
  sessionId: string;
  deviceInfo: {
    userAgent?: string;
    ip?: string;
    device?: string;
    browser?: string;
    os?: string;
  };
  createdAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

export interface AuditLog {
  _id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details: any;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

class ProfileAPIService {
  // Get current admin profile (Mock)
  async getProfile(): Promise<{ success: boolean; data: { admin: Admin } }> {
    console.log('🔐 ProfileAPI: Getting profile (Mock)...');
    return await mockProfile.getProfile();
  }

  // Update admin profile (Mock)
  async updateProfile(data: ProfileUpdateData): Promise<{ success: boolean; message: string; data: { admin: Admin } }> {
    console.log('🔐 ProfileAPI: Updating profile (Mock)...', data);
    const response = await mockProfile.updateProfile(data as any);
    return {
      success: response.success,
      message: 'Profile updated successfully',
      data: response.data
    };
  }

  // Change password (Mock)
  async changePassword(data: PasswordChangeData): Promise<{ success: boolean; message: string }> {
    console.log('🔐 ProfileAPI: Changing password (Mock)...');
    // Simulate password validation
    if (!data.currentPassword || !data.newPassword) {
      throw new Error('Current password and new password are required');
    }
    if (data.currentPassword !== 'admin123') {
      throw new Error('Current password is incorrect');
    }
    if (data.newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Mock delay
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  // Get active sessions (Mock)
  async getSessions(): Promise<{ success: boolean; data: { sessions: Session[] } }> {
    console.log('🔐 ProfileAPI: Getting sessions (Mock)...');
    const response = await mockProfile.getSecuritySettings();
    return {
      success: true,
      data: { sessions: response.data.activeSessions }
    };
  }

  // Revoke a specific session (Mock)
  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    console.log('🔐 ProfileAPI: Revoking session (Mock)...', sessionId);
    await new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
    return {
      success: true,
      message: 'Session revoked successfully'
    };
  }

  // Logout from all devices (Mock)
  async logoutAll(): Promise<{ success: boolean; message: string }> {
    console.log('🔐 ProfileAPI: Logging out from all devices (Mock)...');
    await new Promise(resolve => setTimeout(resolve, 600)); // Mock delay
    return {
      success: true,
      message: 'Logged out from all devices successfully'
    };
  }

  // Get audit logs for current admin (Mock)
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ 
    success: boolean; 
    data: { 
      logs: AuditLog[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    console.log('🔐 ProfileAPI: Getting audit logs (Mock)...', params);
    const response = await mockProfile.getAuditLogs();
    return {
      success: true,
      data: {
        logs: response.data,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: response.data.length,
          pages: Math.ceil(response.data.length / (params?.limit || 10))
        }
      }
    };
  }

  // Upload avatar (Mock)
  async uploadAvatar(file: File): Promise<{ success: boolean; message: string; data: { avatar: { url: string; publicId: string } } }> {
    console.log('🔐 ProfileAPI: Uploading avatar (Mock)...', file.name);
    await new Promise(resolve => setTimeout(resolve, 1200)); // Mock delay for upload
    
    // Mock avatar URL (using a random unsplash image)
    const mockAvatarUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80&t=${Date.now()}`;
    
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: {
          url: mockAvatarUrl,
          publicId: `mock_avatar_${Date.now()}`
        }
      }
    };
  }

  // Delete avatar (Mock)
  async deleteAvatar(): Promise<{ success: boolean; message: string }> {
    console.log('🔐 ProfileAPI: Deleting avatar (Mock)...');
    await new Promise(resolve => setTimeout(resolve, 400)); // Mock delay
    return {
      success: true,
      message: 'Avatar deleted successfully'
    };
  }
}

export const profileAPI = new ProfileAPIService();
