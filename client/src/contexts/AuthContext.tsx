import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/axios';

// Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  wishlist?: any[];
  cart?: any[];
  createdAt?: string;
}

// Sync callback types
type SyncCallback = () => Promise<void>;

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  registerSyncCallback: (key: string, callback: SyncCallback) => void;
  unregisterSyncCallback: (key: string) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncCallbacks] = useState<Map<string, SyncCallback>>(new Map());

  const registerSyncCallback = useCallback((key: string, callback: SyncCallback) => {
    syncCallbacks.set(key, callback);
  }, [syncCallbacks]);

  const unregisterSyncCallback = useCallback((key: string) => {
    syncCallbacks.delete(key);
  }, [syncCallbacks]);

  const runSyncCallbacks = useCallback(async () => {
    for (const callback of syncCallbacks.values()) {
      try {
        await callback();
      } catch (error) {
        console.error('Sync callback error:', error);
      }
    }
  }, [syncCallbacks]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('customerToken');
      const storedCustomer = localStorage.getItem('customer');

      if (token && storedCustomer) {
        try {
          // Validate token by fetching current user
          const response = await api.get('/api/customer/auth/me');
          if (response.data.success) {
            setCustomer(response.data.data.customer);
            localStorage.setItem('customer', JSON.stringify(response.data.data.customer));
          }
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customer');
          setCustomer(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/customer/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, data } = response.data;
        localStorage.setItem('customerToken', token);
        localStorage.setItem('customer', JSON.stringify(data.customer));
        setCustomer(data.customer);
        
        // Run sync callbacks after successful login
        await runSyncCallbacks();
        
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/api/customer/auth/register', data);
      
      if (response.data.success) {
        const { token, data: responseData } = response.data;
        localStorage.setItem('customerToken', token);
        localStorage.setItem('customer', JSON.stringify(responseData.customer));
        setCustomer(responseData.customer);
        
        // Run sync callbacks after successful registration
        await runSyncCallbacks();
        
        return { success: true };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/customer/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      setCustomer(null);
    }
  };

  const updateProfile = async (data: Partial<Customer>) => {
    try {
      const response = await api.put('/api/customer/auth/profile', data);
      
      if (response.data.success) {
        setCustomer(response.data.data.customer);
        localStorage.setItem('customer', JSON.stringify(response.data.data.customer));
        return { success: true };
      }
      
      return { success: false, error: 'Update failed' };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Update failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const value = {
    customer,
    isAuthenticated: !!customer,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    registerSyncCallback,
    unregisterSyncCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
