// src/app/(auth)/profile/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  User as UserIcon,
  Mail,
  Lock,
  Bell,
  Shield,
  Trash2,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Download,
  Camera,
  Monitor,
  Smartphone,
  XCircle,
  Activity,
  Clock,
  Globe,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkPasswordStrength } from '@/lib/auth-validation';
import { useProfileApi } from '@/hooks/useProfileApi';
import { ActivityLog } from '@/types/profile';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const profileApi = useProfileApi();
  
  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  
  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Delete account states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  
  // Activity log states
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // Email verification state
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    monthlyBudget: user?.monthlyBudget || 0,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    budgetAlerts: true,
    weeklyReport: false,
    monthlyReport: true,
  });

  if (!user) return null;

  const passwordStrength = checkPasswordStrength(passwordData.newPassword);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPasswordStrengthText = (score: number) => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[score] || 'Very Weak';
  };

  const formatActivityAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      login: 'Logged in',
      logout: 'Logged out',
      register: 'Account created',
      password_changed: 'Changed password',
      password_change_failed: 'Failed password change attempt',
      email_verified: 'Verified email',
      email_verification_requested: 'Requested email verification',
      profile_updated: 'Updated profile',
      account_deleted: 'Deleted account',
      account_deletion_failed: 'Failed account deletion',
      budget_updated: 'Updated budget',
      expense_added: 'Added expense',
      expense_deleted: 'Deleted expense',
      data_exported: 'Exported data',
      session_revoked: 'Revoked session',
      failed_login_attempt: 'Failed login attempt',
      account_locked: 'Account locked',
      account_unlocked: 'Account unlocked'
    };
    return actionMap[action] || action.replace(/_/g, ' ');
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('failed') || action === 'account_locked') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (action === 'email_verified' || action === 'account_unlocked') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (action.includes('delete')) {
      return <Trash2 className="h-5 w-5 text-orange-500" />;
    }
    return <Activity className="h-5 w-5 text-blue-500" />;
  };

  // Load activity logs
  useEffect(() => {
    loadActivities();
  }, [activityPage]);

  const loadActivities = async () => {
    setIsLoadingActivities(true);
    const result = await profileApi.getActivityLogs(activityPage, 20);
    if (result) {
      if (activityPage === 1) {
        setActivities(result.data);
      } else {
        setActivities(prev => [...prev, ...result.data]);
      }
      setHasMoreActivities(result.pagination.page < result.pagination.totalPages);
    }
    setIsLoadingActivities(false);
  };

  const loadMoreActivities = () => {
    if (!isLoadingActivities && hasMoreActivities) {
      setActivityPage(prev => prev + 1);
    }
  };

  const validatePasswords = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!passwordStrength.isValid) {
      errors.newPassword = 'Password is too weak';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword;
  };

  const handleSaveProfile = async () => {
    const result = await profileApi.updateProfile(profileData);
    if (result) {
      updateUser(profileData);
      setIsEditing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setIsChangingPassword(true);
    const result = await profileApi.changePassword(passwordData);
    if (result) {
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Reload activities to show password change
      setActivityPage(1);
      await loadActivities();
    }
    setIsChangingPassword(false);
  };

  const handleSendVerificationEmail = async () => {
    setIsSendingVerification(true);
    await profileApi.sendVerificationEmail();
    setIsSendingVerification(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Invalid confirmation",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    if (!deletePassword) {
      toast({
        title: "Password required",
        description: "Please enter your password to delete your account",
        variant: "destructive",
      });
      return;
    }

    const result = await profileApi.deleteAccount(deletePassword, deleteConfirmation);
    if (result) {
      // Logout and redirect
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleExportData = async (format: 'csv' | 'excel' | 'pdf') => {
    toast({
      title: "Export started",
      description: `Preparing your data export in ${format.toUpperCase()} format...`,
    });
    // TODO: Implement actual export functionality
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account settings and preferences"
        icon={UserIcon}
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">JPG or PNG. Max size 2MB.</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="space-y-2">
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                      {!user.emailVerified && (
                        <Alert className="py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Email not verified. 
                            <Button
                              variant="link"
                              size="sm"
                              className="px-1"
                              onClick={handleSendVerificationEmail}
                              disabled={isSendingVerification}
                            >
                              {isSendingVerification ? 'Sending...' : 'Send verification email'}
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="budget">Monthly Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="budget"
                      type="number"
                      value={profileData.monthlyBudget}
                      onChange={(e) => setProfileData({ ...profileData, monthlyBudget: Number(e.target.value) })}
                      disabled={!isEditing}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          name: user.name,
                          email: user.email,
                          monthlyBudget: user.monthlyBudget || 0,
                        });
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={profileApi.loading}>
                      {profileApi.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-gray-500">Free Plan</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Email Verification</p>
                  <Badge variant={user.emailVerified ? "default" : "outline"}>
                    {user.emailVerified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              {isChangingPassword ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className={passwordErrors.currentPassword ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className={passwordErrors.newPassword ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                    )}
                    
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Password strength:</span>
                          <span className={`text-sm font-medium ${
                            passwordStrength.score <= 1 ? 'text-red-600' :
                            passwordStrength.score === 2 ? 'text-orange-600' :
                            passwordStrength.score === 3 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {getPasswordStrengthText(passwordStrength.score)}
                          </span>
                        </div>
                        <Progress 
                          value={(passwordStrength.score / 4) * 100} 
                          className="h-2"
                        />
                        {passwordStrength.feedback.length > 0 && (
                          <ul className="text-xs text-gray-500 space-y-1">
                            {passwordStrength.feedback.map((tip, index) => (
                              <li key={`feedback-${index}`}>• {tip}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={profileApi.loading}
                    >
                      {profileApi.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Ensure your account is using a long, random password to stay secure.
                  </p>
                  <Button onClick={() => setIsChangingPassword(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2FA Status</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Badge variant="outline">Not Enabled</Badge>
              </div>
              <Button className="mt-4" variant="outline" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 && !isLoadingActivities ? (
                  <p className="text-center text-gray-500 py-8">No activity recorded yet</p>
                ) : (
                  activities.map((activity, index) => (
                    <div 
                      key={activity.id || `activity-${index}`} 
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">
                          {formatActivityAction(activity.action)}
                        </p>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(activity.createdAt).toLocaleString()}</span>
                          </div>
                          {activity.ipAddress && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>{activity.ipAddress}</span>
                            </div>
                          )}
                          {activity.userAgent && (
                            <div className="flex items-center space-x-1">
                              {getDeviceIcon(activity.userAgent)}
                              <span>{activity.userAgent}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {hasMoreActivities && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={loadMoreActivities}
                  disabled={isLoadingActivities}
                >
                  {isLoadingActivities ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {key === 'emailAlerts' && 'Email Alerts'}
                      {key === 'budgetAlerts' && 'Budget Alerts'}
                      {key === 'weeklyReport' && 'Weekly Reports'}
                      {key === 'monthlyReport' && 'Monthly Reports'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {key === 'emailAlerts' && 'Receive email notifications for important updates'}
                      {key === 'budgetAlerts' && 'Get notified when you\'re close to budget limits'}
                      {key === 'weeklyReport' && 'Weekly summary of your expenses'}
                      {key === 'monthlyReport' && 'Detailed monthly expense report'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, [key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Privacy Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Download a copy of your expense data in various formats.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleExportData('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" onClick={() => handleExportData('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Excel
                </Button>
                <Button variant="outline" onClick={() => handleExportData('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-gray-500">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                      <Alert className="border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="delete-password">Enter your password</Label>
                        <div className="relative">
                          <Input
                            id="delete-password"
                            type={showDeletePassword ? "text" : "password"}
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowDeletePassword(!showDeletePassword)}
                          >
                            {showDeletePassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation">
                          Type <span className="font-mono font-bold">DELETE</span> to confirm:
                        </Label>
                        <Input 
                          id="delete-confirmation"
                          placeholder="Type DELETE to confirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {
                        setDeletePassword('');
                        setDeleteConfirmation('');
                      }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={profileApi.loading || deleteConfirmation !== 'DELETE' || !deletePassword}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        {profileApi.loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}