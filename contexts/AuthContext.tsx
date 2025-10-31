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

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
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

      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        token: mockToken,
        isLoading: false,
        isAuthenticated: true,
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

      await AsyncStorage.setItem('auth_token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setAuthState({
        user: newUser,
        token: mockToken,
        isLoading: false,
        isAuthenticated: true,
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
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return useMemo(() => ({
    ...authState,
    login,
    register,
    logout,
  }), [authState, login, register, logout]);
});
