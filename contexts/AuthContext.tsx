import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthAPI, ProfilesAPI } from '@/services/api';
import { supabase } from '@/lib/supabaseClient';

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
  hasOwnMotorcycle: boolean;
  vehicleId: string | null;
  acceptTerms: boolean;
  idDocument: string | null;
  drivingLicense: string | null;
  addressProof: string | null;
  selfie: string | null;
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
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData } = await AuthAPI.getUser();
        const session = sessionData.session ?? null;
        const spUser = userData.user ?? null;

        if (session && spUser) {
          const profile = await ProfilesAPI.getCourierByUserId(spUser.id).catch(() => null);
          const composedUser: User = {
            id: spUser.id,
            name: (profile as any)?.full_name ?? spUser.user_metadata?.full_name ?? spUser.email ?? 'User',
            email: spUser.email ?? '',
            phone: (profile as any)?.phone ?? '',
            kyc_status: ((profile as any)?.kyc_status ?? 'pending') as User['kyc_status'],
            email_verified: !!spUser.email_confirmed_at,
          };

          await AsyncStorage.setItem('access_token', session.access_token);
          await AsyncStorage.setItem('refresh_token', session.refresh_token ?? '');
          await AsyncStorage.setItem('user', JSON.stringify(composedUser));

          setAuthState({
            user: composedUser,
            accessToken: session.access_token,
            refreshToken: session.refresh_token ?? null,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        console.error('Error initializing auth', e);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }

      unsub = AuthAPI.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await ProfilesAPI.getCourierByUserId(session.user.id).catch(() => null);
          const composedUser: User = {
            id: session.user.id,
            name: (profile as any)?.full_name ?? session.user.user_metadata?.full_name ?? session.user.email ?? 'User',
            email: session.user.email ?? '',
            phone: (profile as any)?.phone ?? '',
            kyc_status: ((profile as any)?.kyc_status ?? 'pending') as User['kyc_status'],
            email_verified: !!session.user.email_confirmed_at,
          };
          await AsyncStorage.setItem('access_token', session.access_token);
          await AsyncStorage.setItem('refresh_token', session.refresh_token ?? '');
          await AsyncStorage.setItem('user', JSON.stringify(composedUser));
          setAuthState(prev => ({
            ...prev,
            user: composedUser,
            accessToken: session.access_token,
            refreshToken: session.refresh_token ?? null,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          await AsyncStorage.multiRemove(['access_token','refresh_token','user']);
          setAuthState({ user: null, accessToken: null, refreshToken: null, isLoading: false, isAuthenticated: false });
        }
      });
    })();

    return () => {
      try {
        unsub?.data.subscription.unsubscribe();
      } catch {}
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login (Supabase)...');
      const { data, error } = await AuthAPI.login(email, password);
      if (error || !data.session || !data.user) {
        return { success: false, error: error?.message || 'Erro ao fazer login' } as const;
      }
      const session = data.session;
      const profile = await ProfilesAPI.getCourierByUserId(data.user.id).catch(() => null);
      const composedUser: User = {
        id: data.user.id,
        name: (profile as any)?.full_name ?? data.user.user_metadata?.full_name ?? data.user.email ?? 'User',
        email: data.user.email ?? '',
        phone: (profile as any)?.phone ?? '',
        kyc_status: ((profile as any)?.kyc_status ?? 'pending') as User['kyc_status'],
        email_verified: !!data.user.email_confirmed_at,
      };

      await AsyncStorage.setItem('access_token', session.access_token);
      await AsyncStorage.setItem('refresh_token', session.refresh_token ?? '');
      await AsyncStorage.setItem('user', JSON.stringify(composedUser));

      setAuthState({
        user: composedUser,
        accessToken: session.access_token,
        refreshToken: session.refresh_token ?? null,
        isLoading: false,
        isAuthenticated: true,
      });

      console.log('✅ Login successful');
      return { success: true } as const;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { success: false, error: error?.message || 'Erro ao fazer login' } as const;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      console.log('📝 Attempting registration (Supabase)...', {
        email: userData.email,
        hasDocs: !!(userData.idDocument || userData.drivingLicense || userData.addressProof || userData.selfie),
      });

      const { data, error } = await supabase.auth.signUp({
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        options: {
          data: {
            full_name: userData.name.trim(),
            phone: userData.phone,
            hasOwnMotorcycle: userData.hasOwnMotorcycle ?? false,
            vehicleId: userData.vehicleId,
            acceptTerms: userData.acceptTerms === true,
          },
        },
      });

      if (error) {
        console.error('❌ Erro ao registrar:', error);
        return { success: false, error: error.message } as const;
      }

      const signedUserEmail = data.user?.email ?? userData.email;

      // NOTE: RLS prevents uploading documents before email verification. We defer uploads post-verification.
      // The DB trigger will create a couriers row when the user confirms email.

      console.log('✅ Registro concluído com sucesso:', { email: signedUserEmail });
      return {
        success: true,
        message: 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.',
        requiresVerification: true,
        email: signedUserEmail,
      } as const;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error?.message || 'Erro ao registar' } as const;
    }
  }, []);

  const verifyEmail = useCallback(async (_email: string, _token: string) => {
    return { success: true, message: 'Verifique seu e-mail e siga o link de confirmação enviado pelo Supabase.' } as const;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { success: false, error: error.message } as const;
      return { success: true, message: 'E-mail de verificação reenviado.' } as const;
    } catch (error: any) {
      return { success: false, error: error?.message || 'Erro ao reenviar verificação' } as const;
    }
  }, []);

  const recoverPassword = useCallback(async (email: string) => {
    try {
      const { error } = await AuthAPI.resetPassword(email, process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT ?? undefined);
      if (error) return { success: false, error: error.message } as const;
      return { success: true, message: 'Se existir uma conta, enviamos instruções de recuperação para o e-mail informado.' } as const;
    } catch (error: any) {
      return { success: false, error: error?.message || 'Erro ao recuperar senha' } as const;
    }
  }, []);

  const resetPassword = useCallback(async (_email: string, _token: string, newPassword: string) => {
    try {
      const { error } = await AuthAPI.updatePassword(newPassword);
      if (error) return { success: false, error: error.message } as const;
      return { success: true, message: 'Senha atualizada com sucesso.' } as const;
    } catch (error: any) {
      return { success: false, error: error?.message || 'Erro ao redefinir senha' } as const;
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) throw new Error('No session');
      await AsyncStorage.setItem('access_token', session.access_token);
      if (session.refresh_token) await AsyncStorage.setItem('refresh_token', session.refresh_token);
      setAuthState(prev => ({ ...prev, accessToken: session.access_token, refreshToken: session.refresh_token ?? prev.refreshToken }));
      return { success: true } as const;
    } catch (e) {
      try { await AuthAPI.logout(); } catch {}
      await AsyncStorage.multiRemove(['access_token','refresh_token','user']);
      setAuthState({ user: null, accessToken: null, refreshToken: null, isLoading: false, isAuthenticated: false });
      return { success: false } as const;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
      await AsyncStorage.multiRemove(['access_token','refresh_token','user']);
      setAuthState({ user: null, accessToken: null, refreshToken: null, isLoading: false, isAuthenticated: false });
      console.log('🚪 Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const bypassDemoLogin = useCallback(async () => {
    try {
      console.log('🧪 Activating demo bypass login');
      const demoUser: User = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Demo Rider',
        email: 'demo@moto.fast',
        phone: '+000000000',
        kyc_status: 'approved',
        email_verified: true,
      };
      await AsyncStorage.setItem('access_token', 'demo');
      await AsyncStorage.setItem('refresh_token', 'demo');
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      setAuthState({
        user: demoUser,
        accessToken: 'demo',
        refreshToken: 'demo',
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true } as const;
    } catch (error) {
      console.error('Bypass demo login failed:', error);
      return { success: false, error: 'Falha ao iniciar demo' } as const;
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      if (!authState.isAuthenticated) return;
      const { data } = await AuthAPI.getUser();
      if (data.user) {
        const profile = await ProfilesAPI.getCourierByUserId(data.user.id).catch(() => null);
        const composedUser: User = {
          id: data.user.id,
          name: (profile as any)?.full_name ?? data.user.user_metadata?.full_name ?? data.user.email ?? 'User',
          email: data.user.email ?? '',
          phone: (profile as any)?.phone ?? '',
          kyc_status: ((profile as any)?.kyc_status ?? 'pending') as User['kyc_status'],
          email_verified: !!data.user.email_confirmed_at,
        };
        await AsyncStorage.setItem('user', JSON.stringify(composedUser));
        setAuthState(prev => ({ ...prev, user: composedUser }));
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
    bypassDemoLogin,
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
    bypassDemoLogin,
  ]);
});
