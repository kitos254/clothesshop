import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Trash2,
  Activity,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  RotateCcw,
} from "lucide-react";

import { CloudinaryApiService } from "./services/api";
import type { CloudinaryAccount, CloudinaryAccountForm } from "./types";

interface CloudinaryManagementProps {}

export default function CloudinaryManagement({}: CloudinaryManagementProps) {
  const { admin } = useAuth();
  const { toast } = useToast();

  // State management
  const [accounts, setAccounts] = useState<CloudinaryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Edit state
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CloudinaryAccountForm>>({});
  const [showSensitive, setShowSensitive] = useState<{
    [key: string]: boolean;
  }>({});
  const [showEditSecretKey, setShowEditSecretKey] = useState<{
    [key: string]: boolean;
  }>({});

  // Check if user is super admin or admin
  const canManageCloudinary =
    admin && ["super_admin", "admin"].includes(admin.role);

  // Check if there's already a draft configuration
  const hasDraft = accounts.some((account) => account.isDraft);

  useEffect(() => {
    if (canManageCloudinary) {
      fetchAccounts();
    } else {
      setLoading(false);
    }
  }, [canManageCloudinary]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CloudinaryApiService.getAllAccounts();
      if (response.success && response.data) {
        setAccounts(response.data.accounts || []);

        // Check if there's an existing draft and start editing it
        const existingDraft = response.data.accounts?.find(account => account.isDraft);
        if (existingDraft) {
          startEditing(existingDraft);
        }
      } else {
        throw new Error(response.error || "Failed to fetch accounts");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch configurations"
      );
    } finally {
      setLoading(false);
    }
  };

  const createDraftAccount = async () => {
    try {
      setLoading(true);

      const response = await CloudinaryApiService.createDraftAccount();
      console.log('Create draft response:', response); // Debug log
      
      if (response.success && response.data && response.data.account) {
        const newDraftAccount = response.data.account;

        // Add the new draft to accounts and start editing
        setAccounts((prev) => [newDraftAccount, ...prev]);
        startEditing(newDraftAccount);

        toast({
          title: "Draft Created",
          description: `Account ${newDraftAccount.name} created. Fill in the details and save when ready.`,
        });
      } else {
        throw new Error(response.error || 'Invalid response structure');
      }
    } catch (error: any) {
      console.error("Create draft error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || error.message || "Failed to create draft account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = async (account: CloudinaryAccount) => {
    try {
      // Validate account object first
      if (!account || !account._id) {
        console.error('Invalid account object:', account);
        toast({
          title: "Error",
          description: "Invalid account data received",
          variant: "destructive"
        });
        return;
      }

      setEditingAccount(account._id);
      setActionLoading((prev) => ({ ...prev, [account._id]: true }));

      // Fetch the full configuration including sensitive fields
      const response = await CloudinaryApiService.getAccount(account._id);
      if (response.success && response.data && response.data.account) {
        const fullAccount = response.data.account;

        setEditForm({
          name: fullAccount.name,
          email: fullAccount.email || "",
          cloudName: fullAccount.cloudName || "",
          apiKey: fullAccount.apiKey || "",
          apiSecret: fullAccount.apiSecret || "",
          maxUploadsPerDay: fullAccount.maxUploadsPerDay,
          maxUploadsPerMonth: fullAccount.maxUploadsPerMonth,
          priority: fullAccount.priority,
          isPrimary: fullAccount.isPrimary,
          defaultFolder: fullAccount.defaultFolder,
          settings: fullAccount.settings,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch full account data');
      }
    } catch (error: any) {
      console.error("Error fetching account for editing:", error);
      toast({
        title: "Error",
        description: "Failed to fetch account details for editing",
        variant: "destructive",
      });
      // Fallback to using the current account data
      if (account && account._id) {
        setEditForm({
          name: account.name,
          email: account.email || "",
          cloudName: account.cloudName || "",
          apiKey: account.apiKey || "",
          apiSecret: "",
          maxUploadsPerDay: account.maxUploadsPerDay,
          maxUploadsPerMonth: account.maxUploadsPerMonth,
          priority: account.priority,
          isPrimary: account.isPrimary,
          defaultFolder: account.defaultFolder,
          settings: account.settings,
        });
      }
    } finally {
      if (account && account._id) {
        setActionLoading((prev) => ({ ...prev, [account._id]: false }));
      }
    }
  };

  const cancelEditing = async () => {
    if (editingAccount) {
      const accountToCancel = accounts.find((a) => a._id === editingAccount);

      // Only delete draft if it's a new draft that was just created
      if (
        accountToCancel?.isDraft &&
        !accountToCancel.email &&
        (!accountToCancel.cloudName || accountToCancel.cloudName === null)
      ) {
        try {
          await CloudinaryApiService.deleteAccount(editingAccount);
          setAccounts((prev) =>
            prev.filter((account) => account._id !== editingAccount)
          );
          toast({
            title: "Draft Deleted",
            description: "Empty draft configuration has been removed.",
          });
        } catch (error: any) {
          console.error("Error deleting draft:", error);
        }
      }
    }

    setEditingAccount(null);
    setEditForm({});
    if (editingAccount) {
      setShowEditSecretKey((prev) => ({
        ...prev,
        [editingAccount]: false,
      }));
    }
  };

  const saveAccount = async () => {
    if (!editingAccount) return;

    const accountToUpdate = accounts.find((a) => a._id === editingAccount);
    if (!accountToUpdate) return;

    setActionLoading((prev) => ({ ...prev, [editingAccount]: true }));

    try {
      // Check if all required fields are filled
      const allFieldsFilled = !!(
        editForm.email &&
        editForm.cloudName &&
        editForm.apiKey &&
        editForm.apiSecret
      );

      const shouldRemainDraft = accountToUpdate.isDraft && !allFieldsFilled;

      if (!shouldRemainDraft && accountToUpdate.isDraft && !allFieldsFilled) {
        toast({
          title: "Cannot Activate",
          description:
            "Please fill all required fields to activate the account",
          variant: "destructive",
        });
        setActionLoading((prev) => ({ ...prev, [editingAccount]: false }));
        return;
      }

      const updateData = {
        ...editForm,
        isDraft: shouldRemainDraft,
      };

      const response = await CloudinaryApiService.updateAccount(
        editingAccount,
        updateData
      );
      if (response.success && response.data) {
        setAccounts((prev) =>
          prev.map((account) =>
            account._id === editingAccount ? response.data!.account : account
          )
        );

        if (accountToUpdate.isDraft && !shouldRemainDraft) {
          toast({
            title: "Configuration Activated",
            description: "All details completed. Configuration is now live!",
          });
        } else if (shouldRemainDraft) {
          toast({
            title: "Draft Saved",
            description:
              "Progress saved. Fill all required fields to activate configuration.",
          });
        } else {
          toast({
            title: "Success",
            description: "Configuration updated successfully",
          });
        }

        const accountId = editingAccount;
        setEditingAccount(null);
        setEditForm({});
        if (accountId) {
          setShowEditSecretKey((prev) => ({
            ...prev,
            [accountId]: false,
          }));
        }
      }
    } catch (error: any) {
      console.error("Save account error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save account",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [editingAccount]: false }));
    }
  };

  const toggleSensitiveData = (accountId: string) => {
    setShowSensitive((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const toggleEditSecretKey = (accountId: string) => {
    setShowEditSecretKey((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const handleSuspendAccount = async (accountId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [accountId]: true }));

      const response = await CloudinaryApiService.toggleAccountStatus(
        accountId,
        false
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Account suspended successfully",
        });

        setAccounts((prev) =>
          prev.map((account) =>
            account._id === accountId
              ? { ...account, isActive: false }
              : account
          )
        );
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to suspend account",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleActivateAccount = async (accountId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [accountId]: true }));

      // Find the account to validate
      const account = accounts.find(acc => acc._id === accountId);
      if (!account) {
        throw new Error("Account not found");
      }

      // Validate required fields
      if (!account.name || !account.apiKey || !account.apiSecret) {
        toast({
          title: "Validation Error",
          description: "Cannot activate account without name, API key, and API secret",
          variant: "destructive",
        });
        return;
      }

      const response = await CloudinaryApiService.toggleAccountStatus(
        accountId,
        true
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Account activated successfully",
        });

        setAccounts((prev) =>
          prev.map((account) =>
            account._id === accountId ? { ...account, isActive: true } : account
          )
        );
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to activate account",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [accountId]: true }));

      const response = await CloudinaryApiService.deleteAccount(accountId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Account deleted successfully",
        });

        setAccounts((prev) =>
          prev.filter((account) => account._id !== accountId)
        );
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleDeleteInEditMode = async (accountId: string) => {
    try {
      const accountToDelete = accounts.find((a) => a._id === accountId);

      // Check if configuration can be deleted
      if (accountToDelete?.isActive) {
        toast({
          title: "Cannot Delete",
          description:
            "Active configurations cannot be deleted. Please suspend it first.",
          variant: "destructive",
        });
        return;
      }

      setActionLoading((prev) => ({ ...prev, [accountId]: true }));

      const response = await CloudinaryApiService.deleteAccount(accountId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Configuration deleted successfully",
        });

        // Remove from configurations and exit edit mode
        setAccounts((prev) =>
          prev.filter((account) => account._id !== accountId)
        );
        setEditingAccount(null);
        setEditForm({});
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to delete configuration",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleHealthCheck = async (accountId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`health_${accountId}`]: true }));

      const response = await CloudinaryApiService.performHealthCheck(accountId);
      if (response.success && response.data) {
        const { account, healthCheck } = response.data;

        // Update the account in state
        setAccounts((prev) =>
          prev.map((acc) => (acc._id === accountId ? account : acc))
        );

        toast({
          title: "Health Check Complete",
          description: healthCheck.message,
          variant: healthCheck.status === "healthy" ? "default" : "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Health check failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`health_${accountId}`]: false }));
    }
  };

  const handleResetErrors = async (accountId: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`reset_${accountId}`]: true }));

      const response = await CloudinaryApiService.resetErrorCount(accountId);
      if (response.success) {
        const updatedAccount = response.data?.account;
        if (updatedAccount) {
          setAccounts((prev) =>
            prev.map((acc) => (acc._id === accountId ? updatedAccount : acc))
          );
        }

        toast({
          title: "Success",
          description: "Error count reset successfully",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to reset error count",
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reset_${accountId}`]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      case "maintenance":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const canDeleteAccount = (account: CloudinaryAccount) => {
    return account.isDraft || !account.isActive;
  };

  const canActivateAccount = (account: CloudinaryAccount) => {
    return account.name && account.apiKey && account.apiSecret;
  };

  if (!canManageCloudinary) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to manage Cloudinary accounts. Please
            contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cloudinary Management
          </h2>
          <p className="text-muted-foreground">
            Manage Cloudinary accounts for image storage and processing
          </p>
        </div>
        <Button
          onClick={createDraftAccount}
          disabled={loading || hasDraft}
          className="ml-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Account cards skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                  
                  {/* Content grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-18" />
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {accounts.length === 0 ? (
            <Card className="min-h-[80vh] flex">
              <CardContent className="flex flex-col items-center justify-center py-16 w-full">
                <Activity className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Cloudinary accounts
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                  Get started by creating your first Cloudinary account
                  configuration for image storage and processing.
                </p>
                <Button onClick={createDraftAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <Card
                  key={account._id}
                  className={
                    account.isDraft ? "border-orange-200 bg-orange-50/50" : ""
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">
                          {account.name || "Unnamed Account"}
                        </CardTitle>
                        {account.isDraft && (
                          <Badge
                            variant="outline"
                            className="bg-orange-100 text-orange-800 border-orange-300"
                          >
                            Draft
                          </Badge>
                        )}
                        {!canActivateAccount(account) && !account.isDraft && (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800 border-red-300"
                            title="Missing required fields: name, API key, or API secret"
                          >
                            Incomplete
                          </Badge>
                        )}
                        {account.isPrimary && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-300"
                          >
                            Primary
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={getHealthStatusColor(account.healthStatus)}
                        >
                          {getHealthStatusIcon(account.healthStatus)}
                          <span className="ml-1 capitalize">
                            {account.healthStatus}
                          </span>
                        </Badge>
                        <Badge
                          variant={account.isActive ? "default" : "secondary"}
                        >
                          {account.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingAccount === account._id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={saveAccount}
                              disabled={actionLoading[account._id]}
                            >
                              {actionLoading[account._id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              disabled={actionLoading[account._id]}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {canDeleteAccount(account) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteInEditMode(account._id)
                                }
                                disabled={actionLoading[account._id]}
                              >
                                {actionLoading[account._id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(account)}
                              disabled={actionLoading[account._id]}
                            >
                              {actionLoading[account._id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Edit3 className="h-4 w-4" />
                              )}
                            </Button>
                            {!account.isDraft && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleHealthCheck(account._id)}
                                  disabled={
                                    actionLoading[`health_${account._id}`]
                                  }
                                >
                                  {actionLoading[`health_${account._id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Activity className="h-4 w-4" />
                                  )}
                                </Button>
                                {account.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleSuspendAccount(account._id)
                                    }
                                    disabled={actionLoading[account._id]}
                                  >
                                    {actionLoading[account._id] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <PowerOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleActivateAccount(account._id)
                                    }
                                    disabled={actionLoading[account._id] || !canActivateAccount(account)}
                                    title={!canActivateAccount(account) ? "Name, API Key, and API Secret are required to activate" : ""}
                                  >
                                    {actionLoading[account._id] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Power className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {canDeleteAccount(account) && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteAccount(account._id)
                                    }
                                    disabled={actionLoading[account._id]}
                                  >
                                    {actionLoading[account._id] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingAccount === account._id ? (
                      <Tabs defaultValue="basic" className="space-y-4">
                        <TabsList>
                          <TabsTrigger value="basic">
                            Basic Settings
                          </TabsTrigger>
                          <TabsTrigger value="limits">
                            Limits & Priority
                          </TabsTrigger>
                          <TabsTrigger value="advanced">
                            Advanced Settings
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Account Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={editForm.email || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                placeholder="Enter account email"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cloudName">Cloud Name</Label>
                              <Input
                                id="cloudName"
                                value={editForm.cloudName || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    cloudName: e.target.value,
                                  }))
                                }
                                placeholder="Enter cloud name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="apiKey">API Key</Label>
                              <Input
                                id="apiKey"
                                value={editForm.apiKey || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    apiKey: e.target.value,
                                  }))
                                }
                                placeholder="Enter API key"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="apiSecret">API Secret</Label>
                              <div className="flex space-x-2">
                                <Input
                                  id="apiSecret"
                                  type={
                                    showEditSecretKey[account._id]
                                      ? "text"
                                      : "password"
                                  }
                                  value={editForm.apiSecret || ""}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      apiSecret: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter API secret"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    toggleEditSecretKey(account._id)
                                  }
                                >
                                  {showEditSecretKey[account._id] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="defaultFolder">
                                Default Folder
                              </Label>
                              <Input
                                id="defaultFolder"
                                value={editForm.defaultFolder || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    defaultFolder: e.target.value,
                                  }))
                                }
                                placeholder="Enter default folder"
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="limits" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="maxUploadsPerDay">
                                Max Uploads Per Day
                              </Label>
                              <Input
                                id="maxUploadsPerDay"
                                type="number"
                                value={editForm.maxUploadsPerDay || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    maxUploadsPerDay:
                                      parseInt(e.target.value) || 0,
                                  }))
                                }
                                placeholder="1000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="maxUploadsPerMonth">
                                Max Uploads Per Month
                              </Label>
                              <Input
                                id="maxUploadsPerMonth"
                                type="number"
                                value={editForm.maxUploadsPerMonth || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    maxUploadsPerMonth:
                                      parseInt(e.target.value) || 0,
                                  }))
                                }
                                placeholder="25000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="priority">Priority (1-10)</Label>
                              <Input
                                id="priority"
                                type="number"
                                min="1"
                                max="10"
                                value={editForm.priority || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    priority: parseInt(e.target.value) || 1,
                                  }))
                                }
                                placeholder="1"
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Allowed Formats</Label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "jpg",
                                  "jpeg",
                                  "png",
                                  "webp",
                                  "gif",
                                  "svg",
                                ].map((format) => (
                                  <label
                                    key={format}
                                    className="flex items-center space-x-2"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        editForm.settings?.allowedFormats?.includes(
                                          format
                                        ) || false
                                      }
                                      onChange={(e) => {
                                        const formats =
                                          editForm.settings?.allowedFormats ||
                                          [];
                                        if (e.target.checked) {
                                          setEditForm((prev) => ({
                                            ...prev,
                                            settings: {
                                              ...prev.settings,
                                              allowedFormats: [
                                                ...formats,
                                                format,
                                              ],
                                            },
                                          }));
                                        } else {
                                          setEditForm((prev) => ({
                                            ...prev,
                                            settings: {
                                              ...prev.settings,
                                              allowedFormats: formats.filter(
                                                (f) => f !== format
                                              ),
                                            },
                                          }));
                                        }
                                      }}
                                    />
                                    <span className="text-sm">
                                      {format.toUpperCase()}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="maxFileSize">
                                  Max File Size (bytes)
                                </Label>
                                <Input
                                  id="maxFileSize"
                                  type="number"
                                  value={editForm.settings?.maxFileSize || ""}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        maxFileSize:
                                          parseInt(e.target.value) || 0,
                                      },
                                    }))
                                  }
                                  placeholder="10485760"
                                />
                                <p className="text-xs text-gray-500">
                                  10MB = 10485760 bytes
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-6">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    editForm.settings?.autoOptimize || false
                                  }
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        autoOptimize: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">
                                  Auto Optimize Images
                                </span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    editForm.settings?.generateThumbnails ||
                                    false
                                  }
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      settings: {
                                        ...prev.settings,
                                        generateThumbnails: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">
                                  Generate Thumbnails
                                </span>
                              </label>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Email
                            </p>
                            <p className="text-sm">
                              {account.email || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Cloud Name
                            </p>
                            <p className="text-sm">
                              {account.cloudName || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              API Key
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm">
                                {showSensitive[account._id]
                                  ? account.apiKey
                                  : "••••••••••••••••"}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSensitiveData(account._id)}
                              >
                                {showSensitive[account._id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Priority
                            </p>
                            <p className="text-sm">Level {account.priority}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Upload Count
                            </p>
                            <p className="text-sm">{account.uploadCount}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Default Folder
                            </p>
                            <p className="text-sm">{account.defaultFolder}</p>
                          </div>
                        </div>

                        {!account.isDraft && (
                          <>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm">
                                  <span>Daily Usage</span>
                                  <span>
                                    {account.dailyStats?.uploadsToday || 0} /{" "}
                                    {account.maxUploadsPerDay}
                                  </span>
                                </div>
                                <Progress
                                  value={account.dailyUsagePercentage || 0}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-sm">
                                  <span>Monthly Usage</span>
                                  <span>
                                    {account.monthlyStats?.uploadsThisMonth ||
                                      0}{" "}
                                    / {account.maxUploadsPerMonth}
                                  </span>
                                </div>
                                <Progress
                                  value={account.monthlyUsagePercentage || 0}
                                  className="mt-1"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  Last Used
                                </p>
                                <p className="text-sm flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(account.lastUsed)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  Last Health Check
                                </p>
                                <p className="text-sm flex items-center">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {formatDate(account.lastHealthCheck)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  Error Count
                                </p>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm">
                                    {account.errorCount}
                                  </p>
                                  {account.errorCount > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleResetErrors(account._id)
                                      }
                                      disabled={
                                        actionLoading[`reset_${account._id}`]
                                      }
                                    >
                                      {actionLoading[`reset_${account._id}`] ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {account.lastError && (
                              <div className="pt-4 border-t">
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                  Last Error
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                  <p className="text-sm text-red-700">
                                    {account.lastError.message}
                                  </p>
                                  <p className="text-xs text-red-500 mt-1">
                                    {formatDate(account.lastError.timestamp)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
