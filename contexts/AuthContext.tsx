import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'courier';
  vehicleId?: string;
}

export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted';

export interface KYCData {
  status: KYCStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reason?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  kycStatus: KYCData | null;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    kycStatus: null,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      const kycStr = await AsyncStorage.getItem('kyc_status');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        const kycStatus = kycStr ? JSON.parse(kycStr) : null;
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
          kycStatus,
        });
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
      const mockUser: User = {
        id: 'c001',
        name: 'João Estafeta',
        email,
        phone: '+351 912 345 678',
        role: 'courier',
        vehicleId: 'v123',
      };
      const mockToken = 'mock-jwt-token-12345';
      const mockKYC: KYCData = {
        status: 'approved',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('kyc_status', JSON.stringify(mockKYC));

      setAuthState({
        user: mockUser,
        token: mockToken,
        isLoading: false,
        isAuthenticated: true,
        kycStatus: mockKYC,
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    try {
      const newUser: User = {
        id: 'c' + Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'courier',
        vehicleId: userData.vehicleId,
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      const newKYC: KYCData = {
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await AsyncStorage.setItem('kyc_status', JSON.stringify(newKYC));

      setAuthState({
        user: newUser,
        token: mockToken,
        isLoading: false,
        isAuthenticated: true,
        kycStatus: newKYC,
      });

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Erro ao registar' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('kyc_status');
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        kycStatus: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateKYCStatus = useCallback(async (kycData: KYCData) => {
    try {
      await AsyncStorage.setItem('kyc_status', JSON.stringify(kycData));
      setAuthState(prev => ({
        ...prev,
        kycStatus: kycData,
      }));
      return { success: true };
    } catch (error) {
      console.error('Update KYC error:', error);
      return { success: false, error: 'Erro ao atualizar status KYC' };
    }
  }, []);

  return useMemo(() => ({
    ...authState,
    login,
    register,
    logout,
    updateKYCStatus,
  }), [authState, login, register, logout, updateKYCStatus]);
});
