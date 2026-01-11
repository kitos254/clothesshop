import api from '@/lib/axios';
import type { 
  CloudinaryAccount, 
  CloudinaryAccountForm, 
  CloudinaryUsageStats, 
  CloudinaryApiResponse,
  HealthCheckResult
} from '../types';

export class CloudinaryApiService {
  private static baseUrl = '/cloudinary';

  // Get all cloudinary accounts
  static async getAllAccounts(): Promise<CloudinaryApiResponse<{ accounts: CloudinaryAccount[] }>> {
    try {
      const response = await api.get(this.baseUrl);
      return {
        success: true,
        data: { accounts: response.data.data || [] }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch accounts'
      };
    }
  }

  // Get existing draft account (there should only be one)
  static async getExistingDraft(): Promise<CloudinaryApiResponse<{ draft: CloudinaryAccount | null }>> {
    try {
      const response = await api.get(`${this.baseUrl}/draft`);
      return {
        success: true,
        data: { draft: response.data.data || null }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch draft'
      };
    }
  }

  // Get single cloudinary account
  static async getAccount(id: string): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount }>> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: { account: response.data.data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch account'
      };
    }
  }

  // Create new cloudinary account
  static async createAccount(data: Partial<CloudinaryAccountForm> & { isDraft?: boolean }): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount }>> {
    try {
      const response = await api.post(this.baseUrl, data);
      return {
        success: true,
        data: { account: response.data.data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create account'
      };
    }
  }

  // Create draft cloudinary account (only one at a time)
  static async createDraftAccount(): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount }>> {
    try {
      // First check if there's already a draft
      const existingDraftResult = await this.getExistingDraft();
      if (existingDraftResult.success && existingDraftResult.data.draft) {
        return {
          success: true,
          data: { account: existingDraftResult.data.draft }
        };
      }

      const draftData = {
        isDraft: true,
        email: '',
        cloudName: null, // Use null instead of empty string for unique constraint
        apiKey: '',
        apiSecret: '',
        maxUploadsPerDay: 1000,
        maxUploadsPerMonth: 25000,
        priority: 1,
        isPrimary: false,
        defaultFolder: 'products',
        settings: {
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          maxFileSize: 10485760,
          autoOptimize: true,
          generateThumbnails: true
        }
      };
      const response = await api.post(this.baseUrl, draftData);
      return {
        success: true,
        data: { account: response.data.data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create draft account'
      };
    }
  }

  // Update cloudinary account
  static async updateAccount(id: string, data: Partial<CloudinaryAccountForm>): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount }>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return {
        success: true,
        data: { account: response.data.data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update account'
      };
    }
  }

  // Delete cloudinary account
  static async deleteAccount(id: string): Promise<CloudinaryApiResponse<{}>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: {}
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete account'
      };
    }
  }

  // Toggle account status (activate/suspend)
  static async toggleAccountStatus(id: string, isActive: boolean): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount }>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/status`, { isActive });
      return {
        success: true,
        data: { account: response.data.data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to toggle account status'
      };
    }
  }

  // Perform health check on single account
  static async performHealthCheck(id: string): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount; healthCheck: HealthCheckResult }>> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/health-check`);
      return {
        success: true,
        data: { 
          account: response.data.data.account,
          healthCheck: response.data.data.healthCheck
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Health check failed'
      };
    }
  }

  // Perform health check on all accounts
  static async performAllHealthChecks(): Promise<CloudinaryApiResponse<HealthCheckResult[]>> {
    try {
      const response = await api.post(`${this.baseUrl}/health-check`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Health checks failed'
      };
    }
  }

  // Get usage statistics
  static async getUsageStats(): Promise<CloudinaryApiResponse<CloudinaryUsageStats>> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get usage stats'
      };
    }
  }

  // Reset error count for account
  static async resetErrorCount(id: string): Promise<CloudinaryApiResponse<{ account: CloudinaryAccount }>> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/reset-errors`);
      return {
        success: true,
        data: { account: response.data.data }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to reset error count'
      };
    }
  }
}

export default CloudinaryApiService;
