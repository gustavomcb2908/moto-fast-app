import { useMutation, useQuery } from '@tanstack/react-query';
import { trpcClient } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  licenseNumber?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export function useProfile() {
  const auth = useAuth() as ReturnType<typeof useAuth> | undefined;

  const user = auth?.user ?? null;
  const refreshUserData = auth?.refreshUserData ?? (async () => {});

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const result = await trpcClient.auth.me.query();
      return result.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      console.log('Updating profile:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: async () => {
      await refreshUserData();
      profileQuery.refetch();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      console.log('Changing password...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      console.log('Uploading avatar:', imageUri);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, url: imageUri };
    },
    onSuccess: async () => {
      await refreshUserData();
      profileQuery.refetch();
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    refetch: profileQuery.refetch,
  };
}
