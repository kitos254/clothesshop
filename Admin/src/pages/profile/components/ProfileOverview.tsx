import React, { useState } from 'react';
import { Camera, Edit3, Mail, Phone, Save, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Admin, ProfileUpdateData, profileAPI } from '../services/profileApi';

interface ProfileOverviewProps {
  admin: Admin;
  onUpdate: (updatedAdmin: Admin) => void;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({ admin, onUpdate }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstName: admin.firstName,
    lastName: admin.lastName,
    phone: admin.phone || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await profileAPI.updateProfile(formData);
      
      if (response.success) {
        onUpdate(response.data.admin);
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: response.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to update profile',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await profileAPI.uploadAvatar(file);
      
      if (response.success) {
        const updatedAdmin = { ...admin, avatar: response.data.avatar };
        onUpdate(updatedAdmin);
        toast({
          title: "Avatar Updated",
          description: response.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to upload avatar',
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const response = await profileAPI.deleteAvatar();
      
      if (response.success) {
        const updatedAdmin = { ...admin, avatar: undefined };
        onUpdate(updatedAdmin);
        toast({
          title: "Avatar Removed",
          description: response.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || 'Failed to remove avatar',
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    return `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      moderator: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile Overview
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Manage your personal information and profile settings
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={admin.avatar?.url} alt={admin.firstName} />
              <AvatarFallback className="text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute -bottom-2 -right-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-8 h-8 rounded-full p-0"
                  disabled={isUploadingAvatar}
                  asChild
                >
                  <span>
                    <Camera className="w-4 h-4" />
                  </span>
                </Button>
              </label>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{admin.firstName} {admin.lastName}</h3>
            <p className="text-sm text-muted-foreground">@{admin.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(admin.role)}`}>
                {formatRoleName(admin.role)}
              </span>
              {admin.isEmailVerified && (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Verified
                </span>
              )}
            </div>
            
            {admin.avatar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAvatar}
                className="mt-2 text-destructive hover:text-destructive"
              >
                Remove Avatar
              </Button>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            {isEditing ? (
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{admin.firstName}</span>
              </div>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            {isEditing ? (
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{admin.lastName}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{admin.email}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            {isEditing ? (
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                disabled={isLoading}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{admin.phone || 'Not provided'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        {/* Account Statistics */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-3">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Member since</span>
              <p className="font-medium">
                {new Date(admin.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last login</span>
              <p className="font-medium">
                {admin.lastLoginAt 
                  ? new Date(admin.lastLoginAt).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Active sessions</span>
              <p className="font-medium">{admin.activeSessionsCount || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileOverview;
