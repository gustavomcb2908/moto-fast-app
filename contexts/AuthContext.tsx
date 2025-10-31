import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpcClient } from '@/lib/trpc';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  email_verified: boolean;
}

export type KYCStatus = 'pending' | 'approved' | 'rejected';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleId?: string;
  documents?: {
    id_document?: string;
    driver_license?: string;
    proof_of_address?: string;
    selfie?: string;
  };
  accept_terms: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr);
        setAuthState({
          user,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true,
        });
        
        try {
          const meData = await trpcClient.auth.me.query();
          if (meData.success) {
            const updatedUser = meData.data;
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setAuthState(prev => ({
              ...prev,
              user: updatedUser as User,
            }));
          }
        } catch (error) {
          console.log('Failed to refresh user data, using stored data');
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...');
      const result = await trpcClient.auth.login.mutate({ email, password });

      if (result.success && result.data) {
        const { accessToken, refreshToken, user } = result.data;

        await AsyncStorage.setItem('access_token', accessToken);
        await AsyncStorage.setItem('refresh_token', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        setAuthState({
          user: user as User,
          accessToken,
          refreshToken,
          isLoading: false,
          isAuthenticated: true,
        });

        console.log('✅ Login successful');
        return { success: true };
      }

      return { success: false, error: 'Erro ao fazer login' };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error?.message || 'Erro ao fazer login' 
      };
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      console.log('📝 Attempting registration...');
      const result = await trpcClient.auth.register.mutate(userData);

      if (result.success) {
        console.log('✅ Registration successful');
        return { 
          success: true,
          message: result.message,
          requiresVerification: true,
        };
      }

      return { success: false, error: 'Erro ao registar' };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: error?.message || 'Erro ao registar' 
      };
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, token: string) => {
    try {
      console.log('📧 Verifying email...');
      const result = await trpcClient.auth.verifyEmail.mutate({ email, token });

      if (result.success) {
        console.log('✅ Email verified');
        return { success: true, message: result.message };
      }

      return { success: false, error: 'Erro ao verificar e-mail' };
    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      return { 
        success: false, 
        error: error?.message || 'Erro ao verificar e-mail' 
      };
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      console.log('📧 Resending verification...');
      const result = await trpcClient.auth.resendVerification.mutate({ email });

      if (result.success) {
        console.log('✅ Verification email resent');
        return { success: true, message: result.message };
      }

      return { success: false, error: 'Erro ao reenviar verificação' };
    } catch (error: any) {
      console.error('❌ Resend verification error:', error);
      return { 
        success: false, 
        error: error?.message || 'Erro ao reenviar verificação' 
      };
    }
  }, []);

  const recoverPassword = useCallback(async (email: string) => {
    try {
      console.log('🔑 Requesting password recovery...');
      const result = await trpcClient.auth.recover.mutate({ email });

      if (result.success) {
        console.log('✅ Recovery email sent');
        return { success: true, message: result.message };
      }

      return { success: false, error: 'Erro ao recuperar senha' };
    } catch (error: any) {
      console.error('❌ Password recovery error:', error);
      return { 
        success: false, 
        error: error?.message || 'Erro ao recuperar senha' 
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, token: string, newPassword: string) => {
    try {
      console.log('🔑 Resetting password...');
      const result = await trpcClient.auth.resetPassword.mutate({ 
        email, 
        token, 
        newPassword 
      });

      if (result.success) {
        console.log('✅ Password reset successful');
        return { success: true, message: result.message };
      }

      return { success: false, error: 'Erro ao redefinir senha' };
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      return { 
        success: false, 
        error: error?.message || 'Erro ao redefinir senha' 
      };
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const currentRefreshToken = authState.refreshToken;
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing tokens...');
      const result = await trpcClient.auth.refresh.mutate({ 
        refreshToken: currentRefreshToken 
      });

      if (result.success && result.data) {
        const { accessToken, refreshToken } = result.data;

        await AsyncStorage.setItem('access_token', accessToken);
        await AsyncStorage.setItem('refresh_token', refreshToken);

        setAuthState(prev => ({
          ...prev,
          accessToken,
          refreshToken,
        }));

        console.log('✅ Tokens refreshed');
        return { success: true };
      }

      return { success: false };
    } catch (error: any) {
      console.error('❌ Token refresh error:', error);
      await logout();
      return { success: false };
    }
  }, [authState.refreshToken]);

  const logout = useCallback(async () => {
    try {
      if (authState.refreshToken) {
        await trpcClient.auth.logout.mutate({ 
          refreshToken: authState.refreshToken 
        });
      }

      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
      
      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      });

      console.log('🚪 Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [authState.refreshToken]);

  const refreshUserData = useCallback(async () => {
    try {
      if (!authState.isAuthenticated) return;

      const meData = await trpcClient.auth.me.query();
      if (meData.success) {
        const updatedUser = meData.data;
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setAuthState(prev => ({
          ...prev,
          user: updatedUser as User,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [authState.isAuthenticated]);

  return useMemo(() => ({
    ...authState,
    login,
    register,
    verifyEmail,
    resendVerification,
    recoverPassword,
    resetPassword,
    logout,
    refreshTokens,
    refreshUserData,
  }), [
    authState, 
    login, 
    register, 
    verifyEmail,
    resendVerification,
    recoverPassword,
    resetPassword,
    logout,
    refreshTokens,
    refreshUserData,
  ]);
});
