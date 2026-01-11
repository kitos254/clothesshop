import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/axios';

interface Admin {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  avatar?: {
    url: string;
    publicId: string;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      inApp: boolean;
    };
  };
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { login: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('AdminToken');
      
      if (!token) {
        setIsAuthenticated(false);
        setAdmin(null);
        return;
      }

      // Get full admin profile using /me endpoint
      const response = await api.get('/admin/auth/me');
      
      if (response.data.success) {
        setAdmin(response.data.data.admin);
        setIsAuthenticated(true);
        localStorage.setItem('AdminData', JSON.stringify(response.data.data.admin));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('AdminToken');
      localStorage.removeItem('AdminData');
      setIsAuthenticated(false);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { login: string; password: string; rememberMe?: boolean }) => {
    try {
      const response = await api.post('/admin/auth/login', credentials);
      
      if (response.data.success) {
        const { token, data } = response.data;
        
        // Store token and admin data
        localStorage.setItem('AdminToken', token);
        localStorage.setItem('AdminData', JSON.stringify(data.admin));
        
        setAdmin(data.admin);
        setIsAuthenticated(true);
      }
    } catch (error) {
      throw error; // Re-throw to handle in component
    }
  };

  const logout = async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('AdminToken');
      localStorage.removeItem('AdminData');
      setAdmin(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/admin/auth/refresh');
      
      if (response.data.success) {
        const { token, data } = response.data;
        localStorage.setItem('AdminToken', token);
        localStorage.setItem('AdminData', JSON.stringify(data.admin));
        setAdmin(data.admin);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('AdminToken');
      localStorage.removeItem('AdminData');
      setAdmin(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
