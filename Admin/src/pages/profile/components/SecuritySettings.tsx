import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Lock, Shield, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PasswordChangeData, Session, profileAPI } from '../services/profileApi';

const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData & { confirmPassword: string }>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await profileAPI.getSessions();
      if (response.success) {
        setSessions(response.data.sessions);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to load sessions',
        variant: "destructive",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (response.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast({
          title: "Password Changed",
          description: response.message,
        });
        // Reload sessions as other sessions will be logged out
        await loadSessions();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to change password',
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await profileAPI.revokeSession(sessionId);
      
      if (response.success) {
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        toast({
          title: "Session Revoked",
          description: response.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to revoke session',
        variant: "destructive",
      });
    }
  };

  const handleLogoutAll = async () => {
    try {
      const response = await profileAPI.logoutAll();
      
      if (response.success) {
        toast({
          title: "All Sessions Terminated",
          description: response.message,
        });
        // No redirect needed in mock mode - just show success
        console.log('Logout all completed (mock mode)');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to logout from all devices',
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getDeviceIcon = (deviceInfo: Session['deviceInfo']) => {
    if (!deviceInfo) {
      return <Shield className="w-4 h-4" />;
    }
    const device = deviceInfo.device?.toLowerCase() || '';
    if (device.includes('mobile') || device.includes('android') || device.includes('iphone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const formatLastActivity = (lastActivity: string) => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Active now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="pr-10"
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isChangingPassword}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="pr-10"
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isChangingPassword}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="pr-10"
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isChangingPassword}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-sm text-muted-foreground">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isChangingPassword}
              className="w-full sm:w-auto"
            >
              {isChangingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Active Sessions
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessions}
              disabled={isLoadingSessions}
            >
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage devices that are currently signed in to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active sessions found
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(session.deviceInfo)}
                    <div>
                      <p className="font-medium">
                        {session.deviceInfo.browser || 'Unknown Browser'} on{' '}
                        {session.deviceInfo.os || 'Unknown OS'}
                        {session.isCurrent && (
                          <Badge variant="secondary" className="ml-2">
                            Current Session
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.deviceInfo.ip && `IP: ${session.deviceInfo.ip} • `}
                        {formatLastActivity(session.lastActivityAt)}
                      </p>
                    </div>
                  </div>
                  
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.sessionId)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
              
              {sessions.length > 1 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have multiple active sessions. For security reasons, consider revoking sessions you don't recognize.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-center pt-4">
                <Button
                  variant="destructive"
                  onClick={handleLogoutAll}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Logout from All Devices
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
