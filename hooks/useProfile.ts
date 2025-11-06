import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

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
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      if (!user?.id) return { success: false } as const;
      const updates: any = {
        full_name: data.name,
        phone: data.phone,
        address: data.address,
      };
      const { error } = await supabase
        .from('couriers')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
      return { success: true } as const;
    },
    onSuccess: async () => {
      await refreshUserData();
      profileQuery.refetch();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) throw error;
      return { success: true } as const;
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      if (!user?.id) return { success: false, url: '' } as const;
      const fileName = `avatar-${Date.now()}.jpg`;
      const res = await fetch(imageUri);
      const blob = await res.blob();
      const path = `${user.id}/${fileName}`;
      const { error } = await supabase.storage.from('motofast-documents').upload(path, blob, { upsert: true });
      if (error) throw error;
      const pub = supabase.storage.from('motofast-documents').getPublicUrl(path);
      const publicUrl = pub.data.publicUrl;
      const { error: upErr } = await supabase.from('couriers').update({ photo_url: publicUrl }).eq('user_id', user.id);
      if (upErr) throw upErr;
      return { success: true as const, url: publicUrl };
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
