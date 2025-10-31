import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, XCircle, Mail } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token && email) {
      handleVerification();
    } else {
      setStatus('error');
      setMessage('Link de verificação inválido');
    }
  }, [token, email]);

  const handleVerification = async () => {
    if (!token || !email) return;

    const result = await verifyEmail(email, token);

    if (result.success) {
      setStatus('success');
      setMessage(result.message || 'E-mail verificado com sucesso!');
    } else {
      setStatus('error');
      setMessage(result.error || 'Erro ao verificar e-mail');
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      router.replace('/login');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.title}>Verificando e-mail...</Text>
            <Text style={styles.message}>Por favor, aguarde</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={80} color="#16A34A" />
            <Text style={styles.title}>Sucesso!</Text>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.subtitle}>
              Agora você pode fazer login com suas credenciais
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={80} color="#DC2626" />
            <Text style={[styles.title, styles.errorTitle]}>Erro</Text>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.subtitle}>
              O link pode ter expirado ou já foi usado. Por favor, solicite um novo link de verificação.
            </Text>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            status === 'error' && styles.buttonError,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>
            {status === 'success' ? 'Ir para Login' : 'Voltar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#DC2626',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 32,
    minWidth: 200,
  },
  buttonError: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
