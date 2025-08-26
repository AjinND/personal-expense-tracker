// Hook for using profile API with proper error handling
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { profileApi } from '@/services/profile-api';
import { PasswordChangeData } from '@/types/profile';

export const useProfileApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await apiCall();
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.error || error.message || "An error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    changePassword: (data: PasswordChangeData) => 
      executeApiCall(() => profileApi.changePassword(data), "Password changed successfully"),
    
    sendVerificationEmail: () => 
      executeApiCall(() => profileApi.sendVerificationEmail(), "Verification email sent"),
    
    deleteAccount: (password: string, confirmation: string) => 
      executeApiCall(() => profileApi.deleteAccount(password, confirmation)),
    
    getActivityLogs: (page?: number, limit?: number) => 
      executeApiCall(() => profileApi.getActivityLogs(page, limit)),
    
    updateProfile: (data: Parameters<typeof profileApi.updateProfile>[0]) => 
      executeApiCall(() => profileApi.updateProfile(data), "Profile updated successfully"),
  };
};