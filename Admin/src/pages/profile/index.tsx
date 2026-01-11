import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Settings, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileSkeleton } from '@/components/ui/loading-skeletons';
import { Admin as ProfileAdmin, profileAPI } from './services/profileApi';
import ProfileOverview from './components/ProfileOverview';
import SecuritySettings from './components/SecuritySettings';
import Preferences from './components/Preferences';
import AuditLogs from './components/AuditLogs';

// Use the Admin type from AuthContext
type AuthAdmin = NonNullable<ReturnType<typeof useAuth>['admin']>;

// Convert AuthContext Admin to Profile Admin
const convertToProfileAdmin = (authAdmin: AuthAdmin): ProfileAdmin => {
  return {
    _id: authAdmin.id,
    username: authAdmin.username,
    email: authAdmin.email,
    firstName: authAdmin.firstName,
    lastName: authAdmin.lastName,
    role: authAdmin.role,
    permissions: authAdmin.permissions,
    isActive: authAdmin.isActive,
    isEmailVerified: true, // Default value
    avatar: authAdmin.avatar,
    preferences: {
      ...authAdmin.preferences,
      theme: (authAdmin.preferences.theme as 'light' | 'dark' | 'auto') || 'light',
    },
    createdAt: new Date().toISOString(), // Default value
    updatedAt: new Date().toISOString(), // Default value
  };
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Load active tab from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem("profile-active-tab");
    if (savedTab && ['overview', 'security', 'preferences', 'activity'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("profile-active-tab", value);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleAdminUpdate = (updatedAdmin: ProfileAdmin) => {
    // In a real implementation, this would update the AuthContext
    console.log('Admin updated:', updatedAdmin);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen p-1">
        <div className="max-w-[2000px] mx-auto">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to access this page.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: User,
      component: ProfileOverview,
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      component: SecuritySettings,
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: Settings,
      component: Preferences,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
      component: AuditLogs,
    },
  ];

  return (
    <div className="min-h-screen p-1">
      <div className="max-w-[2000px] mx-auto">
        {/* Profile Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation */}
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-foreground rounded-none px-4 py-2 flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="mt-6">
            <ProfileOverview admin={convertToProfileAdmin(admin)} onUpdate={handleAdminUpdate} />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <Preferences admin={convertToProfileAdmin(admin)} onUpdate={handleAdminUpdate} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
